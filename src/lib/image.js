/* Downscale photos before they go into localStorage or off to the API —
   full-res phone shots would blow the storage quota in a few jobs. */

export function fileToThumb(file, max = 1100, q = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", q));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function canvasDown(srcCanvas, max = 1100, q = 0.8) {
  const scale = Math.min(1, max / Math.max(srcCanvas.width, srcCanvas.height));
  const w = Math.round(srcCanvas.width * scale);
  const h = Math.round(srcCanvas.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(srcCanvas, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", q);
}
