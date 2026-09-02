import { useState } from "react";
import { WOOD_TYPES } from "../lib/constants";
import { boardFeet, jobCode, money } from "../lib/format";
import { Field, inputCls } from "./primitives";

function PayBars({ job }) {
  const price = +job.price || 0;
  const paid = Math.min(+job.deposit || 0, price);
  const deposit = price * 0.4;
  const milestone = price * 0.8;
  const seg = (label, target) => {
    const pct = price ? Math.min(100, Math.max(0, ((paid - (target - price * 0.4)) / (price * 0.4)) * 100)) : 0;
    const done = paid >= target - 1;
    return (
      <div className="flex-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-ink-3">
          <span>{label}</span>
          <span>{done ? "paid" : money(Math.max(0, target - paid))}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunk">
          <div className={`h-full rounded-full ${done ? "bg-ok" : "bg-amber"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };
  return (
    <div className="mt-2 flex gap-2">
      {seg("Deposit", deposit)}
      {seg("Milestone", milestone)}
      {seg("Balance", price)}
    </div>
  );
}

export default function Financials({ jobs, onOpen }) {
  const [dim, setDim] = useState({ L: "2400", W: "600", t: "0.75", qty: "1" });
  const [wood, setWood] = useState(WOOD_TYPES[0].name);
  const w = WOOD_TYPES.find((x) => x.name === wood) || WOOD_TYPES[0];
  const bf = boardFeet(+dim.L, +dim.W, +dim.t, +dim.qty || 1);
  const sheets = Math.ceil(bf / ((2440 / 25.4) * (1220 / 25.4) * +dim.t / 144) || 1);
  const cost = sheets * w.pricePerSheet;

  const open = jobs.filter((j) => j.stage !== "delivery" || (+j.deposit || 0) < (+j.price || 0));

  return (
    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3 lg:px-6">
      <div className="card p-4 lg:col-span-2">
        <span className="label">Payment tracking</span>
        <ul className="mt-3 divide-y divide-line">
          {open.length === 0 && <li className="py-6 text-center text-sm text-ink-2">Every job is fully paid. Good.</li>}
          {open.map((j) => (
            <li key={j.id}>
              <button onClick={() => onOpen(j)} className="w-full py-3 text-left hover:bg-sunk/40">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-ink-3">{jobCode(j)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{j.title || "Untitled"}</span>
                  <span className="font-mono text-sm text-ink">{money(j.price)}</span>
                </div>
                <PayBars job={j} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <span className="label">Board-foot quote</span>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Length (mm)"><input className={inputCls} value={dim.L} onChange={(e) => setDim({ ...dim, L: e.target.value })} /></Field>
          <Field label="Width (mm)"><input className={inputCls} value={dim.W} onChange={(e) => setDim({ ...dim, W: e.target.value })} /></Field>
          <Field label="Thick. (in)"><input className={inputCls} value={dim.t} onChange={(e) => setDim({ ...dim, t: e.target.value })} /></Field>
          <Field label="Quantity"><input className={inputCls} value={dim.qty} onChange={(e) => setDim({ ...dim, qty: e.target.value })} /></Field>
          <Field label="Species" full>
            <select className={inputCls} value={wood} onChange={(e) => setWood(e.target.value)}>
              {WOOD_TYPES.map((x) => <option key={x.name}>{x.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 rounded-md border border-amber/40 bg-amber/10 p-3">
          <div className="flex justify-between text-sm text-ink-2"><span>Board feet</span><span className="font-mono">{bf}</span></div>
          <div className="flex justify-between text-sm text-ink-2"><span>Sheets (8×4)</span><span className="font-mono">{sheets}</span></div>
          <div className="mt-1 flex justify-between border-t border-amber/40 pt-1 font-semibold text-ink">
            <span>Material</span><span className="font-mono">{money(cost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
