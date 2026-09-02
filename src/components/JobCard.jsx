import { money } from "../lib/format";
import { Badge, Dot } from "./primitives";

export default function JobCard({ job, onOpen }) {
  const cover = job.photos && job.photos[0];
  const balance = Math.max(0, (+job.price || 0) - (+job.deposit || 0));

  return (
    <button
      onClick={onOpen}
      className="w-full overflow-hidden rounded-xl border border-line bg-card text-left"
    >
      <div className="flex h-[130px] items-center justify-center bg-[#efe7d6]">
        {cover ? (
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-3xl text-ink-soft/60">◳</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-1">
          <Badge status={job.status} />
          {job.portfolio && (
            <span className="text-[10px] font-bold text-oak">★ PORTFOLIO</span>
          )}
        </div>
        <div className="mt-1.5 font-bold text-ink">{job.title || "Untitled job"}</div>
        <div className="text-xs text-ink-soft">
          {job.client || "—"} · {job.type}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Dot on={(job.measurements || []).length > 0} label="Measured" />
          <Dot on={!!job.estimate} label="Estimated" />
          <Dot on={!!job.plan} label="Planned" />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="font-mono text-ink">{money(job.price)}</span>
          {balance > 0 && <span className="text-danger">bal {money(balance)}</span>}
        </div>
      </div>
    </button>
  );
}
