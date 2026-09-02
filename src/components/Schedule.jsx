import { useEffect, useState } from "react";
import { Clock, Play, Square } from "lucide-react";
import { MACHINES } from "../lib/constants";
import { flag, loadCollection, persistItem, removeItem } from "../lib/storage";
import { rid } from "../lib/format";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00"];

export default function Schedule({ jobs }) {
  const [cards, setCards] = useState([]);
  const [running, setRunning] = useState(flag.get("clockedInAt") || null);
  const [job, setJob] = useState("");
  const [res, setRes] = useState({});

  useEffect(() => {
    loadCollection("wtc_").then((c) => setCards(c.sort((a, b) => b.out - a.out)));
    setRes(JSON.parse(flag.get("machineRes") || "{}"));
  }, []);

  const clockIn = () => {
    const t = String(Date.now());
    flag.set("clockedInAt", t);
    flag.set("clockedJob", job);
    setRunning(t);
  };
  const clockOut = () => {
    const start = +running;
    const card = { id: rid("tc"), job: flag.get("clockedJob") || "General shop", in: start, out: Date.now() };
    persistItem("wtc_", card);
    setCards((c) => [card, ...c]);
    flag.set("clockedInAt", "");
    setRunning(null);
  };
  const clear = (id) => { removeItem("wtc_", id); setCards((c) => c.filter((x) => x.id !== id)); };

  const toggle = (m, d, h) => {
    const key = `${m}|${d}|${h}`;
    const next = { ...res, [key]: !res[key] };
    if (!next[key]) delete next[key];
    setRes(next);
    flag.set("machineRes", JSON.stringify(next));
  };

  const hrs = (ms) => (ms / 3_600_000).toFixed(1);
  const fmt = (ms) => new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2 lg:px-6">
      <div className="card p-4">
        <span className="label">Clock-in / time card</span>
        {running ? (
          <div className="mt-3">
            <div className="font-mono text-3xl font-bold text-amber">
              {hrs(Date.now() - +running)}h
            </div>
            <p className="mt-1 text-xs text-ink-2">Running since {fmt(+running)} · {flag.get("clockedJob") || "General shop"}</p>
            <button onClick={clockOut} className="btn btn-amber mt-3"><Square size={14} /> Clock out</button>
          </div>
        ) : (
          <div className="mt-3">
            <select value={job} onChange={(e) => setJob(e.target.value)} className="field">
              <option value="">General shop time</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.title || j.id}>{j.title || "Untitled"}</option>
              ))}
            </select>
            <button onClick={clockIn} className="btn btn-amber mt-3"><Play size={14} /> Clock in</button>
          </div>
        )}
        <ul className="mt-4 divide-y divide-line">
          {cards.length === 0 && <li className="py-6 text-center text-sm text-ink-2">No shifts logged yet.</li>}
          {cards.slice(0, 6).map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
              <Clock size={13} className="text-ink-3" />
              <span className="min-w-0 flex-1 truncate text-ink">{c.job}</span>
              <span className="font-mono text-xs text-ink-2">{hrs(c.out - c.in)}h</span>
              <button onClick={() => clear(c.id)} className="text-xs text-ink-3 hover:text-alert">✕</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <span className="label">Machinery reservations</span>
        <div className="mt-3 space-y-4">
          {MACHINES.map((m) => (
            <div key={m.key}>
              <div className="mb-1 text-xs font-semibold text-ink">{m.label}</div>
              <div className="overflow-x-auto">
                <table className="text-[11px]">
                  <thead>
                    <tr><th className="w-10" />{DAYS.map((d) => <th key={d} className="px-1 py-0.5 font-mono text-ink-3">{d}</th>)}</tr>
                  </thead>
                  <tbody>
                    {HOURS.map((h) => (
                      <tr key={h}>
                        <td className="pr-1 font-mono text-ink-3">{h}</td>
                        {DAYS.map((d) => {
                          const on = res[`${m.key}|${d}|${h}`];
                          return (
                            <td key={d} className="p-0.5">
                              <button
                                onClick={() => toggle(m.key, d, h)}
                                className={`h-5 w-9 rounded ${on ? "bg-amber" : "bg-sunk hover:bg-line-2"}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
