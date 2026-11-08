import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Modal from "./ui/Modal";
import { Field, inputCls } from "./primitives";

const missing = (val) => !val || !String(val).trim();

export default function Settings({ open, settings, onSave, onClose, onClearAll, onBackup, onRestore }) {
  const [draft, setDraft] = useState(settings);
  const [more, setMore] = useState(false);
  const [note, setNote] = useState("");
  const up = (key, value) => setDraft((s) => ({ ...s, [key]: value }));

  const invalid = missing(draft.business);

  const save = () => {
    if (invalid) return;
    onSave(draft);
    onClose();
  };

  const backup = () => {
    const count = onBackup();
    setNote(`Saved a backup of ${count} records.`);
  };

  const restore = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Restore this backup? It replaces every job, stock item and timecard in this browser.")) return;
    try {
      const count = await onRestore(file);
      setNote(`Restored ${count} records. Reloading…`);
    } catch (err) {
      setNote(err.message || "That file could not be restored.");
    }
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
          className="inline-flex items-center gap-1 self-start text-[13px] font-semibold text-amber-2"
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

        <div className="mt-1 border-t border-line pt-3">
          <span className="label">Backup</span>
          <p className="mt-1 text-xs text-ink-2">
            Jobs, stock and timecards live only in this browser. Keep a file you can restore on another machine.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={backup} className="btn">
              Download backup
            </button>
            <label className="btn cursor-pointer">
              Restore from file
              <input type="file" accept="application/json,.json" className="hidden" onChange={restore} />
            </label>
          </div>
          {note && <p className="mt-1.5 text-xs text-ink-2">{note}</p>}
        </div>
      </div>
    </Modal>
  );
}
