import { STATUS } from "../lib/constants";
import { money } from "../lib/format";
import { Stat } from "./primitives";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";

export default function Workshop({
  stats,
  jobs,
  filter,
  query,
  onFilter,
  onQuery,
  onNew,
  onOpen,
  onSample,
}) {
  return (
    <>
      <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
        <Stat value={stats.total} label="Total jobs" tone="text-oak" />
        <Stat value={stats.active} label="In progress" tone="text-progress" />
        <Stat value={money(stats.value)} label="Pipeline value" tone="text-done" />
        <Stat value={money(stats.outstanding)} label="Outstanding" tone="text-danger" />
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <button
          onClick={onNew}
          className="rounded-lg bg-esp px-4 py-2.5 text-sm font-semibold text-cream"
        >
          + New job
        </button>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search jobs…"
          className="field min-w-[140px] flex-1"
        />
        <select
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
          className="field !w-auto"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <EmptyState onNew={onNew} onSample={onSample} />
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onOpen={() => onOpen(job)} />
          ))}
        </div>
      )}
    </>
  );
}
