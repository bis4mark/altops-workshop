import { useRef, useState } from "react";
import { fileToThumb } from "../../lib/image";

export default function PhotosPanel({ j, setJ, setLightbox }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const photos = j.photos || [];

  const add = async (files) => {
    setBusy(true);
    const next = [...photos];
    for (const file of Array.from(files).slice(0, 8 - next.length)) {
      try {
        next.push(await fileToThumb(file, 1000, 0.72));
      } catch {
        /* skip an unreadable file */
      }
    }
    setJ((x) => ({ ...x, photos: next }));
    setBusy(false);
  };

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-bold">Photos ({photos.length}/8)</span>
        <button
          onClick={() => fileRef.current && fileRef.current.click()}
          disabled={busy || photos.length >= 8}
          className="text-[13px] font-semibold text-amber disabled:opacity-50"
        >
          {busy ? "Adding…" : "+ Add photos"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && add(e.target.files)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            <img
              src={p}
              onClick={() => setLightbox(p)}
              alt=""
              className="h-[90px] w-[90px] cursor-pointer rounded-lg border border-line object-cover"
            />
            <button
              onClick={() => setJ((x) => ({ ...x, photos: x.photos.filter((_, k) => k !== i) }))}
              className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-alert text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-ink-2">
        Tip: tick “Show in portfolio” on the Details tab to feature this build publicly.
      </div>
    </div>
  );
}
