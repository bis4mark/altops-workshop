"""Synthetic ground-truth tests for measure_core.

No camera, no dataset, no GPU: a pinhole camera projects a scene of known
centimetre dimensions onto pixels, and the core has to recover the dimensions
it was never told. Run with:

    python measure/test_measure_core.py
"""

import unittest

import numpy as np

from measure_core import (
    MeasurementError,
    apply_homography,
    homography,
    measure_boards,
    order_quad,
    quads_from_boxes,
    reference_confidence,
)

IMAGE_W = 3000.0
IMAGE_H = 2000.0

# World plane, in centimetres, with the camera looking down at it.
A4_LONG, A4_SHORT = 29.7, 21.0
REFERENCE_ORIGIN = (0.0, 0.0)

BOARDS = [
    {"label": "Board 1", "x": 40.0, "y": 0.0, "long": 120.0, "short": 60.0},
    {"label": "Board 2", "x": 40.0, "y": 80.0, "long": 200.0, "short": 30.0},
    {"label": "Board 3", "x": 300.0, "y": 0.0, "long": 45.0, "short": 45.0},
]


def camera_homography(focal_px, tilt_deg=0.0, yaw_deg=0.0, height_cm=200.0, centre_cm=(60.0, 40.0)):
    """World plane (z=0, cm) -> pixels, for a pinhole camera looking down.

    `tilt_deg` tips the camera off vertical (the perspective a hand-held phone
    introduces); `yaw_deg` spins it in the plane.
    """
    tilt = np.radians(tilt_deg)
    yaw = np.radians(yaw_deg)
    rx = np.array([[1, 0, 0], [0, np.cos(tilt), -np.sin(tilt)], [0, np.sin(tilt), np.cos(tilt)]])
    rz = np.array([[np.cos(yaw), -np.sin(yaw), 0], [np.sin(yaw), np.cos(yaw), 0], [0, 0, 1]])
    base = np.diag([1.0, -1.0, -1.0])  # looking straight down
    R = base @ rx @ rz
    C = np.array([centre_cm[0], centre_cm[1], height_cm])
    t = -R @ C
    M = np.column_stack([R[:, 0], R[:, 1], t])
    K = np.array([[focal_px, 0, IMAGE_W / 2], [0, focal_px, IMAGE_H / 2], [0, 0, 1]])
    return K @ M


def rect_corners(x, y, long_cm, short_cm):
    return np.array([[x, y], [x + long_cm, y], [x + long_cm, y + short_cm], [x, y + short_cm]])


def project(H, corners):
    return apply_homography(H, corners)


def scene(H):
    ref = {"quad": project(H, rect_corners(*REFERENCE_ORIGIN, A4_LONG, A4_SHORT)), "long_cm": A4_LONG, "short_cm": A4_SHORT}
    boards = [
        {"label": b["label"], "quad": project(H, rect_corners(b["x"], b["y"], b["long"], b["short"]))}
        for b in BOARDS
    ]
    return ref, boards


def assert_dims(test, result, tolerance):
    """Compare each recovered board against the ground truth it was built from."""
    test.assertEqual(len(result["items"]), len(BOARDS))
    worst = 0.0
    for item, truth in zip(result["items"], BOARDS):
        want = (truth["long"], truth["short"])
        got = (item["length_cm"], item["width_cm"])
        worst = max(worst, abs(got[0] - want[0]), abs(got[1] - want[1]))
        test.assertAlmostEqual(got[0], want[0], delta=tolerance, msg=f"{item['label']} length")
        test.assertAlmostEqual(got[1], want[1], delta=tolerance, msg=f"{item['label']} width")
    return worst


class HomographyTests(unittest.TestCase):
    def test_round_trip_is_identity(self):
        src = np.array([[0, 0], [100, 0], [100, 50], [0, 50]], float)
        dst = np.array([[10, 20], [300, 40], [280, 190], [5, 170]], float)
        H = homography(src, dst)
        back = apply_homography(np.linalg.inv(H), dst)
        np.testing.assert_allclose(back, src, atol=1e-8)

    def test_order_quad_is_stable(self):
        quad = np.array([[10, 10], [110, 10], [110, 60], [10, 60]], float)
        shuffled = quad[[2, 0, 3, 1]]
        np.testing.assert_allclose(order_quad(shuffled), order_quad(quad))


