import { useState } from "react";
import { GripVertical } from "lucide-react";
import WoodBadge from "./ui/WoodBadge";
import { Bar, Countdown, Empty } from "./ui/widgets";
import { STAGES, STAGE_KEYS, stageProgress } from "../lib/constants";
import { daysUntil, jobCode } from "../lib/format";
import { Hammer } from "lucide-react";

function PipelineCard({ job, onOpen, onDragStart }) {
  return (
    <article
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onClick={() => onOpen(job)}
      className="card cursor-grab p-3 transition-colors hover:border-line-2 active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold text-ink-3">{jobCode(job)}</span>
        <GripVertical size={13} className="text-ink-3" />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <WoodBadge species={job.species} />
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{job.title || "Untitled job"}</h3>
      </div>
      <p className="mt-0.5 truncate text-xs text-ink-2">{job.client || "No client"}</p>
      <div className="mt-2.5">
        <Bar pct={stageProgress(job.stage)} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-3">{job.type}</span>
        <Countdown days={daysUntil(job.due)} />
      </div>
    </article>
  );
}

export default function Pipeline({ jobs, onOpen, onStage, onNewJob }) {
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);

  const onDragStart = (e, job) => {
    setDragId(job.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const drop = (stage) => {
    if (dragId) onStage(dragId, stage);
    setDragId(null);
    setOver(null);
  };

  if (jobs.length === 0) {
    return (
      <div className="p-4 lg:px-6">
        <Empty icon={Hammer} title="No commissions yet" hint="Log a build and it moves through the shop from deposit to delivery here." action="Log new commission" onAction={onNewJob} />
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto p-4 lg:px-6">
      {STAGES.map((s) => {
        const col = jobs
          .filter((j) => (STAGE_KEYS.includes(j.stage) ? j.stage : "deposit") === s.key)
          .sort((a, b) => (daysUntil(a.due) ?? 999) - (daysUntil(b.due) ?? 999));
        return (
          <section
            key={s.key}
            onDragOver={(e) => { e.preventDefault(); setOver(s.key); }}
            onDrop={() => drop(s.key)}
            className={`flex w-[280px] shrink-0 flex-col rounded-lg border bg-sunk/40 ${
              over === s.key ? "border-amber" : "border-line"
            }`}
          >
            <header className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="label">{s.label}</span>
              <span className="font-mono text-[11px] font-semibold text-ink-3">{col.length}</span>
            </header>
            <div className="flex min-h-[120px] flex-col gap-2 p-2">
              {col.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-ink-3">Drop a job here</p>
              ) : (
                col.map((j) => <PipelineCard key={j.id} job={j} onOpen={onOpen} onDragStart={onDragStart} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
