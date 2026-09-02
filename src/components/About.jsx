export default function About({ settings, jobs }) {
  const delivered = jobs.filter((j) => j.status === "delivered" || j.status === "done").length;
  const showcased = jobs.filter((j) => j.portfolio).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-dark rounded-2xl px-6 py-8 text-center text-cream">
        <div className="text-xs font-bold tracking-[0.22em] text-oak">ABOUT US</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{settings.business}</h1>
      </header>

      <section className="glass rounded-xl p-6">
        <p className="max-w-[62ch] leading-relaxed text-ink">{settings.about}</p>
      </section>

      {(delivered > 0 || showcased > 0) && (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
          <div className="glass rounded-xl p-4">
            <div className="font-display text-2xl font-extrabold text-oak">{delivered}</div>
            <div className="text-xs text-ink-soft">Projects completed</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="font-display text-2xl font-extrabold text-oak">{showcased}</div>
            <div className="text-xs text-ink-soft">In the gallery</div>
          </div>
        </div>
      )}

      <section className="glass rounded-xl p-6">
        <h2 className="mb-2 font-display text-lg font-bold">Where we are</h2>
        <p className="text-ink">{settings.location}</p>
        {settings.phone && <p className="mt-1 font-mono text-ink-soft">{settings.phone}</p>}
      </section>
    </div>
  );
}
