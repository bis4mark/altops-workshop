import { useState } from "react";
import { Field, inputCls } from "./primitives";

export default function Settings({ settings, onSave, onClose, onClearAll }) {
  const [draft, setDraft] = useState(settings);
  const up = (key, value) => setDraft((s) => ({ ...s, [key]: value }));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass w-full max-w-[420px] rounded-xl p-5"
      >
        <h2 className="mb-3.5 font-display text-xl font-extrabold">Business details</h2>
        <div className="flex flex-col gap-3">
          <Field label="Business name">
            <input className={inputCls} value={draft.business} onChange={(e) => up("business", e.target.value)} />
          </Field>
          <Field label="Tagline">
            <input className={inputCls} value={draft.tagline} onChange={(e) => up("tagline", e.target.value)} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={draft.location} onChange={(e) => up("location", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={draft.phone} onChange={(e) => up("phone", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm("Delete ALL jobs? This cannot be undone.")) onClearAll();
            }}
            className="text-[13px] text-danger"
          >
            Clear all data
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="rounded-lg bg-esp px-4 py-2.5 font-semibold text-cream"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
