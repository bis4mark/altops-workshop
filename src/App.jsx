import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import Workshop from "./components/Workshop";
import JobEditor from "./components/JobEditor";
import Portfolio from "./components/Portfolio";
import Lightbox from "./components/Lightbox";
import Settings from "./components/Settings";
import { DEFAULT_SETTINGS } from "./lib/constants";
import { emptyJob } from "./lib/format";
import {
  loadJobs,
  loadSettings,
  persistJob,
  persistSettings,
  removeJob,
} from "./lib/storage";

const byNewest = (a, b) => b.createdAt - a.createdAt;

export default function App() {
  const [view, setView] = useState("workshop");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const [loadedJobs, savedSettings] = await Promise.all([loadJobs(), loadSettings()]);
      setJobs(loadedJobs.sort(byNewest));
      if (savedSettings) setSettings(savedSettings);
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
  };
  const patchJob = async (job) => {
    await persistJob(job);
    upsert(job);
    setEditing(job);
  };
  const deleteJob = async (id) => {
    await removeJob(id);
    setJobs((list) => list.filter((x) => x.id !== id));
    setEditing(null);
  };
  const saveSettings = async (next) => {
    setSettings(next);
    await persistSettings(next);
  };
  const clearAll = async () => {
    await Promise.all(jobs.map((j) => removeJob(j.id)));
    setJobs([]);
    setShowSettings(false);
  };
  const addSample = () =>
    saveJob({
      ...emptyJob(),
      title: "Reception counter unit",
      client: "Shop fit-out",
      type: "Counter / Desk",
      status: "done",
      W: "1500",
      H: "1100",
      D: "600",
      material: "18mm melamine + plywood carcass",
      price: "3200",
      deposit: "1500",
      portfolio: true,
      blurb:
        "Two-tier reception counter with raised transaction top and lockable base cabinet.",
    });

  const stats = {
    total: jobs.length,
    active: jobs.filter((j) => j.status === "progress").length,
    value: jobs.reduce((sum, j) => sum + (+j.price || 0), 0),
    outstanding: jobs
      .filter((j) => j.status !== "delivered")
      .reduce((sum, j) => sum + Math.max(0, (+j.price || 0) - (+j.deposit || 0)), 0),
  };

  const q = query.trim().toLowerCase();
  const visible = jobs.filter(
    (j) =>
      (filter === "all" || j.status === filter) &&
      (q === "" || (j.title + j.client + j.type).toLowerCase().includes(q)),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-ink-soft">
        Loading your workshop…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <Nav
        business={settings.business}
        view={view}
        onView={(v) => {
          setEditing(null);
          setView(v);
        }}
        onSettings={() => setShowSettings(true)}
      />

      <div className="mx-auto max-w-[1100px] px-4 py-6">
        {editing ? (
          <JobEditor
            job={editing}
            settings={settings}
            onSave={saveJob}
            onPatch={patchJob}
            onCancel={() => setEditing(null)}
            onDelete={deleteJob}
            setLightbox={setLightbox}
          />
        ) : view === "workshop" ? (
          <Workshop
            stats={stats}
            jobs={visible}
            filter={filter}
            query={query}
            onFilter={setFilter}
            onQuery={setQuery}
            onNew={() => setEditing(emptyJob())}
            onOpen={setEditing}
            onSample={addSample}
          />
        ) : (
          <Portfolio
            jobs={jobs.filter((j) => j.portfolio)}
            settings={settings}
            setLightbox={setLightbox}
            onGoWorkshop={() => setView("workshop")}
          />
        )}
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
          onClearAll={clearAll}
        />
      )}
    </div>
  );
}
