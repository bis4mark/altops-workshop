import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildGeometry3D } from "../../lib/geometry3d";
import { getWoodTexture } from "../../lib/woodTexture";

const SCALE = 1 / 100; // mm -> scene units
const TEXTURE_REPEAT_MM = 150; // grain tile size in real-world mm

function disposeGroup(group) {
  group.children.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  group.clear();
}

function buildMesh(b) {
  if (b.shape === "knob") {
    const geo = new THREE.CylinderGeometry(b.radius * SCALE, b.radius * SCALE, b.height * SCALE, 16);
    geo.rotateZ(Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: "#c9c9c9", metalness: 0.7, roughness: 0.3 });
    return new THREE.Mesh(geo, mat);
  }
  if (b.shape === "bar") {
    const geo = new THREE.BoxGeometry(b.w * SCALE, b.h * SCALE, b.d * SCALE);
    const mat = new THREE.MeshStandardMaterial({ color: "#c9c9c9", metalness: 0.7, roughness: 0.3 });
    return new THREE.Mesh(geo, mat);
  }
  const geo = new THREE.BoxGeometry(b.w * SCALE, b.h * SCALE, b.d * SCALE);
  const map = getWoodTexture(b.textureKey);
  map.repeat.set(b.w / TEXTURE_REPEAT_MM, b.h / TEXTURE_REPEAT_MM);
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.75 });
  return new THREE.Mesh(geo, mat);
}

export default function PreviewPanel({ j }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const groupRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const dirLightRef = useRef(null);
  const [hardwareStyle, setHardwareStyle] = useState("bar");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f4efe7");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 100);
    camera.position.set(4, 3, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 8, 6);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    scene.add(dir);
    scene.add(dir.target);
    dirLightRef.current = dir;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: "#e8e1d4" })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    let raf;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const resize = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resize.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      controls.dispose();
      disposeGroup(group);
      ground.geometry.dispose();
      ground.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const dir = dirLightRef.current;
    if (!group || !scene || !camera || !controls || !dir) return;

    disposeGroup(group);

    const boxes = buildGeometry3D(j, j.plan, hardwareStyle);
    boxes.forEach((b) => {
      const mesh = buildMesh(b);
      mesh.position.set(b.x * SCALE, b.y * SCALE, b.z * SCALE);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    if (boxes.length) {
      const box3 = new THREE.Box3().setFromObject(group);
      const center = box3.getCenter(new THREE.Vector3());
      const size = box3.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z, 0.5);

      controls.target.copy(center);
      camera.position.set(center.x + radius, center.y + radius * 0.7, center.z + radius);
      camera.lookAt(center);

      dir.target.position.copy(center);
      dir.shadow.camera.left = -radius * 1.5;
      dir.shadow.camera.right = radius * 1.5;
      dir.shadow.camera.top = radius * 1.5;
      dir.shadow.camera.bottom = -radius * 1.5;
      dir.shadow.camera.near = 0.1;
      dir.shadow.camera.far = radius * 6;
      dir.shadow.camera.updateProjectionMatrix();
    }
  }, [j.plan, j.W, j.H, j.D, j.type, j.species, hardwareStyle]);

  if (!j.plan) {
    return (
      <div className="rounded-lg bg-alert/10 p-3 text-[13px] text-alert">
        Generate a cut plan on the Plan tab first.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2.5 flex gap-1.5">
        {[
          ["bar", "Bar handle"],
          ["knob", "Round knob"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setHardwareStyle(key)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              hardwareStyle === key ? "bg-ink text-white" : "text-ink hover:bg-sunk"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="h-[420px] w-full rounded-lg border border-line" />
      <div className="mt-2.5 text-xs text-ink-2">
        Wood tone reflects the selected species ({j.species || "default"}). Simplified box preview — not exact joinery.
      </div>
    </div>
  );
}
