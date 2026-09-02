import { useState } from "react";
import { WOOD_TYPES } from "../lib/constants";
import { amountPaid, boardFeet, download, jobCode, money } from "../lib/format";
import { Field, inputCls } from "./primitives";

const STAGE_SHARE = [
  ["Deposit", 0.4],
  ["Milestone", 0.8],
  ["Balance", 1],
];

function Row({ job, onOpen, onPay }) {
  const [amt, setAmt] = useState("");
  const price = +job.price || 0;
  const paid = Math.min(amountPaid(job), price || Infinity);
  const due = Math.max(0, price - paid);

  return (
    <li className="py-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onOpen(job)} className="min-w-0 flex-1 text-left hover:underline">
          <span className="font-mono text-[11px] text-ink-3">{jobCode(job)}</span>{" "}
          <span className="text-sm font-medium text-ink">{job.title || "Untitled"}</span>
        </button>
        <span className="font-mono text-sm text-ink">{money(price)}</span>
      </div>

      <div className="mt-2 flex gap-2">
        {STAGE_SHARE.map(([label, share]) => {
          const target = price * share;
          const prev = price * (share === 0.4 ? 0 : share === 0.8 ? 0.4 : 0.8);
          const pct = target > prev ? Math.min(100, Math.max(0, ((paid - prev) / (target - prev)) * 100)) : 0;
          const done = paid >= target - 0.5;
          return (
            <div key={label} className="flex-1">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-ink-3">
                <span>{label}</span>
                <span>{done ? "paid" : money(Math.max(0, target - paid))}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunk">
                <div className={`h-full rounded-full ${done ? "bg-ok" : "bg-amber"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {due > 0 && (
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onPay(job.id, amt);
            setAmt("");
          }}
        >
          <input
            type="number"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder={`Record payment (₵${due.toLocaleString()} due)`}
            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-xs focus:border-amber focus:outline-none"
          />
          <button type="submit" className="btn !py-1 !text-xs">Add</button>
        </form>
      )}
    </li>
  );
}

export default function Financials({ jobs, onOpen, onPay }) {
  const [dim, setDim] = useState({ L: "2400", W: "600", t: "0.75", qty: "1" });
  const [wood, setWood] = useState(WOOD_TYPES[0].name);
  const w = WOOD_TYPES.find((x) => x.name === wood) || WOOD_TYPES[0];
  const bf = boardFeet(+dim.L, +dim.W, +dim.t, +dim.qty || 1);
  const perSheet = (2440 / 25.4) * (1220 / 25.4) * (+dim.t) / 144;
  const sheets = Math.max(1, Math.ceil(bf / (perSheet || 1)));
  const cost = sheets * w.pricePerSheet;

  const open = jobs.filter((j) => amountPaid(j) < (+j.price || 0));

  const exportQuote = () => {
    const lines = [
      "ALTOPS FURNITURE ENTERPRISE — MATERIAL QUOTE",
      new Date().toLocaleDateString("en-GB"),
      "",
      `Species        ${w.name}`,
      `Piece          ${dim.L} x ${dim.W} mm @ ${dim.t}" thick x ${dim.qty}`,
      `Board feet     ${bf}`,
      `Sheets (8x4)   ${sheets} @ ${money(w.pricePerSheet)}`,
      `Material total ${money(cost)}`,
    ];
    download(`altops-quote-${Date.now()}.txt`, lines.join("\n"));
  };

  return (
    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3 lg:px-6">
      <div className="card p-4 lg:col-span-2">
        <span className="label">Payment tracking</span>
        <ul className="mt-2 divide-y divide-line">
          {open.length === 0 && <li className="py-6 text-center text-sm text-ink-2">Every job is fully paid. Good.</li>}
          {open.map((j) => (
            <Row key={j.id} job={j} onOpen={onOpen} onPay={onPay} />
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
        <button onClick={exportQuote} className="btn mt-3 w-full justify-center">Download quote</button>
      </div>
    </div>
  );
}