class MeasurementTests(unittest.TestCase):
    def test_fronto_parallel_recovers_exact_sizes(self):
        H = camera_homography(focal_px=6000)
        ref, boards = scene(H)
        result = measure_boards(ref, boards, IMAGE_W)
        worst = assert_dims(self, result, tolerance=0.1)
        self.assertLess(worst, 0.05)
        self.assertEqual(result["confidence"], "high")

    def test_tilted_camera_still_exact(self):
        # 20 degrees off vertical: the far edge of a board is measurably smaller
        # than the near edge in pixels, and the homography has to undo it.
        H = camera_homography(focal_px=6000, tilt_deg=20)
        ref, boards = scene(H)
        result = measure_boards(ref, boards, IMAGE_W)
        assert_dims(self, result, tolerance=0.2)

    def test_spun_camera_still_exact(self):
        H = camera_homography(focal_px=6000, yaw_deg=35)
        ref, boards = scene(H)
        result = measure_boards(ref, boards, IMAGE_W)
        assert_dims(self, result, tolerance=0.2)

    def test_corner_order_does_not_matter(self):
        H = camera_homography(focal_px=6000, tilt_deg=15)
        ref, boards = scene(H)
        shuffled = [{"label": b["label"], "quad": np.roll(np.asarray(b["quad"]), 2, axis=0)} for b in boards]
        a = measure_boards(ref, boards, IMAGE_W)
        b = measure_boards(ref, shuffled, IMAGE_W)
        self.assertEqual([i["length_cm"] for i in a["items"]], [i["length_cm"] for i in b["items"]])

    def test_bounding_box_is_worse_than_a_quad(self):
        # The reason the detector must return corners, not boxes: under tilt an
        # axis-aligned box swallows the perspective skew and overstates the size.
        H = camera_homography(focal_px=6000, tilt_deg=25)
        ref, boards = scene(H)
        quad_err = assert_dims(self, measure_boards(ref, boards, IMAGE_W), tolerance=1.0)

        boxes = []
        for b in boards:
            q = np.asarray(b["quad"])
            boxes.append(
                {"label": b["label"], "x1": q[:, 0].min(), "y1": q[:, 1].min(), "x2": q[:, 0].max(), "y2": q[:, 1].max()}
            )
        box_err = assert_dims(self, measure_boards(ref, quads_from_boxes(boxes), IMAGE_W), tolerance=40.0)
        self.assertLess(quad_err, box_err, "a quad should beat its bounding box under tilt")

    def test_confidence_falls_when_the_reference_shrinks(self):
        # A4 spans 29.7 * focal / height pixels, so these give roughly 30%,
        # 12% and 3.5% of the 3000 px frame width.
        wide = camera_homography(focal_px=6000)
        mid = camera_homography(focal_px=2400)
        far = camera_homography(focal_px=700)
        levels = []
        for H in (wide, mid, far):
            ref, boards = scene(H)
            levels.append(measure_boards(ref, boards, IMAGE_W)["confidence"])
        self.assertEqual(levels, ["high", "medium", "low"])

    def test_error_bar_grows_as_the_reference_shrinks(self):
        close = reference_confidence(project(camera_homography(6000), rect_corners(0, 0, A4_LONG, A4_SHORT)), IMAGE_W, A4_LONG)
        far = reference_confidence(project(camera_homography(700), rect_corners(0, 0, A4_LONG, A4_SHORT)), IMAGE_W, A4_LONG)
        self.assertGreater(far["estimated_error_cm"], close["estimated_error_cm"])

    def test_degenerate_reference_raises(self):
        ref = {"quad": [[0, 0], [10, 10], [20, 20], [30, 30]], "long_cm": A4_LONG, "short_cm": A4_SHORT}
        with self.assertRaises(MeasurementError):
            measure_boards(ref, [{"quad": [[0, 0], [50, 0], [50, 50], [0, 50]]}], IMAGE_W)

    def test_tiny_reference_raises(self):
        ref = {"quad": [[0, 0], [8, 0], [8, 6], [0, 6]], "long_cm": A4_LONG, "short_cm": A4_SHORT}
        with self.assertRaises(MeasurementError):
            measure_boards(ref, [{"quad": [[20, 20], [60, 20], [60, 40], [20, 40]]}], IMAGE_W)

    def test_missing_size_raises(self):
        ref = {"quad": [[0, 0], [300, 0], [300, 200], [0, 200]]}
        with self.assertRaises(MeasurementError):
            measure_boards(ref, [{"quad": [[0, 0], [50, 0], [50, 50], [0, 50]]}], IMAGE_W)


if __name__ == "__main__":
    unittest.main(verbosity=2)
