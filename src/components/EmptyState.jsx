export default function EmptyState({ onNew, onSample }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card px-4 py-12 text-center">
      <div className="text-4xl text-ink-soft/50">◳</div>
      <div className="mt-1.5 font-bold text-ink">No jobs yet</div>
      <div className="mt-0.5 text-sm text-ink-soft">
        Log a build to measure, quote, plan and track it.
      </div>
      <div className="mt-3.5 flex items-center justify-center gap-2">
        <button
          onClick={onNew}
          className="rounded-lg bg-esp px-4 py-2.5 font-semibold text-cream"
        >
          + New job
        </button>
        <button
          onClick={onSample}
          className="rounded-lg border border-oak px-4 py-2.5 font-semibold text-oak"
        >
          Add sample project
        </button>
      </div>
    </div>
  );
}
