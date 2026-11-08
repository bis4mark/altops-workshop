import { useRef, useState } from "react";
import { REF_OBJECTS } from "../../lib/constants";
import { canvasDown, fileToThumb } from "../../lib/image";
import { measurePhoto } from "../../lib/measure";
import { LOCAL_REFERENCES } from "../../lib/measureGeometry";
import { inputCls } from "../primitives";
import CornerPicker from "./CornerPicker";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function MeasurePanel({ j, patch, setLightbox, onUseDims }) {
  const [ref, setRef] = useState(REF_OBJECTS[0]);
  const [customRef, setCustomRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [cam, setCam] = useState(false);
  const [pendingImg, setPendingImg] = useState(null);
  const [picking, setPicking] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  /* Only references with a known size in both directions can anchor a local
     measurement. A tape measure shows a scale but has no fixed extent, so that
     photo has to go to the AI path. */
  const localRef = LOCAL_REFERENCES[ref] ? { ...LOCAL_REFERENCES[ref], label: ref } : null;

  const stopCam = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam(false);
  };

  const startCam = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 } },
      });
      streamRef.current = stream;
      setCam(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setErr("Camera blocked. Allow permission or upload a photo instead.");
    }
  };

  const save = (entry) => {
    patch({
      measurements: [
        { id: Date.now(), date: new Date().toLocaleDateString("en-GB"), ...entry },
        ...(j.measurements || []),
      ].slice(0, 6),
    });
    setPendingImg(null);
    setPicking(false);
  };

  const analyze = async (dataUrl) => {
    setBusy(true);
    setErr(null);
    const refText = ref === "Custom reference object" && customRef ? customRef : ref;
    try {
      const result = await measurePhoto(dataUrl, refText);
      save({ image: dataUrl, result, ref: refText });
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const url = canvasDown(c, 1100, 0.8);
    stopCam();
    setPendingImg(url);
  };

  const onUpload = async (file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setErr(
        `Please upload a JPEG, PNG or WEBP photo. You selected "${file.type || "unknown format"}". ` +
          `If your photo is HEIC, take a screenshot of it first then upload that.`,
      );
      return;
    }
    try {
      const url = await fileToThumb(file, 1100, 0.8);
      setPendingImg(url);
    } catch {
      setErr("Could not read that image. Please use a JPEG, PNG or WEBP photo.");
    }
  };

  return (
    <div>
      {picking && pendingImg ? (
        <CornerPicker
          image={pendingImg}
          reference={localRef}
          onDone={(result) => save({ image: pendingImg, result, ref: ref })}
          onCancel={() => setPicking(false)}
        />
      ) : pendingImg ? (
        <div className="mb-3 rounded-[10px] card p-3">
          <img
            src={pendingImg}
            alt=""
            className="mb-2 max-h-[240px] w-full rounded-lg bg-black object-contain"
          />
          <div className="mb-2 text-xs text-ink-2">
            Pick how to read this photo. Tapping corners measures it here on the phone, for
            free; the AI estimate sends the photo off and can also guess material.
          </div>
          <div className="flex flex-wrap gap-2">
            {localRef && (
              <button
                onClick={() => setPicking(true)}
                className="flex-1 rounded-lg bg-ink p-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
              >
                Tap corners (free, offline)
              </button>
            )}
            <button
              onClick={() => analyze(pendingImg)}
              disabled={busy}
              className="flex-1 rounded-lg border border-amber p-2.5 text-sm font-semibold text-amber-2 transition-colors hover:bg-amber/10 disabled:opacity-50"
            >
              Estimate with AI
            </button>
            <button
              onClick={() => setPendingImg(null)}
              className="rounded-lg px-3 py-2.5 text-sm text-ink-2"
            >
              Cancel
            </button>
          </div>
          {!localRef && (
            <div className="mt-2 text-[11px] text-ink-2">
              {ref} has no fixed size to measure against, so only the AI path can read this
              photo. Pick A4 paper, a brick, a card or a ruler to measure offline.
            </div>
          )}
        </div>
      ) : !cam ? (
        <>
          <div className="mb-3 rounded-[10px] card p-3.5">
            <div className="mb-2 text-xs text-ink-2">
              Place a reference object beside the wood, in the same plane, so the app can work
              out real size. A4, brick, card and ruler measure offline by tapping corners.
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {REF_OBJECTS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRef(r)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs text-ink backdrop-blur transition-colors ${
                    ref === r ? "border-amber bg-amber/20" : "border-line bg-surface"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {ref === "Custom reference object" && (
              <input
                className={`${inputCls} mt-2`}
                value={customRef}
                onChange={(e) => setCustomRef(e.target.value)}
                placeholder="e.g. jerry can 40cm tall"
              />
            )}
          </div>

          <div className="mb-3 flex gap-2">
            <button
              onClick={startCam}
              disabled={busy}
              className="flex-1 rounded-lg bg-ink p-3 font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
            >
              Open camera
            </button>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              disabled={busy}
              className="flex-1 rounded-lg border border-amber p-3 font-semibold text-amber-2 transition-colors active:scale-[0.97] hover:bg-amber/10 disabled:opacity-50"
            >
              Upload photo (JPEG/PNG)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onUpload(e.target.files && e.target.files[0])}
            />
          </div>
        </>
      ) : (
        <div className="relative mb-3 overflow-hidden rounded-[10px] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="block max-h-[60vh] w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-[10%] rounded-lg border-2 border-dashed border-amber/60" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-3.5">
            <button
              onClick={stopCam}
              className="rounded-md bg-white/15 px-3.5 py-2 text-white"
            >
              Cancel
            </button>
            <button
              onClick={capture}
              aria-label="Take photo"
              className="h-[62px] w-[62px] rounded-full border-4 border-white bg-amber"
            />
            <span className="w-[60px]" />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {busy && (
        <div className="p-4 text-center font-semibold text-amber">Analyzing dimensions…</div>
      )}
      {err && (
        <div className="mb-3 rounded-lg bg-alert/10 p-3 text-[13px] text-alert">{err}</div>
      )}

      {(j.measurements || []).map((m) => (
        <div key={m.id} className="mb-2.5 rounded-[10px] card p-3">
          <div className="flex gap-3">
            <img
              src={m.image}
              onClick={() => setLightbox(m.image)}
              alt=""
              className="h-[84px] w-[84px] shrink-0 cursor-pointer rounded-lg object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">
                  {m.result.total_boards} board(s) · {m.result.confidence} confidence
                  {m.result.estimated_error_cm
                    ? ` · ±${m.result.estimated_error_cm} cm`
                    : ""}
                  {m.result.reference_detected === false ? " · reference unclear" : ""}
                </span>
                <span className="text-[11px] text-ink-2">{m.date}</span>
              </div>
              {(m.result.items || []).map((it, i) => (
                <div key={i} className="mt-1.5 text-[13px]">
                  <div className="font-semibold text-ink">
                    {it.label}{" "}
                    <span className="font-mono text-ink-2">
                      {it.length_cm}×{it.width_cm}
                      {it.thickness_cm ? `×${it.thickness_cm}` : ""} cm
                    </span>
                  </div>
                  {(it.material_guess || it.condition) && (
                    <div className="text-[11px] text-ink-2">
                      {[it.material_guess, it.condition].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <button
                    onClick={() => onUseDims(it)}
                    className="mt-1 text-[11px] font-bold text-amber-2"
                  >
                    Use as job dimensions →
                  </button>
                </div>
              ))}
              {m.result.recommended_product && (
                <div className="mt-1 text-[11px] text-amber-2">
                  Best for: {m.result.recommended_product}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
