import { useState } from "react";
import { buildPlan, DEFAULT_SHEET, SHEET_SIZES } from "../../lib/plan";
import { Field, inputCls } from "../primitives";
import SheetMap from "../ui/SheetMap";

const ith = "border border-line-2 px-2.5 py-2 text-center text-xs";
const itd = "border-b border-line px-2.5 py-1.5 text-center text-xs";

const pct = (v) => `${Math.round((v || 0) * 100)}%`;

export default function PlanPanel({ j, patch }) {
  const saved = j.plan;
  const [t, setT] = useState(saved ? saved.t : 18);
  const [shelves, setShelves] = useState(saved ? saved.shelves : 1);
  const [doors, setDoors] = useState(saved ? saved.doors : 2);
  const [sheetKey, setSheetKey] = useState(
    saved && saved.sheet ? SHEET_SIZES.find((s) => s.w === saved.sheet.w && s.h === saved.sheet.h)?.key || DEFAULT_SHEET.key : DEFAULT_SHEET.key
  );
  const [kerf, setKerf] = useState(saved && saved.kerf != null ? saved.kerf : 3);
  const [grain, setGrain] = useState(saved ? saved.grain !== false : true);
  const plan = saved;
  const missing = !j.W || !j.H;

  const generate = () => {
    const sheet = SHEET_SIZES.find((s) => s.key === sheetKey) || DEFAULT_SHEET;
    const p = buildPlan(j, +t, +shelves, +doors, { sheet, kerf: +kerf || 0, grain });
    if (p) patch({ plan: p });
  };

  const totalSheets = plan ? plan.boards.reduce((s, b) => s + b.count, 0) : 0;

  return (
    <div>
      {missing && (
        <div className="mb-3 rounded-lg bg-alert/10 p-3 text-[13px] text-alert">
          Set Width and Height on the Details tab first.
        </div>
      )}

      <div className="no-print">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Board thickness (mm)">
            <input type="number" className={inputCls} value={t} onChange={(e) => setT(e.target.value)} />
          </Field>
          <Field label="Shelves">
            <input type="number" className={inputCls} value={shelves} onChange={(e) => setShelves(e.target.value)} />
          </Field>
          <Field label="Doors">
            <input type="number" className={inputCls} value={doors} onChange={(e) => setDoors(e.target.value)} />
          </Field>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Sheet size">
            <select className={inputCls} value={sheetKey} onChange={(e) => setSheetKey(e.target.value)}>
              {SHEET_SIZES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Saw kerf (mm)">
            <input type="number" min="0" className={inputCls} value={kerf} onChange={(e) => setKerf(e.target.value)} />
          </Field>
        </div>

        <label className="mt-3 flex items-center gap-2 text-[13px] text-ink">
          <input type="checkbox" checked={grain} onChange={(e) => setGrain(e.target.checked)} />
          Keep grain direction (never turn doors or side panels)
        </label>

        <button
          onClick={generate}
          disabled={missing}
          className="mt-3 rounded-lg bg-ink px-4 py-2.5 font-semibold text-canvas transition-[filter,transform] hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          Generate cut plan
        </button>
      </div>

      {plan && (
        <div className="mt-3.5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {plan.boards.map((b) => (
                <div key={b.mat} className="rounded-[10px] border border-amber/50 bg-amber/10 px-3.5 py-2.5 backdrop-blur-md">
                  <div className="text-xl font-extrabold text-amber">{b.count}</div>
                  <div className="text-xs text-ink-2">
                    {b.mat} sheet{b.count !== 1 ? "s" : ""}
                    {b.yield != null ? ` · ${pct(b.yield)} used` : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right text-xs text-ink-2">
              <div className="font-mono text-lg font-bold text-ink">{totalSheets}</div>
              sheets total
            </div>
          </div>

          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-ink text-white">
                <th className={ith}>Part</th>
                <th className={ith}>Size (mm)</th>
                <th className={ith}>Qty</th>
                <th className={ith}>Material</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {plan.parts.map((p, i) => (
                <tr key={i}>
                  <td className={`${itd} text-left`}>
                    {p.name}
                    {p.grain && <span className="ml-1 text-[10px] text-ink-3">grain</span>}
                  </td>
                  <td className={itd}>
                    {p.L} × {p.Wd}
                  </td>
                  <td className={itd}>{p.qty}</td>
                  <td className={itd}>{p.mat}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {plan.boards.some((b) => b.sheets) && (
            <div className="mt-4 flex flex-col gap-4">
              {plan.boards
                .filter((b) => b.sheets)
                .map((b) => (
                  <section key={b.mat}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold text-ink">{b.mat}</h3>
                      <span className="font-mono text-[11px] text-ink-2">
                        {b.count} × {plan.sheet ? `${plan.sheet.w}×${plan.sheet.h}` : "sheet"} · {pct(b.yield)} used
                      </span>
                    </div>
                    {b.sheets.some((s) => s.overflow) && (
                      <p className="mb-2 rounded bg-alert/10 p-2 text-xs text-alert">
                        A piece is larger than the sheet. Choose a bigger sheet size or split the panel.
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {b.sheets.map((s) => (
                        <SheetMap
                          key={s.index}
                          sheet={s}
                          mat={b.mat}
                          width={plan.sheet ? plan.sheet.w : 2440}
                          height={plan.sheet ? plan.sheet.h : 1220}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}

          <div className="no-print mt-3">
            <button onClick={() => window.print()} className="btn btn-amber">
              Print cut plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
