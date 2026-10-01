/* Wood-grain textures for the 3D preview.
   Default: procedural canvas-generated grain tinted to the species' tone
   (see WOOD_TYPES in constants.js). Override: drop a real photo at
   public/textures/<slug>.jpg and it's used automatically instead — no
   code change needed. Free CC0 wood photos for that slot: ambientCG.com
   and polyhaven.com (search "wood"). */
import * as THREE from "three";
import { woodByName } from "./constants";

const cache = new Map();

const slug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-");

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade([r, g, b], amt) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
}

function proceduralCanvas(tone) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rgb = hexToRgb(tone);

  ctx.fillStyle = shade(rgb, 0);
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 40; i += 1) {
    const y = (i / 40) * size;
    const amt = Math.sin(i * 1.7) * 18;
    ctx.strokeStyle = shade(rgb, amt);
    ctx.lineWidth = 1 + Math.abs(Math.sin(i)) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 4);
    }
    ctx.stroke();
  }

  return canvas;
}

function finalize(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function getWoodTexture(speciesName) {
  const key = speciesName || "__default";
  if (cache.has(key)) return cache.get(key);

  const tone = woodByName(speciesName).tone;
  const texture = finalize(new THREE.CanvasTexture(proceduralCanvas(tone)));
  cache.set(key, texture);

  const loader = new THREE.TextureLoader();
  loader.load(
    `/textures/${slug(speciesName)}.jpg`,
    (loaded) => {
      finalize(loaded);
      const cached = cache.get(key);
      if (cached) cached.dispose();
      cache.set(key, loaded);
    },
    undefined,
    () => {} // no override file present — keep the procedural fallback
  );

  return texture;
}
