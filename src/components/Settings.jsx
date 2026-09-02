import { useState } from "react";
import Modal from "./ui/Modal";
import { Field, inputCls } from "./primitives";

export default function Settings({ open, settings, onSave, onClose, onClearAll }) {
  const [draft, setDraft] = useState(settings);
  const up = (key, value) => setDraft((s) => ({ ...s, [key]: value }));

  const save = () => {
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
          <button onClick={save} className="btn btn-amber">
            Save
          </button>
        </>
      }
    >
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
        <Field label="Shop floor capacity (concurrent builds)">
          <input
            type="number"
            min="1"
            className={inputCls}
            value={draft.capacity}
            onChange={(e) => up("capacity", Math.max(1, parseInt(e.target.value, 10) || 1))}
          />
        </Field>
      </div>
    </Modal>
  );
}
