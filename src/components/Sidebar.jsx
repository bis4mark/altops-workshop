import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  CalendarClock,
  Columns3,
  FolderOpen,
  LayoutDashboard,
  ReceiptText,
  Settings2,
} from "lucide-react";
import { woodByName } from "../lib/constants";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, tone: woodByName("Sapele").tone },
  { key: "pipeline", label: "Job Pipeline", icon: Columns3, tone: woodByName("Mahogany").tone },
  { key: "inventory", label: "Lumber & Hardware", icon: Boxes, tone: woodByName("Odum (Iroko)").tone },
  { key: "locker", label: "Workshop Locker", icon: FolderOpen, tone: woodByName("Wawa").tone },
  { key: "schedule", label: "Labor & Schedule", icon: CalendarClock, tone: woodByName("Plywood").tone },
  { key: "financials", label: "Quoting & Financials", icon: ReceiptText, tone: woodByName("MDF Board").tone },
];

function Panel({ business, view, onView, onSettings, collapsible }) {
  return (
    <div
      className={`group/side flex h-full flex-col overflow-hidden bg-shell text-white/80 transition-[width] duration-200 ease-out ${
        collapsible ? "w-14 hover:w-60" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-shell-line px-3.5 py-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-amber font-mono text-xs font-bold text-white">
          AF
        </span>
        <div className="min-w-0 leading-tight opacity-0 transition-opacity duration-150 group-hover/side:opacity-100">
          <div className="truncate text-sm font-semibold text-white">{business}</div>
          <div className="label text-white/40">Workshop OS</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map(({ key, label, icon: Icon, tone }) => {
          const on = view === key;
          return (
            <button
              key={key}
              onClick={() => onView(key)}
              title={label}
              className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                on ? "font-medium" : "text-white/60 hover:bg-shell-2 hover:text-white"
              }`}
              style={on ? { backgroundColor: `${tone}26`, color: tone } : undefined}
            >
              <Icon
                size={18}
                className="shrink-0 transition-opacity duration-150 group-hover:opacity-100"
                style={{ color: tone, opacity: on ? 1 : 0.55 }}
              />
              <span className="truncate opacity-0 transition-opacity duration-150 group-hover/side:opacity-100">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onSettings}
        title="Business settings"
        className="flex items-center gap-2.5 border-t border-shell-line px-3.5 py-3 text-sm text-white/55 transition-colors hover:text-white"
      >
        <Settings2 size={18} className="shrink-0" />
        <span className="truncate opacity-0 transition-opacity duration-150 group-hover/side:opacity-100">
          Business settings
        </span>
      </button>
    </div>
  );
}

export default function Sidebar({ business, view, onView, onSettings, mobileOpen, onCloseMobile }) {
  const nav = (key) => {
    onView(key);
    onCloseMobile();
  };
  return (
    <>
      {/* Desktop: a 56px rail that expands over the content on hover */}
      <aside className="relative hidden w-14 shrink-0 lg:block">
        <div className="absolute inset-y-0 left-0 z-40">
          <Panel business={business} view={view} onView={onView} onSettings={onSettings} collapsible />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="m"
            className="fixed inset-0 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
            <motion.div
              className="absolute inset-y-0 left-0"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <Panel
                business={business}
                view={view}
                onView={nav}
                onSettings={() => {
                  onSettings();
                  onCloseMobile();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
