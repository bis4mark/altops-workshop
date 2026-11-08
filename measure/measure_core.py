"""Monocular measurement core — the geometry half of a local Measure feature.

The detector's only job is to return quads (four corners in pixels): one for the
reference object, one per board. Everything after that is arithmetic, and it
lives here so it can be tested without a camera, a dataset or a GPU.

    reference quad + its real size  ->  homography  ->  board quads  ->  cm

Why a quad and not a bounding box: a phone photo is almost never square-on, so
the far edge of a board is smaller than the near edge. One pixel-to-cm ratio
only holds for a fronto-parallel, single-depth scene. Four corners define a
homography, which removes the perspective, so the ratio is valid everywhere on
that plane.

The boards must lie in the same plane as the reference. Nothing here can see
thickness, because a single top-down view cannot.

Dependencies: numpy only. ArUco detection (optional) uses OpenCV.
"""

from __future__ import annotations

import numpy as np

# A reference smaller than this fraction of the frame width is too coarse to
# trust: at 60 px across an A4's 29.7 cm, one pixel is half a centimetre.
HIGH_SPAN = 0.25
MEDIUM_SPAN = 0.10

# Corner-finding is assumed accurate to about two pixels. That assumption is
# what turns a pixel span into an error bar in centimetres.
CORNER_ERROR_PX = 2.0


class MeasurementError(ValueError):
    """Raised when the input cannot produce a measurement."""


def order_quad(quad) -> np.ndarray:
    """Return the four corners in a stable order: clockwise from top-left.

    Correspondences are meaningless if the corners are listed in a different
    order on each shape, so every quad goes through this before it is used.
    """
    pts = np.asarray(quad, dtype=float)
    if pts.shape != (4, 2):
        raise MeasurementError(f"A quad needs 4 corners as (x, y); got shape {pts.shape}.")
    centre = pts.mean(axis=0)
    angles = np.arctan2(pts[:, 1] - centre[1], pts[:, 0] - centre[0])
    pts = pts[np.argsort(angles)]
    start = int(np.argmin(pts.sum(axis=1)))
    return np.roll(pts, -start, axis=0)


def _normalise(pts: np.ndarray):
    """Hartley normalisation: centre on the centroid, scale to mean distance √2.

    Without this the DLT solves a badly conditioned system and the corners come
    back with visible error at large pixel coordinates.
    """
    centre = pts.mean(axis=0)
    shifted = pts - centre
    mean_dist = np.sqrt((shifted**2).sum(axis=1)).mean()
    scale = np.sqrt(2.0) / mean_dist if mean_dist > 0 else 1.0
    T = np.array([[scale, 0, -scale * centre[0]], [0, scale, -scale * centre[1]], [0, 0, 1.0]])
    return shifted * scale, T


def homography(src, dst) -> np.ndarray:
    """3×3 projective transform taking src corners onto dst corners (DLT)."""
    src_pts = np.asarray(src, dtype=float)
    dst_pts = np.asarray(dst, dtype=float)
    if src_pts.shape != (4, 2) or dst_pts.shape != (4, 2):
        raise MeasurementError("homography() needs two 4×2 point sets.")

    s, Ts = _normalise(src_pts)
    d, Td = _normalise(dst_pts)

    A = []
    for (x, y), (u, v) in zip(s, d):
        A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
        A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
    _, _, vt = np.linalg.svd(np.asarray(A))
    Hn = vt[-1].reshape(3, 3)
    H = np.linalg.inv(Td) @ Hn @ Ts
    if abs(H[2, 2]) > 1e-12:
        H = H / H[2, 2]
    return H


def apply_homography(H: np.ndarray, pts) -> np.ndarray:
    """Map points through H. Accepts (2,) or (N, 2)."""
    P = np.asarray(pts, dtype=float)
    single = P.ndim == 1
    P = np.atleast_2d(P)
    hom = np.hstack([P, np.ones((P.shape[0], 1))])
    out = hom @ H.T
    if np.any(np.abs(out[:, 2]) < 1e-12):
        raise MeasurementError("A point mapped to infinity — the quad is degenerate.")
    out = out[:, :2] / out[:, 2:3]
    return out[0] if single else out


def _side_lengths(quad: np.ndarray):
    """The four edge lengths of an ordered quad, in order."""
    nxt = np.roll(quad, -1, axis=0)
    return np.linalg.norm(nxt - quad, axis=1)


def _span(quad: np.ndarray) -> float:
    return float(_side_lengths(quad).max())


def _aspect(quad: np.ndarray) -> float:
    """Long-side to short-side ratio of an ordered quad."""
    e = _side_lengths(quad)
    long_side = (e[0] + e[2]) / 2.0
    short_side = (e[1] + e[3]) / 2.0
    if short_side <= 0:
        return 0.0
    return float(long_side / short_side)


