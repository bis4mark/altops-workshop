const SECTIONS = [
  ["home", "Home"],
  ["gallery", "Gallery"],
  ["services", "Services"],
  ["about", "About"],
  ["contact", "Contact"],
];

export default function Nav({ business, view, onView, onSettings }) {
  return (
    <header className="glass-dark sticky top-0 z-30 text-cream">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <button
          onClick={() => onView("home")}
          className="flex items-center gap-2"
        >
          <span className="inline-block h-3 w-3 rounded-[2px] bg-oak" />
          <span className="font-display text-lg font-bold">{business}</span>
        </button>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {SECTIONS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onView(key)}
              className={`border-b-2 pb-0.5 transition-colors ${
                view === key
                  ? "border-oak text-oak"
                  : "border-transparent text-cream/70 hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}

          <button
            onClick={() => onView("workshop")}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
              view === "workshop"
                ? "bg-oak text-esp"
                : "bg-esp-2 text-cream/80 hover:text-cream"
            }`}
          >
            Workshop
          </button>
          <button
            onClick={onSettings}
            aria-label="Business settings"
            className="rounded-md bg-esp-2 px-2.5 py-1.5 text-cream/70 transition-colors hover:text-cream"
          >
            ⚙
          </button>
        </nav>
      </div>
    </header>
  );
}
