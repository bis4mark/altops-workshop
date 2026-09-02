import { useState } from "react";
import { buildPlan } from "../../lib/plan";
import { Field, inputCls } from "../primitives";

const ith = "border border-esp-2 px-2.5 py-2 text-center text-xs";
const itd = "border-b border-line px-2.5 py-1.5 text-center text-xs";

export default function PlanPanel({ j, patch }) {
  const [t, setT] = useState(j.plan ? j.plan.t : 18);
  const [shelves, setShelves] = useState(j.plan ? j.plan.shelves : 1);
  const [doors, setDoors] = useState(j.plan ? j.plan.doors : 2);
  const plan = j.plan;
  const missing = !j.W || !j.H;

  const generate = () => {
    const p = buildPlan(j, +t, +shelves, +doors);
    if (p) patch({ plan: p });
  };

  return (
    <div>
      {missing && (
        <div className="mb-3 rounded-lg bg-danger/10 p-3 text-[13px] text-danger-soft">
          Set Width and Height on the Details tab first.
        </div>
      )}
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
      <button
        onClick={generate}
        disabled={missing}
        className="mt-3 rounded-lg bg-esp px-4 py-2.5 font-semibold text-cream disabled:opacity-50"
      >
        Generate cut plan
      </button>

      {plan && (
        <div className="mt-3.5">
          <div className="mb-3 flex flex-wrap gap-2">
            {plan.boards.map((b) => (
              <div key={b.mat} className="rounded-[10px] border border-oak bg-panel px-3.5 py-2.5">
                <div className="font-display text-xl font-extrabold text-oak">{b.count}</div>
                <div className="text-xs text-ink-soft">
                  {b.mat} board{b.count !== 1 ? "s" : ""} (8×4)
                </div>
              </div>
            ))}
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-esp text-cream">
                <th className={ith}>Part</th>
                <th className={ith}>Size (mm)</th>
                <th className={ith}>Qty</th>
                <th className={ith}>Material</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {plan.parts.map((p, i) => (
                <tr key={i}>
                  <td className={`${itd} text-left`}>{p.name}</td>
                  <td className={itd}>
                    {p.L} × {p.Wd}
                  </td>
                  <td className={itd}>{p.qty}</td>
                  <td className={itd}>{p.mat}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="no-print mt-2.5">
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-oak px-4 py-2 font-bold text-esp"
            >
              Print cut plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
