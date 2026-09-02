import { whatsappLink } from "../lib/constants";

export default function Contact({ settings }) {
  const wa = whatsappLink(settings.phone);
  const tel = settings.phone ? `tel:${settings.phone.replace(/\s/g, "")}` : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="glass-dark rounded-2xl px-6 py-8 text-center text-cream">
        <div className="text-xs font-bold tracking-[0.22em] text-oak">CONTACT</div>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Let&apos;s talk about your build</h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-cream/80">
          Send the room measurements or a photo of the space and we&apos;ll come back with a price.
        </p>
      </header>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="glass flex flex-col gap-1 rounded-xl p-5"
          >
            <span className="text-xs font-bold tracking-widest text-done">WHATSAPP</span>
            <span className="font-display text-lg font-bold text-ink">Message us</span>
            <span className="font-mono text-sm text-ink-soft">{settings.phone}</span>
          </a>
        )}
        {tel && (
          <a href={tel} className="glass flex flex-col gap-1 rounded-xl p-5">
            <span className="text-xs font-bold tracking-widest text-oak">CALL</span>
            <span className="font-display text-lg font-bold text-ink">{settings.phone}</span>
            <span className="text-sm text-ink-soft">Workshop hours, Mon–Sat</span>
          </a>
        )}
        <div className="glass flex flex-col gap-1 rounded-xl p-5">
          <span className="text-xs font-bold tracking-widest text-oak">VISIT</span>
          <span className="font-display text-lg font-bold text-ink">The workshop</span>
          <span className="text-sm text-ink-soft">{settings.location}</span>
        </div>
      </div>
    </div>
  );
}
