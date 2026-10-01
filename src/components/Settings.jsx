import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Modal from "./ui/Modal";
import { Field, inputCls } from "./primitives";

const missing = (val) => !val || !String(val).trim();

export default function Settings({ open, settings, onSave, onClose, onClearAll }) {
  const [draft, setDraft] = useState(settings);
  const [more, setMore] = useState(false);
  const up = (key, value) => setDraft((s) => ({ ...s, [key]: value }));

  const invalid = missing(draft.business);

  const save = () => {
    if (invalid) return;
    onSave(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Business settings"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={() => {
              if (window.confirm("Delete every job? This cannot be undone.")) onClearAll();
            }}
            className="mr-auto text-[13px] text-alert hover:underline"
          >
            Clear all jobs
          </button>
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button onClick={save} disabled={invalid} className="btn btn-amber">
            Save
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Business name *">
          <input
            className={`${inputCls} ${invalid ? "border-alert focus:border-alert" : ""}`}
            value={draft.business}
            onChange={(e) => up("business", e.target.value)}
          />
          {invalid && <p className="text-xs text-alert">Business name is required.</p>}
        </Field>
        <Field label="Shop floor capacity (concurrent builds)">
          <input
            type="number"
            min="1"
            className={inputCls}
            value={draft.capacity}
            onChange={(e) => up("capacity", Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </Field>

        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-amber"
        >
          <ChevronRight size={14} className={`transition-transform ${more ? "rotate-90" : ""}`} />
          {more ? "Fewer options" : "More options"}
        </button>

        {more && (
          <div className="flex flex-col gap-3">
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
        )}
      </div>
    </Modal>
  );
}
