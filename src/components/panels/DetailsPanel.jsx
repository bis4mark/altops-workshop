import { STATUS, TYPES } from "../../lib/constants";
import { Field, inputCls } from "../primitives";

export default function DetailsPanel({ j, up }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
      <Field label="Job title" full>
        <input
          className={inputCls}
          value={j.title}
          onChange={(e) => up("title", e.target.value)}
          placeholder="e.g. Reception counter"
        />
      </Field>
      <Field label="Client">
        <input className={inputCls} value={j.client} onChange={(e) => up("client", e.target.value)} />
      </Field>
      <Field label="Type">
        <select className={inputCls} value={j.type} onChange={(e) => up("type", e.target.value)}>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select className={inputCls} value={j.status} onChange={(e) => up("status", e.target.value)}>
          {Object.entries(STATUS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Due date">
        <input type="date" className={inputCls} value={j.due} onChange={(e) => up("due", e.target.value)} />
      </Field>
      <Field label="Width (mm)">
        <input className={inputCls} value={j.W} onChange={(e) => up("W", e.target.value)} />
      </Field>
      <Field label="Height (mm)">
        <input className={inputCls} value={j.H} onChange={(e) => up("H", e.target.value)} />
      </Field>
      <Field label="Depth (mm)">
        <input className={inputCls} value={j.D} onChange={(e) => up("D", e.target.value)} />
      </Field>
      <Field label="Material" full>
        <input
          className={inputCls}
          value={j.material}
          onChange={(e) => up("material", e.target.value)}
          placeholder="e.g. 18mm melamine + plywood"
        />
      </Field>
      <Field label="Price (₵)">
        <input type="number" className={inputCls} value={j.price} onChange={(e) => up("price", e.target.value)} />
      </Field>
      <Field label="Deposit paid (₵)">
        <input
          type="number"
          className={inputCls}
          value={j.deposit}
          onChange={(e) => up("deposit", e.target.value)}
        />
      </Field>
      <Field label="Notes" full>
        <textarea
          className={`${inputCls} min-h-[60px]`}
          value={j.notes}
          onChange={(e) => up("notes", e.target.value)}
        />
      </Field>

      <div className="col-span-full rounded-[10px] glass p-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={j.portfolio}
            onChange={(e) => up("portfolio", e.target.checked)}
          />
          <span className="font-semibold text-ink">Show this build in my public portfolio</span>
        </label>
        {j.portfolio && (
          <textarea
            className={`${inputCls} mt-2 min-h-[54px]`}
            value={j.blurb}
            onChange={(e) => up("blurb", e.target.value)}
            placeholder="A short line about this piece for visitors."
          />
        )}
      </div>
    </div>
  );
}
