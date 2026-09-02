import { CABINET_TYPES } from "../lib/constants";

export default function Home({ settings, jobs, onView }) {
  const featured = jobs.filter((j) => j.portfolio && j.photos && j.photos[0]).slice(0, 3);
  const builds = CABINET_TYPES.filter((c) => c.name !== "Custom (Manual Entry)").slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <section className="glass-dark rounded-2xl px-6 py-10 text-center text-cream">
        <div className="text-xs font-bold tracking-[0.24em] text-oak">HANDMADE FURNITURE · KUMASI</div>
        <h1 className="mx-auto mt-2 max-w-[16ch] font-display text-4xl font-extrabold leading-tight">
          {settings.business}
        </h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-cream/80">{settings.tagline}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onView("gallery")}
            className="rounded-lg bg-oak px-5 py-2.5 font-semibold text-esp"
          >
            See our work
          </button>
          <button
            onClick={() => onView("contact")}
            className="rounded-lg border border-cream/40 px-5 py-2.5 font-semibold text-cream"
          >
            Request a quote
          </button>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Recent builds</h2>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {featured.map((job) => (
              <button
                key={job.id}
                onClick={() => onView("gallery")}
                className="glass overflow-hidden rounded-xl text-left"
              >
                <img src={job.photos[0]} alt="" className="h-40 w-full object-cover" />
                <div className="p-3">
                  <div className="text-[11px] font-bold tracking-wide text-oak">
                    {job.type.toUpperCase()}
                  </div>
                  <div className="font-display font-bold text-ink">{job.title || "Custom piece"}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">What we build</h2>
        <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
          {builds.map((c) => (
            <div key={c.name} className="glass rounded-lg px-3.5 py-3 text-sm text-ink">
              {c.name}
            </div>
          ))}
        </div>
        <button
          onClick={() => onView("services")}
          className="mt-3 text-sm font-semibold text-oak"
        >
          Full list of services &amp; timber →
        </button>
      </section>
    </div>
  );
}
