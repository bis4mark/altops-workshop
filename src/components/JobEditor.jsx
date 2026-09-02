import { useState } from "react";
import DetailsPanel from "./panels/DetailsPanel";
import MeasurePanel from "./panels/MeasurePanel";
import EstimatePanel from "./panels/EstimatePanel";
import PlanPanel from "./panels/PlanPanel";
import PhotosPanel from "./panels/PhotosPanel";

const TABS = [
  ["details", "Details"],
  ["measure", "Measure"],
  ["estimate", "Estimate"],
  ["plan", "Plan"],
  ["photos", "Photos"],
];

const isDone = (key, job) => {
  if (key === "measure") return (job.measurements || []).length > 0;
  if (key === "estimate") return !!job.estimate;
  if (key === "plan") return !!job.plan;
  return false;
};

export default function JobEditor({ job, settings, onSave, onPatch, onCancel, onDelete, setLightbox }) {
  const [j, setJ] = useState(job);
  const [tab, setTab] = useState("details");

  const up = (key, value) => setJ((x) => ({ ...x, [key]: value }));
  const patch = (partial) => {
    const next = { ...j, ...partial };
    setJ(next);
    onPatch(next);
  };

  return (
    <div className="rounded-xl border border-line bg-card p-[18px]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl font-extrabold">{j.title || "New job"}</h2>
        <button onClick={onCancel} className="text-ink-soft">
          ✕ Close
        </button>
      </div>

      <div className="no-print mb-4 flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map(([key, label]) => {
          const done = isDone(key, j) && tab !== key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                tab === key ? "bg-esp text-cream" : "text-ink hover:bg-panel"
              }`}
            >
              {label}
              {done ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {tab === "details" && <DetailsPanel j={j} up={up} />}
      {tab === "measure" && (
        <MeasurePanel
          j={j}
          patch={patch}
          setLightbox={setLightbox}
          onUseDims={(m) => {
            patch({
              W: String(Math.round(m.length_cm * 10)),
              H: String(Math.round(m.width_cm * 10)),
            });
            setTab("details");
          }}
        />
      )}
      {tab === "estimate" && <EstimatePanel j={j} patch={patch} settings={settings} />}
      {tab === "plan" && <PlanPanel j={j} patch={patch} />}
      {tab === "photos" && <PhotosPanel j={j} setJ={setJ} setLightbox={setLightbox} />}

      <div className="no-print mt-4 flex items-center justify-between border-t border-line pt-3.5">
        <button onClick={() => onDelete(j.id)} className="text-sm text-danger">
          Delete job
        </button>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line bg-card px-4 py-2.5 text-ink"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(j)}
            className="rounded-lg bg-esp px-4 py-2.5 font-semibold text-cream"
          >
            Save job
          </button>
        </div>
      </div>
    </div>
  );
}
