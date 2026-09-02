import { useState } from "react";
import { CABINET_TYPES, TYPE_TO_CAB, WOOD_TYPES } from "../../lib/constants";
import { money } from "../../lib/format";
import { Field, inputCls } from "../primitives";

const ith = "border border-[#bbb] px-2.5 py-2 text-center text-xs";
const itd = "border border-[#ddd] px-2.5 py-1.5 text-center text-xs";
const num = (n) => Number(n).toLocaleString("en-GH", { minimumFractionDigits: 2 });

export default function EstimatePanel({ j, patch, settings }) {
  const seed = j.estimate;
  const initCab =
    CABINET_TYPES.find((c) => c.name === (seed ? seed.cabinetType : TYPE_TO_CAB[j.type])) ||
    CABINET_TYPES[0];

  const [cab, setCab] = useState(initCab);
  const [qty, setQty] = useState(seed ? seed.qty : 1);
  const [wood, setWood] = useState(
    WOOD_TYPES.find((w) => w.name === (seed && seed.woodType)) || WOOD_TYPES[0],
  );
  const [sheets, setSheets] = useState(seed ? seed.sheets : initCab.sheetsNeeded);
  const [machine, setMachine] = useState(seed ? seed.machine : initCab.machineBase);
  const [fittings, setFittings] = useState(seed ? seed.fittings : initCab.fittingsBase);
  const [marble, setMarble] = useState(seed ? seed.marble : initCab.marbleBase);
  const [tt, setTt] = useState(seed ? seed.tt : 500);
  const [labour, setLabour] = useState(seed ? seed.labour : 9000);
  const [advance, setAdvance] = useState(seed ? seed.advance : +j.deposit || 0);
  const [invoice, setInvoice] = useState(false);

  const applyCab = (name) => {
    const c = CABINET_TYPES.find((x) => x.name === name);
    setCab(c);
    if (c.name !== "Custom (Manual Entry)") {
      setSheets(c.sheetsNeeded * qty);
      setMachine(c.machineBase * qty);
      setFittings(c.fittingsBase * qty);
      setMarble(c.marbleBase * qty);
    }
  };
  const applyQty = (value) => {
    const n = Math.max(1, parseInt(value, 10) || 1);
    setQty(n);
    if (cab.name !== "Custom (Manual Entry)") {
      setSheets(cab.sheetsNeeded * n);
      setMachine(cab.machineBase * n);
      setFittings(cab.fittingsBase * n);
      setMarble(cab.marbleBase * n);
    }
  };

  const woodCost = +sheets * wood.pricePerSheet;
  const subtotal = woodCost + +machine + +fittings + +marble + +tt + +labour;
  const balance = subtotal - +advance;
  const today = new Date()
    .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  const estimate = () => ({
    cabinetType: cab.name,
    qty,
    woodType: wood.name,
    pricePerSheet: wood.pricePerSheet,
    sheets: +sheets,
    machine: +machine,
    fittings: +fittings,
    marble: +marble,
    tt: +tt,
    labour: +labour,
    advance: +advance,
    subtotal,
    balance,
  });

  const rows = [
    ["Wood material cost", woodCost],
    ["Machine charges", machine],
    ["Fittings/accessories", fittings],
    ["Marble and fabrication", marble],
    ["T and T", tt],
    ["Labour charge", labour],
  ];

  return (
    <div>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <Field label="Project / cabinet type" full>
          <select className={inputCls} value={cab.name} onChange={(e) => applyCab(e.target.value)}>
            {CABINET_TYPES.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantity">
          <input
            type="number"
            min="1"
            className={inputCls}
            value={qty}
            onChange={(e) => applyQty(e.target.value)}
          />
        </Field>
        <Field label="Wood type">
          <select
            className={inputCls}
            value={wood.name}
            onChange={(e) => setWood(WOOD_TYPES.find((w) => w.name === e.target.value))}
          >
            {WOOD_TYPES.map((w) => (
              <option key={w.name}>{w.name}</option>
            ))}
          </select>
        </Field>
        <Field label={`Sheets (× ${money(wood.pricePerSheet)})`}>
          <input type="number" className={inputCls} value={sheets} onChange={(e) => setSheets(e.target.value)} />
        </Field>
        <Field label="Machine charges (₵)">
          <input type="number" className={inputCls} value={machine} onChange={(e) => setMachine(e.target.value)} />
        </Field>
        <Field label="Fittings (₵)">
          <input type="number" className={inputCls} value={fittings} onChange={(e) => setFittings(e.target.value)} />
        </Field>
        <Field label="Marble & fabrication (₵)">
          <input type="number" className={inputCls} value={marble} onChange={(e) => setMarble(e.target.value)} />
        </Field>
        <Field label="T and T (₵)">
          <input type="number" className={inputCls} value={tt} onChange={(e) => setTt(e.target.value)} />
        </Field>
        <Field label="Labour (₵)">
          <input type="number" className={inputCls} value={labour} onChange={(e) => setLabour(e.target.value)} />
        </Field>
        <Field label="Advance paid (₵)">
          <input type="number" className={inputCls} value={advance} onChange={(e) => setAdvance(e.target.value)} />
        </Field>
      </div>

      <div className="mt-3.5 rounded-[10px] border border-oak bg-panel p-3.5">
        <div className="flex items-center justify-between text-sm text-ink">
          <span>Wood material</span>
          <span>{money(woodCost)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm text-ink">
          <span>Other charges</span>
          <span>{money(subtotal - woodCost)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-oak pt-2 font-display text-lg font-extrabold text-ink">
          <span>Grand total</span>
          <span>{money(subtotal)}</span>
        </div>
        {+advance > 0 && (
          <div className={`mt-1 flex items-center justify-between text-sm ${balance < 0 ? "text-danger" : "text-done"}`}>
            <span>Balance B/Forward</span>
            <span>{money(balance)}</span>
          </div>
        )}
      </div>

      <div className="no-print mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => patch({ price: String(subtotal), deposit: String(advance), estimate: estimate() })}
          className="rounded-lg bg-esp px-4 py-2.5 font-semibold text-cream"
        >
          Apply price to job
        </button>
        <button
          onClick={() => patch({ estimate: estimate() })}
          className="rounded-lg border border-oak px-4 py-2.5 font-semibold text-oak"
        >
          Save estimate
        </button>
        <button
          onClick={() => setInvoice((v) => !v)}
          className="rounded-lg bg-oak px-4 py-2.5 font-bold text-esp"
        >
          {invoice ? "Hide invoice" : "Generate invoice"}
        </button>
      </div>

      {invoice && (
        <div className="mt-3.5 rounded-lg border border-line bg-white px-6 py-7 text-black">
          <div className="mb-3 border-b-2 border-black pb-3 text-center">
            <div className="font-display text-xl font-bold tracking-wide">
              {settings.business.toUpperCase()}
            </div>
            <div className="mt-1 text-xs">
              TEL: {settings.phone} &nbsp;|&nbsp; {settings.location}
            </div>
            <div className="mt-1.5 text-[13px] font-bold">INVOICE</div>
          </div>
          <div className="text-xs">
            <b>DATE:</b> {today}
          </div>
          <div className="text-xs">
            <b>CLIENT:</b> {j.client || "—"}
          </div>
          <div className="mb-3 text-xs">
            <b>PROJECT:</b> {qty > 1 ? `${qty}× ` : ""}
            {cab.name.replace("Custom (Manual Entry)", "Custom project")}
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#d9d9d9]">
                <th className={ith}>SN</th>
                <th className={`${ith} text-left`}>DESCRIPTION</th>
                <th className={`${ith} text-right`}>AMOUNT (₵)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([desc, amount], i) => (
                <tr key={i} className="border-b border-[#ddd]">
                  <td className={itd}>{i + 1}</td>
                  <td className={`${itd} text-left`}>{desc}</td>
                  <td className={`${itd} text-right`}>{num(amount)}</td>
                </tr>
              ))}
              <tr className="bg-[#d9d9d9] font-bold">
                <td className={itd}>7</td>
                <td className={`${itd} text-left`}>Grand total</td>
                <td className={`${itd} text-right`}>{num(subtotal)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span>Advance/paid</span>
              <span>₵{num(advance)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between font-bold">
              <span>Balance B/Forward</span>
              <span>₵{num(balance)}</span>
            </div>
          </div>
          <div className="mt-8 flex justify-between text-xs">
            <div className="text-center">
              <div className="mb-1 w-[150px] border-t border-black" />
              {j.client || "CLIENT"} (CUSTOMER)
            </div>
            <div className="text-center">
              <div className="mb-1 w-[150px] border-t border-black" />
              WIAFE AKENTEN STEPHEN (CEO)
            </div>
          </div>
          <div className="no-print mt-4 text-center">
            <button
              onClick={() => window.print()}
              className="rounded-md bg-esp px-6 py-2.5 text-oak"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