def align_reference(quad, long_cm: float, short_cm: float) -> np.ndarray:
    """Put the reference corners in the order the cm rectangle expects.

    A plain rectangle carries no orientation cue, so the same four points can be
    matched to the cm rect four ways, and two of those swap its long and short
    sides — a 41% scale error on A4 that still fits the corners perfectly. The
    fix is to pick the assignment whose aspect ratio agrees with the real one,
    which is also what a mirrored or spun camera needs.
    """
    pts = np.asarray(quad, dtype=float)
    if pts.shape != (4, 2):
        raise MeasurementError(f"A quad needs 4 corners as (x, y); got shape {pts.shape}.")
    want = long_cm / short_cm
    best = None
    for winding in (pts, pts[::-1]):
        for shift in range(4):
            candidate = np.roll(winding, shift, axis=0)
            score = abs(np.log(max(_aspect(candidate), 1e-9) / want))
            if best is None or score < best[0]:
                best = (score, candidate)
    return best[1]


def reference_confidence(quad, image_width: float, long_cm: float) -> dict:
    """How much to trust a measurement, derived from how big the reference is.

    This is a real error bar, not a model's opinion: at `cm_per_px`, a corner
    placed two pixels wrong moves the edge by `2 * cm_per_px`.
    """
    ordered = order_quad(quad)
    span_px = _span(ordered)
    if span_px <= 0:
        raise MeasurementError("The reference has no size in the photo.")
    cm_per_px = float(long_cm) / span_px
    ratio = span_px / float(image_width) if image_width else 0.0
    level = "high" if ratio >= HIGH_SPAN else "medium" if ratio >= MEDIUM_SPAN else "low"
    return {
        "confidence": level,
        "reference_span_px": round(span_px, 1),
        "frame_fraction": round(ratio, 3),
        "scale_cm_per_px": round(cm_per_px, 5),
        "estimated_error_cm": round(cm_per_px * CORNER_ERROR_PX, 2),
    }


def measure_boards(reference: dict, boards, image_width: float) -> dict:
    """Measure board quads against a reference quad.

    reference: {"quad": [[x, y] × 4], "long_cm": 29.7, "short_cm": 21.0}
    boards:    [{"label": "Board 1", "quad": [[x, y] × 4]}, ...]

    Returns the same shape /api/measure already answers with, plus the scale and
    error bar, so the panel and stored measurements need no changes.
    """
    if "quad" not in reference:
        raise MeasurementError("The reference needs a quad.")
    long_cm = float(reference.get("long_cm") or 0)
    short_cm = float(reference.get("short_cm") or 0)
    if long_cm <= 0 or short_cm <= 0:
        raise MeasurementError("The reference needs long_cm and short_cm.")

    ref_quad = align_reference(reference["quad"], long_cm, short_cm)
    if _span(ref_quad) < 20:
        raise MeasurementError("The reference is too small in the photo to measure against.")

    # image pixels -> centimetres on the reference plane
    ref_cm = np.array([[0.0, 0.0], [long_cm, 0.0], [long_cm, short_cm], [0.0, short_cm]])
    to_cm = homography(ref_quad, ref_cm)

    items = []
    for i, board in enumerate(boards):
        if "quad" not in board:
            raise MeasurementError(f"Board {i + 1} has no quad.")
        quad = order_quad(board["quad"])
        corners = apply_homography(to_cm, quad)

        edges = _side_lengths(corners)
        length = (edges[0] + edges[2]) / 2.0
        width = (edges[1] + edges[3]) / 2.0
        if width > length:
            length, width = width, length
        if length <= 0 or width <= 0:
            raise MeasurementError(f"Board {i + 1} collapsed to nothing — check its quad.")

        items.append(
            {
                "label": board.get("label") or f"Board {i + 1}",
                "length_cm": round(float(length), 1),
                "width_cm": round(float(width), 1),
                # a single overhead view cannot see thickness; the job's stock
                # item supplies it instead of a guess
                "thickness_cm": None,
                "material_guess": board.get("material_guess"),
                "condition": board.get("condition"),
                "quad": [[round(float(x), 1), round(float(y), 1)] for x, y in quad],
            }
        )

    if not items:
        raise MeasurementError("No boards in that photo.")

    scale = reference_confidence(ref_quad, image_width, long_cm)
    return {
        "items": items,
        "total_boards": len(items),
        "reference_detected": True,
        "recommended_product": None,
        "plane_note": "Boards must sit in the same plane as the reference; thickness is not measurable here.",
        **scale,
    }


def quads_from_boxes(boxes):
    """Axis-aligned boxes -> quads, for a bbox-only detector.

    Convenience for a pilot: a hand-drawn box still works, it just carries the
    perspective error that a real quad removes.
    """
    out = []
    for i, box in enumerate(boxes):
        if isinstance(box, dict):
            x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
            label = box.get("label")
        else:
            x1, y1, x2, y2 = box
            label = None
        out.append({"label": label or f"Board {i + 1}", "quad": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]})
    return out


def mask_to_quad(mask):
    """Tightest rotated rectangle around a binary mask. Needs OpenCV.

    This is the bridge from a YOLO-seg mask to the quad the core wants.
    """
    try:
        import cv2  # noqa: PLC0415 — optional, only needed for masks
    except ImportError as exc:  # pragma: no cover
        raise MeasurementError("mask_to_quad() needs opencv-python installed.") from exc
    contours, _ = cv2.findContours(
        (np.asarray(mask) > 0).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        raise MeasurementError("The mask is empty.")
    rect = cv2.minAreaRect(max(contours, key=cv2.contourArea))
    return cv2.boxPoints(rect).tolist()
