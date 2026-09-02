export default function Portfolio({ jobs, settings, setLightbox, onView }) {
  return (
    <div>
      <div className="mb-[22px] glass-dark rounded-2xl px-6 py-8 text-center text-cream">
        <div className="text-xs font-bold tracking-[0.22em] text-oak">GALLERY</div>
        <h1 className="my-1.5 font-display text-[34px] font-extrabold">Recent work</h1>
        <p className="mx-auto max-w-[520px] text-cream/80">{settings.tagline}</p>
        <div className="mt-2 text-[13px] text-cream/60">
          {settings.location}
          {settings.phone ? ` · ${settings.phone}` : ""}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl glass border-dashed px-4 py-10 text-center">
          <div className="font-bold text-ink">Nothing in the gallery yet</div>
          <div className="mt-1 text-sm text-ink-soft">
            In the Workshop, open a job, add photos, and tick “Show in portfolio.”
          </div>
          <button
            onClick={() => onView("workshop")}
            className="mt-3 rounded-lg bg-oak px-4 py-2.5 font-bold text-esp"
          >
            Go to Workshop
          </button>
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {jobs.map((job) => {
            const cover = job.photos && job.photos[0];
            const dims = [job.W, job.D, job.H].filter(Boolean).join(" × ");
            return (
              <div key={job.id} className="overflow-hidden rounded-xl glass">
                <div
                  onClick={() => cover && setLightbox(cover)}
                  className={`h-[190px] bg-black ${cover ? "cursor-pointer" : ""}`}
                >
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#efe7d6]" />
                  )}
                </div>
                <div className="p-3.5">
                  <div className="text-[11px] font-bold tracking-[0.08em] text-oak">
                    {job.type.toUpperCase()}
                  </div>
                  <div className="mt-0.5 font-display text-lg font-bold text-ink">
                    {job.title || "Custom piece"}
                  </div>
                  {job.blurb && <p className="mt-1.5 text-[13px] text-ink-soft">{job.blurb}</p>}
                  {dims && <div className="mt-2 font-mono text-xs text-ink-soft">{dims} mm</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
