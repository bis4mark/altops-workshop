import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./components/Dashboard";
import Pipeline from "./components/Pipeline";
import Inventory from "./components/Inventory";
import Locker from "./components/Locker";
import Schedule from "./components/Schedule";
import Financials from "./components/Financials";
import Drawer from "./components/ui/Drawer";
import JobEditor from "./components/JobEditor";
import Settings from "./components/Settings";
import Lightbox from "./components/Lightbox";
import ToastHost from "./components/ui/Toast";
import { Skeleton } from "./components/ui/widgets";
import { DEFAULT_SETTINGS, STATUS_TO_STAGE } from "./lib/constants";
import { emptyJob } from "./lib/format";
import { seedIfEmpty } from "./lib/seed";
import { useTheme } from "./lib/theme";
import {
  loadCollection,
  loadJobs,
  loadSettings,
  persistJob,
  persistSettings,
  removeJob,
} from "./lib/storage";

const byNewest = (a, b) => b.createdAt - a.createdAt;
const migrate = (j) => ({ ...j, stage: j.stage || STATUS_TO_STAGE[j.status] || "deposit" });

export default function App() {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState("dashboard");
  const [jobs, setJobs] = useState([]);
  const [lumber, setLumber] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [toasts, setToasts] = useState([]);

  const pushToast = (message, action) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 2600);
  };
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const [j, saved, lm] = await Promise.all([loadJobs(), loadSettings(), loadCollection("wlumber_")]);
      setJobs(j.map(migrate).sort(byNewest));
      setLumber(lm);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setLoading(false);
    })();
  }, []);

  const upsert = (job) =>
    setJobs((list) => {
      const i = list.findIndex((x) => x.id === job.id);
      const next = i >= 0 ? list.map((x) => (x.id === job.id ? job : x)) : [job, ...list];
      return next.sort(byNewest);
    });

  const saveJob = async (job) => {
    await persistJob(job);
    upsert(job);
    setEditing(null);
    pushToast(`${job.title || "Job"} saved`);
  };
  const patchJob = async (job) => { await persistJob(job); upsert(job); setEditing(job); };
  const deleteJob = async (id) => {
    const removed = jobs.find((x) => x.id === id);
    await removeJob(id);
    setJobs((list) => list.filter((x) => x.id !== id));
    setEditing(null);
    if (removed) {
      pushToast(`${removed.title || "Job"} deleted`, {
        label: "Undo",
        onClick: async () => { await persistJob(removed); upsert(removed); },
      });
    }
  };
  const setStage = async (id, stage) => {
    const job = jobs.find((x) => x.id === id);
    if (!job || job.stage === stage) return;
    const next = { ...job, stage };
    await persistJob(next);
    upsert(next);
  };
  const recordPayment = async (id, amount, note) => {
    const job = jobs.find((x) => x.id === id);
    if (!job || !(+amount)) return;
    const next = {
      ...job,
      payments: [...(job.payments || []), { amount: +amount, at: Date.now(), note: note || "" }],
    };
    await persistJob(next);
    upsert(next);
  };
  const addJobPhoto = async (id, dataUrl) => {
    const job = jobs.find((x) => x.id === id);
    if (!job) return;
    const next = { ...job, photos: [...(job.photos || []), dataUrl] };
    await persistJob(next);
    upsert(next);
  };
  const saveSettings = async (next) => { setSettings(next); await persistSettings(next); };
  const clearAll = async () => {
    await Promise.all(jobs.map((j) => removeJob(j.id)));
    setJobs([]);
    setShowSettings(false);
  };

  const newJob = () => setEditing(emptyJob());

  return (
    <div className="flex min-h-screen">
      <Sidebar
        business={settings.business}
        view={view}
        onView={setView}
        onSettings={() => setShowSettings(true)}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          view={view}
          onMenu={() => setMobileNav(true)}
          onNewJob={newJob}
          onClockIn={() => setView("schedule")}
          theme={theme}
          onTheme={setTheme}
        />

        <main className="min-h-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-4 lg:px-6">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : view === "dashboard" ? (
            <Dashboard
              jobs={jobs}
              lumber={lumber}
              capacity={settings.capacity}
              onNewJob={newJob}
              onClockIn={() => setView("schedule")}
              onOpen={setEditing}
              onView={setView}
            />
          ) : view === "pipeline" ? (
            <Pipeline jobs={jobs} onOpen={setEditing} onStage={setStage} onNewJob={newJob} />
          ) : view === "inventory" ? (
            <Inventory />
          ) : view === "locker" ? (
            <Locker jobs={jobs} onOpen={setEditing} onNewJob={newJob} onAddPhoto={addJobPhoto} />
          ) : view === "schedule" ? (
            <Schedule jobs={jobs} />
          ) : (
            <Financials jobs={jobs} onOpen={setEditing} onPay={recordPayment} />
          )}
        </main>
      </div>

      <Drawer
        open={!!editing}
        title={editing ? editing.title || "New commission" : ""}
        subtitle={editing ? `${editing.type} · ${editing.client || "no client"}` : ""}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <JobEditor
            job={editing}
            settings={settings}
            onSave={saveJob}
            onPatch={patchJob}
            onCancel={() => setEditing(null)}
            onDelete={deleteJob}
            setLightbox={setLightbox}
          />
        )}
      </Drawer>

      <Settings
        open={showSettings}
        settings={settings}
        onSave={saveSettings}
        onClose={() => setShowSettings(false)}
        onClearAll={clearAll}
      />

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
