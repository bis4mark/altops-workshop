import { FileImage, FolderOpen, Ruler } from "lucide-react";
import { Empty } from "./ui/widgets";
import WoodBadge from "./ui/WoodBadge";
import { buildPlan } from "../lib/plan";
import { jobCode } from "../lib/format";

export default function Locker({ jobs, onOpen, onNewJob }) {
  if (jobs.length === 0) {
    return (
      <div className="p-4 lg:px-6">
        <Empty icon={FolderOpen} title="No project folders yet" hint="Every commission gets a folder here — drawings, grain-match photos and its generated cut list." action="Log new commission" onAction={onNewJob} />
      </div>
    );
  }

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
                <div className="flex h-full items-center justify-center text-ink-3">
                  <FileImage size={26} />
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <WoodBadge species={j.species} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{j.title || "Untitled"}</span>
                <span className="font-mono text-[11px] text-ink-3">{jobCode(j)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-ink-2">
                <span className="inline-flex items-center gap-1"><FileImage size={12} /> {photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
                {sheets !== null && (
                  <span className="inline-flex items-center gap-1"><Ruler size={12} /> {sheets} sheet{sheets !== 1 ? "s" : ""} · {plan.parts.length} parts</span>
                )}
              </div>
              <button onClick={() => onOpen(j)} className="btn mt-3 w-full justify-center">
                Open folder & cut list
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
