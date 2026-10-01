import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { STAGES, TYPES, WOOD_TYPES } from "../../lib/constants";
import { Field, inputCls } from "../primitives";

const missing = (val) => !val || !String(val).trim();
const errCls = (val) => (missing(val) ? "border-alert focus:border-alert" : "");

export default function DetailsPanel({ j, up }) {
  const [more, setMore] = useState(false);

  return (
    <div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
        <Field label="Job title *" full>
          <input
            className={`${inputCls} ${errCls(j.title)}`}
            value={j.title}
            onChange={(e) => up("title", e.target.value)}
            placeholder="e.g. Reception counter"
          />
          {missing(j.title) && <p className="mt-1 text-xs text-alert">Job title is required.</p>}
        </Field>
        <Field label="Type">
          <select className={inputCls} value={j.type} onChange={(e) => up("type", e.target.value)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Wood species">
          <select className={inputCls} value={j.species} onChange={(e) => up("species", e.target.value)}>
            {WOOD_TYPES.map((w) => (
              <option key={w.name}>{w.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Production stage">
          <select className={inputCls} value={j.stage} onChange={(e) => up("stage", e.target.value)}>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Width (mm) *">
          <input
            className={`${inputCls} ${errCls(j.W)}`}
            value={j.W}
            onChange={(e) => up("W", e.target.value)}
            placeholder="1500"
          />
          {missing(j.W) && <p className="mt-1 text-xs text-alert">Width is required.</p>}
        </Field>
        <Field label="Height (mm) *">
          <input
            className={`${inputCls} ${errCls(j.H)}`}
            value={j.H}
            onChange={(e) => up("H", e.target.value)}
            placeholder="1100"
          />
          {missing(j.H) && <p className="mt-1 text-xs text-alert">Height is required.</p>}
        </Field>
        <Field label="Depth (mm)">
          <input className={inputCls} value={j.D} onChange={(e) => up("D", e.target.value)} placeholder="600" />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setMore((v) => !v)}
        className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-amber"
      >
        <ChevronRight size={14} className={`transition-transform ${more ? "rotate-90" : ""}`} />
        {more ? "Fewer options" : "More options"}
      </button>

      {more && (
        <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
          <Field label="Client">
            <input className={inputCls} value={j.client} onChange={(e) => up("client", e.target.value)} placeholder="Client name" />
          </Field>
          <Field label="Delivery deadline">
            <input type="date" className={inputCls} value={j.due} onChange={(e) => up("due", e.target.value)} />
          </Field>
          <Field label="Material notes" full>
            <input
              className={inputCls}
              value={j.material}
              onChange={(e) => up("material", e.target.value)}
              placeholder="e.g. 18mm melamine + plywood carcass"
            />
          </Field>
          <Field label="Contract price (₵)">
            <input type="number" className={inputCls} value={j.price} onChange={(e) => up("price", e.target.value)} placeholder="0" />
          </Field>
          <Field label="Deposit paid (₵)">
            <input type="number" className={inputCls} value={j.deposit} onChange={(e) => up("deposit", e.target.value)} placeholder="0" />
          </Field>
          <Field label="Notes" full>
            <textarea
              className={`${inputCls} min-h-[60px]`}
              value={j.notes}
              onChange={(e) => up("notes", e.target.value)}
              placeholder="Site details, client preferences, joinery notes…"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
