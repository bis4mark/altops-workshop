import { useState } from "react";
import DetailsPanel from "./panels/DetailsPanel";
import MeasurePanel from "./panels/MeasurePanel";
import EstimatePanel from "./panels/EstimatePanel";
import PlanPanel from "./panels/PlanPanel";
import PreviewPanel from "./panels/PreviewPanel";
import PhotosPanel from "./panels/PhotosPanel";

const TABS = [
  ["details", "Details"],
  ["measure", "Measure"],
  ["estimate", "Estimate"],
  ["plan", "Plan"],
  ["preview", "3D Preview"],
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
    <div className="flex h-full flex-col">
      <div className="no-print flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map(([key, label]) => {
          const done = isDone(key, j) && tab !== key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                tab === key ? "bg-ink text-white" : "text-ink hover:bg-sunk"
              }`}
            >
              {label}
              {done ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-4">
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
        {tab === "preview" && <PreviewPanel j={j} patch={patch} />}
        {tab === "photos" && <PhotosPanel j={j} setJ={setJ} setLightbox={setLightbox} />}
      </div>

      <div className="no-print flex shrink-0 items-center justify-between border-t border-line pt-3">
        <button onClick={() => onDelete(j.id)} className="text-sm text-alert hover:underline">
          Delete job
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn">
            Cancel
          </button>
          <button onClick={() => onSave(j)} className="btn btn-amber">
            Save job
          </button>
        </div>
      </div>
    </div>
  );
}
