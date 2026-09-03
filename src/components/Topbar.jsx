import { Clock, Menu, Plus } from "lucide-react";
import ThemeToggle from "./ui/ThemeToggle";

const TITLES = {
  dashboard: ["Dashboard", "Shop floor at a glance"],
  pipeline: ["Job Pipeline", "Every build, by production stage"],
  inventory: ["Lumber & Hardware", "Stock on hand and reorder points"],
  locker: ["Workshop Locker", "Drawings, references and cut lists"],
  schedule: ["Labor & Shop Schedule", "Time cards and machine bookings"],
  financials: ["Quoting & Financials", "Estimates and payment tracking"],
};

export default function Topbar({ view, onMenu, onNewJob, onClockIn, theme, onTheme }) {
  const [title, sub] = TITLES[view] || ["Altops Workshop", ""];
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} aria-label="Open menu" className="btn !px-2 lg:hidden">
          <Menu size={16} />
        </button>
        <div>
          <h1 className="text-base font-semibold leading-tight text-ink">{title}</h1>
          <p className="hidden text-xs text-ink-2 sm:block">{sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle theme={theme} onChange={onTheme} />
        <button onClick={onClockIn} className="btn">
          <Clock size={15} />
          <span className="hidden sm:inline">Clock-In</span>
        </button>
        <button onClick={onNewJob} className="btn btn-amber">
          <Plus size={15} />
          <span className="hidden sm:inline">Log New Commission</span>
        </button>
      </div>
    </header>
  );
}
