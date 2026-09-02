const TABS = [
  ["workshop", "Workshop"],
  ["portfolio", "Portfolio"],
];

export default function Nav({ business, view, onView, onSettings }) {
  return (
    <header className="bg-esp text-cream">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-[2px] bg-oak" />
          <span className="font-display text-lg font-bold">{business}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-esp-2 p-0.5">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => onView(key)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  view === key ? "bg-oak text-esp" : "text-cream/70 hover:text-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onSettings}
            aria-label="Business settings"
            className="rounded-md bg-esp-2 px-2.5 py-1.5 text-cream/70 transition-colors hover:text-cream"
          >
            ⚙
          </button>
        </div>
      </div>
    </header>
  );
}
