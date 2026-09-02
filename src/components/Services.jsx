import { CABINET_TYPES, WOOD_TYPES } from "../lib/constants";
import { money } from "../lib/format";

export default function Services({ onView }) {
  const builds = CABINET_TYPES.filter((c) => c.name !== "Custom (Manual Entry)");

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-dark rounded-2xl px-6 py-8 text-center text-cream">
        <div className="text-xs font-bold tracking-[0.22em] text-oak">SERVICES</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold">What we make</h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-cream/80">
          Everything is built to your measurements. Anything not on this list, ask — most jobs
          are one-offs anyway.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Furniture &amp; fit-out</h2>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {builds.map((c) => (
            <div key={c.name} className="glass rounded-xl p-4">
              <div className="font-display font-bold text-ink">{c.name}</div>
              <div className="mt-1 text-xs text-ink-soft">
                ≈ {c.sheetsNeeded} board{c.sheetsNeeded === 1 ? "" : "s"} · machining &amp; fittings included
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Boards &amp; timber</h2>
        <div className="glass overflow-hidden rounded-xl">
          {WOOD_TYPES.map((w, i) => (
            <div
              key={w.name}
              className={`flex items-center justify-between px-4 py-3 text-sm ${
                i > 0 ? "border-t border-white/30" : ""
              }`}
            >
              <span className="text-ink">{w.name}</span>
              <span className="font-mono text-ink-soft">from {money(w.pricePerSheet)} / sheet</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          Sheet prices move with the market — a full quote is priced on the day.
        </p>
      </section>

      <button
        onClick={() => onView("contact")}
        className="self-start rounded-lg bg-oak px-5 py-2.5 font-semibold text-esp"
      >
        Ask for a quote
      </button>
    </div>
  );
}
