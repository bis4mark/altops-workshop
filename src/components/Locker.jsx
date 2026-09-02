import { useRef } from "react";
import { FileImage, FolderOpen, ImagePlus, Ruler, ScrollText } from "lucide-react";
import { Empty } from "./ui/widgets";
import WoodBadge from "./ui/WoodBadge";
import { buildPlan } from "../lib/plan";
import { fileToThumb } from "../lib/image";
import { download, jobCode, money } from "../lib/format";

function cutListText(job, plan) {
  const rows = plan.parts.map(
    (p) => `  ${String(p.qty).padStart(2)} ×  ${String(p.L).padStart(5)} × ${String(p.Wd).padStart(4)} mm   ${p.name} (${p.mat})`,
  );
  const boards = plan.boards.map((b) => `  ${b.count} × ${b.mat} sheet (2440×1220)`);
  return [
    `ALTOPS FURNITURE ENTERPRISE — CUT LIST`,
    `${jobCode(job)}  ${job.title || "Untitled"}`,
    `Client: ${job.client || "—"}   Species: ${job.species}   Price: ${money(job.price)}`,
    `Board thickness ${plan.t}mm · ${plan.shelves} shelves · ${plan.doors} doors`,
    ``,
    `SHEET GOODS`,
    ...boards,
    ``,
    `PANELS`,
    ...rows,
    ``,
    `Generated ${new Date().toLocaleString("en-GB")}`,
  ].join("\n");
}

export default function Locker({ jobs, onOpen, onNewJob, onAddPhoto }) {
  const fileRef = useRef({});

  if (jobs.length === 0) {
    return (
      <div className="p-4 lg:px-6">
        <Empty icon={FolderOpen} title="No project folders yet" hint="Every commission gets a folder here — drawings, grain-match photos and its generated cut list." action="Log new commission" onAction={onNewJob} />
      </div>
    );
  }

  const pick = async (job, file) => {
    if (!file) return;
    try {
      onAddPhoto(job.id, await fileToThumb(file, 1200, 0.72));
    } catch {
      /* skip unreadable */
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-6">
      {jobs.map((j) => {
        const photos = j.photos || [];
        const plan = j.plan || buildPlan(j, 18, 1, 2);
        const sheets = plan ? plan.boards.reduce((s, b) => s + b.count, 0) : null;
        return (
          <article key={j.id} className="card overflow-hidden">
            <div className="aspect-video bg-sunk">
              {photos[0] ? (
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-3"><FileImage size={26} /></div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <WoodBadge species={j.species} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{j.title || "Untitled"}</span>
                <span className="font-mono text-[11px] text-ink-3">{jobCode(j)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink-2">
                <span className="inline-flex items-center gap-1"><FileImage size={12} /> {photos.length}</span>
                {sheets !== null && (
                  <span className="inline-flex items-center gap-1"><Ruler size={12} /> {sheets} sheets · {plan.parts.length} parts</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => onOpen(j)} className="btn !py-1 !text-xs">Open folder</button>
                <button
                  onClick={() => plan && download(`cutlist-${jobCode(j).slice(1)}.txt`, cutListText(j, plan))}
                  disabled={!plan}
                  className="btn !py-1 !text-xs"
                >
                  <ScrollText size={13} /> Cut list
                </button>
                <button
                  onClick={() => fileRef.current[j.id]?.click()}
                  className="btn !py-1 !text-xs"
                >
                  <ImagePlus size={13} /> Reference
                </button>
                <input
                  ref={(el) => (fileRef.current[j.id] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pick(j, e.target.files && e.target.files[0])}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
