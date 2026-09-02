import { motion } from "framer-motion";
import { AlertTriangle, ClipboardList, Clock, Hammer, Package, Plus } from "lucide-react";
import Ring from "./ui/Ring";
import { Stat } from "./ui/widgets";
import WoodBadge from "./ui/WoodBadge";
import { STAGE_KEYS } from "../lib/constants";
import { daysUntil, jobCode, money } from "../lib/format";

const activeStages = ["design", "milling", "assembly", "finishing"];

function buildAlerts(jobs, lumber) {
  const out = [];
  for (const j of jobs) {
    const d = daysUntil(j.due);
    if (d !== null && d < 0) out.push({ tone: "alert", text: `${jobCode(j)} ${j.client} — delivery ${Math.abs(d)}d overdue` });
    else if (d !== null && d <= 3 && j.stage !== "delivery") out.push({ tone: "warn", text: `${jobCode(j)} ${j.client} — due in ${d}d, still in ${j.stage}` });
    if (j.stage === "design" && !j.plan) out.push({ tone: "warn", text: `${jobCode(j)} — CAD / cut plan pending` });
    if (!j.estimate && +j.price === 0) out.push({ tone: "neutral", text: `${jobCode(j)} ${j.client} — no estimate on file` });
  }
  for (const l of lumber) {
    if (l.bf <= l.reorder) out.push({ tone: "alert", text: `Low stock — ${l.species} ${l.thickness} (${l.bf} bf left)` });
  }
  return out.slice(0, 7);
}

export default function Dashboard({ jobs, lumber, capacity, onNewJob, onClockIn, onOpen, onView }) {
  const active = jobs.filter((j) => activeStages.includes(j.stage));
  const ready = jobs.filter((j) => j.stage === "delivery").length;
  const load = capacity ? Math.round((active.length / capacity) * 100) : 0;
  const outstanding = jobs
    .filter((j) => j.stage !== "delivery")
    .reduce((s, j) => s + Math.max(0, (+j.price || 0) - (+j.deposit || 0)), 0);
  const alerts = buildAlerts(jobs, lumber);
  const soon = [...active].sort((a, b) => (daysUntil(a.due) ?? 999) - (daysUntil(b.due) ?? 999)).slice(0, 5);

  const card = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-4 lg:px-6"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={card}><Stat label="Active builds" value={active.length} hint={`${ready} ready to deliver`} icon={Hammer} tone="text-amber" /></motion.div>
      <motion.div variants={card}><Stat label="On the books" value={jobs.length} hint="commissions tracked" icon={ClipboardList} /></motion.div>
      <motion.div variants={card}><Stat label="Balance due" value={money(outstanding)} hint="across open jobs" icon={Package} /></motion.div>
      <motion.div variants={card} className="card flex items-center justify-center p-4">
        <Ring value={load} label="Shop floor" sub={`${active.length} / ${capacity} bays`} />
      </motion.div>

      <motion.div variants={card} className="card p-4 lg:col-span-2 lg:row-span-2">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber" />
          <span className="label">Alert feed</span>
        </div>
        {alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-2">All clear — no overdue jobs, no low stock.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {alerts.map((a, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 rounded-md border-l-2 bg-sunk/60 px-3 py-2 text-sm ${
                  a.tone === "alert" ? "border-alert" : a.tone === "warn" ? "border-warn" : "border-line-2"
                }`}
              >
                <span className="text-ink-2">{a.text}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <motion.div variants={card} className="card p-4 lg:col-span-2">
        <span className="label">Quick actions</span>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onNewJob} className="btn btn-amber"><Plus size={15} /> Log new commission</button>
          <button onClick={onClockIn} className="btn"><Clock size={15} /> Clock-in</button>
          <button onClick={() => onView("pipeline")} className="btn">Open job pipeline</button>
          <button onClick={() => onView("financials")} className="btn">Build a quote</button>
        </div>
      </motion.div>

      <motion.div variants={card} className="card p-4 lg:col-span-2">
        <span className="label">Closest deadlines</span>
        <ul className="mt-2 divide-y divide-line">
          {soon.length === 0 && <li className="py-6 text-center text-sm text-ink-2">Nothing on the floor right now.</li>}
          {soon.map((j) => {
            const d = daysUntil(j.due);
            return (
              <li key={j.id}>
                <button onClick={() => onOpen(j)} className="flex w-full items-center gap-3 py-2 text-left hover:bg-sunk/50">
                  <WoodBadge species={j.species} />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{j.title}</span>
                  <span className="font-mono text-[11px] text-ink-2">{STAGE_KEYS.indexOf(j.stage) + 1}/6</span>
                  <span className={`font-mono text-[11px] ${d < 0 ? "text-alert" : d <= 3 ? "text-warn" : "text-ink-3"}`}>
                    {d < 0 ? `${Math.abs(d)}d over` : d === 0 ? "today" : `${d}d`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </motion.div>
  );
}
