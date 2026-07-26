import React, { useState, useEffect, useRef } from "react";

/* =====================================================================
 *  ALTOPS WORKSHOP — one app for the whole job
 *  Workshop  : track every build
 *  Per job   : Measure (AI) -> Estimate (invoice) -> Plan (cut list) -> Photos
 *  Portfolio : public showcase auto-built from finished jobs
 *  Persists across sessions via window.storage.
 * ===================================================================== */

const ESP = "#2b2019", OAK = "#b0894e", CREAM = "#f7f2e8", CARD = "#fffdf8";
const INK = "#2a221b", INK2 = "#7a6f62", LINE = "#e4dac6";
const STATUS = { quote: { label: "Quote", c: "#c98a2b" }, progress: { label: "In progress", c: "#3a6b8a" }, done: { label: "Completed", c: "#4f9d69" }, delivered: { label: "Delivered", c: "#6f6a63" } };
const TYPES = ["Cabinet", "Wardrobe", "Counter / Desk", "Table", "Bed", "Bookshelf", "Door", "Other"];

const WOOD_TYPES = [
  { name: "Mahogany", pricePerSheet: 420 }, { name: "Odum (Iroko)", pricePerSheet: 380 },
  { name: "Wawa", pricePerSheet: 220 }, { name: "Sapele", pricePerSheet: 460 },
  { name: "MDF Board", pricePerSheet: 180 }, { name: "Plywood", pricePerSheet: 150 },
];
const CABINET_TYPES = [
  { name: "L-Shape Kitchen Cabinet", sheetsNeeded: 18, machineBase: 1976, fittingsBase: 3501, marbleBase: 10950 },
  { name: "Straight Kitchen Cabinet", sheetsNeeded: 10, machineBase: 1200, fittingsBase: 2000, marbleBase: 6000 },
  { name: "Wardrobe (Single)", sheetsNeeded: 8, machineBase: 900, fittingsBase: 1500, marbleBase: 0 },
  { name: "Wardrobe (Double)", sheetsNeeded: 14, machineBase: 1400, fittingsBase: 2500, marbleBase: 0 },
  { name: "TV Stand / Cabinet", sheetsNeeded: 5, machineBase: 700, fittingsBase: 1000, marbleBase: 0 },
  { name: "Counter / Reception Desk", sheetsNeeded: 12, machineBase: 1500, fittingsBase: 2200, marbleBase: 0 },
  { name: "Custom (Manual Entry)", sheetsNeeded: 0, machineBase: 0, fittingsBase: 0, marbleBase: 0 },
];
const TYPE_TO_CAB = { "Cabinet": "Straight Kitchen Cabinet", "Wardrobe": "Wardrobe (Single)", "Counter / Desk": "Counter / Reception Desk", "Table": "Custom (Manual Entry)", "Bed": "Custom (Manual Entry)", "Bookshelf": "Custom (Manual Entry)", "Door": "Custom (Manual Entry)", "Other": "Custom (Manual Entry)" };

const money = (n) => "₵" + (Number(n) || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rid = () => "j" + Math.random().toString(36).slice(2, 9);
const emptyJob = () => ({ id: rid(), title: "", client: "", type: "Cabinet", status: "quote", W: "", H: "", D: "", material: "", price: "", deposit: "", due: "", notes: "", photos: [], measurements: [], estimate: null, plan: null, portfolio: false, blurb: "", createdAt: Date.now() });

/* ---- storage (localStorage — works in any browser / Vercel) ---- */
const hasStore = typeof window !== "undefined" && !!window.localStorage;
async function loadJobs() {
  if (!hasStore) return [];
  try {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("wjob_")) { try { out.push(JSON.parse(localStorage.getItem(k))); } catch (e) {} }
    }
    return out;
  } catch (e) { return []; }
}
async function persistJob(job) { if (hasStore) { try { localStorage.setItem("wjob_" + job.id, JSON.stringify(job)); } catch (e) {} } }
async function removeJob(id) { if (hasStore) { try { localStorage.removeItem("wjob_" + id); } catch (e) {} } }
async function loadSettings() { if (!hasStore) return null; try { const v = localStorage.getItem("wsettings"); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
async function persistSettings(s) { if (hasStore) { try { localStorage.setItem("wsettings", JSON.stringify(s)); } catch (e) {} } }

/* ---- image downscale ---- */
function fileToThumb(file, max = 1100, q = 0.78) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * s), h = Math.round(img.height * s);
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", q)); };
    img.onerror = rej; img.src = url;
  });
}
function canvasDown(srcCanvas, max = 1100, q = 0.8) {
  const s = Math.min(1, max / Math.max(srcCanvas.width, srcCanvas.height));
  const w = Math.round(srcCanvas.width * s), h = Math.round(srcCanvas.height * s);
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(srcCanvas, 0, 0, w, h);
  return c.toDataURL("image/jpeg", q);
}

/* ---- plan engine (cut list + board packing) ---- */
function carcassParts(W, H, D, t, shelves, doors) {
  const iw = W - 2 * t, p = [];
  const add = (name, mat, L, Wd, qty) => { if (qty > 0 && L > 0 && Wd > 0) p.push({ name, mat, L: Math.round(L), Wd: Math.round(Wd), qty }); };
  add("Side panel", "Carcass", D, H, 2); add("Top / bottom", "Carcass", iw, D, 2);
  if (shelves > 0) add("Shelf", "Carcass", iw, D - 20, shelves);
  if (doors > 0) add("Door", "Carcass", H - 4, W / doors - 3, doors);
  add("Back panel", "Back", W, H, 1);
  return p;
}
function tableParts(L, W, H, t) {
  const p = []; const add = (name, mat, a, b, qty) => p.push({ name, mat, L: Math.round(a), Wd: Math.round(b), qty });
  add("Top", "Carcass", L, W, 1); add("Leg", "Carcass", H - t, 89, 4);
  add("Apron (long)", "Carcass", L - 178, 89, 2); add("Apron (short)", "Carcass", W - 178, 89, 2);
  return p;
}
function packMaterial(pieces, SW, SH, kerf) {
  const norm = pieces.map((p) => { let w = p.L, h = p.Wd; if (h > w) { const t = w; w = h; h = t; } return { ...p, w, h }; });
  norm.sort((a, b) => b.h - a.h || b.w - a.w);
  const sheets = [];
  for (const piece of norm) {
    if (piece.w > SW || piece.h > SH) { if (piece.h <= SW && piece.w <= SH) { const t = piece.w; piece.w = piece.h; piece.h = t; } }
    let placed = false;
    for (const sheet of sheets) {
      for (const shelf of sheet.shelves) {
        const gap = shelf.x > 0 ? kerf : 0;
        const orient = [[piece.w, piece.h], [piece.h, piece.w]];
        let ch = null; for (const [ow, oh] of orient) if (shelf.x + gap + ow <= SW && oh <= shelf.height) { ch = [ow, oh]; break; }
        if (ch) { shelf.x += gap + ch[0]; placed = true; break; }
      }
      if (placed) break;
      const nextY = sheet.bottom > 0 ? sheet.bottom + kerf : 0;
      if (nextY + piece.h <= SH) { sheet.shelves.push({ x: piece.w, height: piece.h }); sheet.bottom = nextY + piece.h; placed = true; break; }
    }
    if (!placed) { sheets.push({ shelves: [{ x: piece.w, height: piece.h }], bottom: piece.h }); }
  }
  return sheets.length;
}
function buildPlan(job, t, shelves, doors) {
  const W = +job.W, H = +job.H, D = +job.D;
  if (!W || !H) return null;
  const parts = job.type === "Table" ? tableParts(W, D || 600, H, t) : carcassParts(W, H, D || 570, t, shelves, doors);
  const groups = {};
  for (const p of parts) { (groups[p.mat] ||= []); for (let i = 0; i < p.qty; i++) groups[p.mat].push({ L: p.L, Wd: p.Wd }); }
  const boards = Object.entries(groups).map(([mat, pcs]) => ({ mat, count: packMaterial(pcs, 2440, 1220, 3) }));
  return { parts, boards, t, shelves, doors, at: Date.now() };
}

/* ===================== main ===================== */
export default function AltopsWorkshop() {
  const [view, setView] = useState("workshop");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ business: "Altops Furniture Enterprise", tagline: "Custom cabinets, counters & fitted furniture", location: "Near Asafo Labour R.D, Kumasi", phone: "0244622461" });

  useEffect(() => { (async () => {
    const j = await loadJobs(); const s = await loadSettings();
    setJobs(j.sort((a, b) => b.createdAt - a.createdAt)); if (s) setSettings(s); setLoading(false);
  })(); }, []);

  const upsert = (job) => setJobs((js) => { const i = js.findIndex((x) => x.id === job.id);
    return (i >= 0 ? js.map((x) => (x.id === job.id ? job : x)) : [job, ...js]).sort((a, b) => b.createdAt - a.createdAt); });
  const saveJob = async (job) => { await persistJob(job); upsert(job); setEditing(null); };
  const patchJob = async (job) => { await persistJob(job); upsert(job); setEditing(job); };
  const deleteJob = async (id) => { await removeJob(id); setJobs((js) => js.filter((x) => x.id !== id)); setEditing(null); };
  const saveSettings = async (s) => { setSettings(s); await persistSettings(s); };

  const addSample = () => saveJob({ ...emptyJob(), title: "Reception counter unit", client: "Shop fit-out", type: "Counter / Desk", status: "done", W: "1500", H: "1100", D: "600", material: "18mm melamine + plywood carcass", price: "3200", deposit: "1500", portfolio: true, blurb: "Two-tier reception counter with raised transaction top, lower work surface and a lockable base cabinet." });

  const stats = { total: jobs.length, active: jobs.filter((j) => j.status === "progress").length,
    value: jobs.reduce((a, j) => a + (+j.price || 0), 0),
    outstanding: jobs.filter((j) => j.status !== "delivered").reduce((a, j) => a + Math.max(0, (+j.price || 0) - (+j.deposit || 0)), 0) };
  const visible = jobs.filter((j) => (filter === "all" || j.status === filter) && (query === "" || (j.title + j.client + j.type).toLowerCase().includes(query.toLowerCase())));

  if (loading) return <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", color: INK2 }}>Loading your workshop…</div>;

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`@media print { .no-print{display:none!important} }`}</style>
      <div style={{ background: ESP, color: CREAM }}>
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2"><span style={{ width: 12, height: 12, background: OAK, borderRadius: 2 }} /><span style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18 }}>{settings.business}</span></div>
          <div className="flex items-center gap-2">
            <div style={{ display: "flex", background: "#3b2d22", borderRadius: 8, padding: 2 }}>
              {[["workshop", "Workshop"], ["portfolio", "Portfolio"]].map(([k, l]) => (
                <button key={k} onClick={() => { setEditing(null); setView(k); }} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 14, fontWeight: 600, background: view === k ? OAK : "transparent", color: view === k ? ESP : "#d8cbb8" }}>{l}</button>
              ))}
            </div>
            <button onClick={() => setShowSettings(true)} style={{ padding: "6px 10px", borderRadius: 6, background: "#3b2d22", color: "#d8cbb8" }}>⚙</button>
          </div>
        </div>
      </div>


      <div className="mx-auto max-w-6xl px-4 py-6">
        {editing ? (
          <JobEditor job={editing} onSave={saveJob} onPatch={patchJob} onCancel={() => setEditing(null)} onDelete={deleteJob} setLightbox={setLightbox} settings={settings} />
        ) : view === "workshop" ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" style={{ marginBottom: 18 }}>
              <Stat n={stats.total} l="Total jobs" c={OAK} /><Stat n={stats.active} l="In progress" c="#3a6b8a" />
              <Stat n={money(stats.value)} l="Pipeline value" c="#4f9d69" /><Stat n={money(stats.outstanding)} l="Outstanding" c="#c05c4d" />
            </div>
            <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 14 }}>
              <button onClick={() => setEditing(emptyJob())} style={{ background: ESP, color: CREAM, padding: "9px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14 }}>+ New job</button>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jobs…" style={{ flex: 1, minWidth: 140, padding: "9px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: CARD, color: INK, fontSize: 14 }} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "9px 10px", borderRadius: 8, border: `1px solid ${LINE}`, background: CARD, color: INK, fontSize: 14 }}>
                <option value="all">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            {visible.length === 0 ? <EmptyState onNew={() => setEditing(emptyJob())} onSample={addSample} /> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{visible.map((j) => <JobCard key={j.id} job={j} onOpen={() => setEditing(j)} />)}</div>
            )}
          </>
        ) : (
          <Portfolio jobs={jobs.filter((j) => j.portfolio)} settings={settings} setLightbox={setLightbox} onGoWorkshop={() => setView("workshop")} />
        )}
      </div>

      {lightbox && <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}><img src={lightbox} alt="" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 6 }} /></div>}
      {showSettings && <Settings settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} onClearAll={async () => { for (const j of jobs) await removeJob(j.id); setJobs([]); setShowSettings(false); }} />}
    </div>
  );
}

/* ---- shared ---- */
function Stat({ n, l, c }) { return <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800, color: c, fontFamily: "Georgia, serif" }}>{n}</div><div style={{ fontSize: 12, color: INK2, marginTop: 2 }}>{l}</div></div>; }
function Badge({ s }) { const st = STATUS[s] || STATUS.quote; return <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: st.c, padding: "2px 8px", borderRadius: 10 }}>{st.label}</span>; }
function Dot({ on, label }) { return <span title={label} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: on ? "#4f9d69" : "#c3b596" }}><span style={{ width: 7, height: 7, borderRadius: 999, background: on ? "#4f9d69" : "#d8cdb5" }} />{label}</span>; }

function JobCard({ job, onOpen }) {
  const cover = job.photos && job.photos[0]; const bal = Math.max(0, (+job.price || 0) - (+job.deposit || 0));
  return (
    <button onClick={onOpen} style={{ textAlign: "left", background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ height: 130, background: cover ? "#000" : "#efe7d6", display: "flex", alignItems: "center", justifyContent: "center" }}>{cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#c3b596", fontSize: 30, fontFamily: "Georgia, serif" }}>◳</span>}</div>
      <div style={{ padding: 12 }}>
        <div className="flex items-center justify-between gap-2"><Badge s={job.status} />{job.portfolio && <span style={{ fontSize: 10, color: OAK, fontWeight: 700 }}>★ PORTFOLIO</span>}</div>
        <div style={{ fontWeight: 700, marginTop: 6, color: INK }}>{job.title || "Untitled job"}</div>
        <div style={{ fontSize: 12, color: INK2 }}>{job.client || "—"} · {job.type}</div>
        <div className="flex items-center gap-2" style={{ marginTop: 8 }}><Dot on={(job.measurements || []).length > 0} label="Measured" /><Dot on={!!job.estimate} label="Estimated" /><Dot on={!!job.plan} label="Planned" /></div>
        <div className="flex items-center justify-between" style={{ marginTop: 8, fontSize: 12 }}><span style={{ fontFamily: "ui-monospace, monospace", color: INK }}>{money(job.price)}</span>{bal > 0 && <span style={{ color: "#c05c4d" }}>bal {money(bal)}</span>}</div>
      </div>
    </button>
  );
}

function EmptyState({ onNew, onSample }) {
  return <div style={{ textAlign: "center", padding: "48px 16px", background: CARD, border: `1px dashed ${LINE}`, borderRadius: 12 }}>
    <div style={{ fontSize: 40, color: "#cbbd9c" }}>◳</div><div style={{ fontWeight: 700, marginTop: 6, color: INK }}>No jobs yet</div>
    <div style={{ fontSize: 13, color: INK2, marginTop: 2 }}>Log a build to measure, quote, plan and track it.</div>
    <div className="flex items-center justify-center gap-2" style={{ marginTop: 14 }}>
      <button onClick={onNew} style={{ background: ESP, color: CREAM, padding: "9px 16px", borderRadius: 8, fontWeight: 600 }}>+ New job</button>
      <button onClick={onSample} style={{ background: "transparent", color: OAK, padding: "9px 16px", borderRadius: 8, fontWeight: 600, border: `1px solid ${OAK}` }}>Add sample project</button>
    </div></div>;
}

function Field({ label, children, full }) { return <label className="flex flex-col gap-1" style={{ gridColumn: full ? "1 / -1" : "auto" }}><span style={{ fontSize: 12, color: INK2 }}>{label}</span>{children}</label>; }
const inp = { padding: "8px 10px", borderRadius: 8, border: `1px solid ${LINE}`, background: CARD, color: INK, fontSize: 14, width: "100%" };

/* ================= job editor with workflow tabs ================= */
function JobEditor({ job, onSave, onPatch, onCancel, onDelete, setLightbox, settings }) {
  const [j, setJ] = useState(job);
  const [tab, setTab] = useState("details");
  const up = (k, v) => setJ((x) => ({ ...x, [k]: v }));
  const patch = (partial) => { const nj = { ...j, ...partial }; setJ(nj); onPatch(nj); };
  const TABS = [["details", "Details"], ["measure", "Measure"], ["estimate", "Estimate"], ["plan", "Plan"], ["photos", "Photos"]];

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 800 }}>{j.title || "New job"}</h2>
        <button onClick={onCancel} style={{ color: INK2 }}>✕ Close</button>
      </div>
      <div className="flex flex-wrap gap-1 no-print" style={{ marginBottom: 16, borderBottom: `1px solid ${LINE}`, paddingBottom: 8 }}>
        {TABS.map(([k, l]) => { const done = k === "measure" ? (j.measurements || []).length > 0 : k === "estimate" ? !!j.estimate : k === "plan" ? !!j.plan : false;
          return <button key={k} onClick={() => setTab(k)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: tab === k ? ESP : "transparent", color: tab === k ? CREAM : INK }}>{l}{done && tab !== k ? " ✓" : ""}</button>; })}
      </div>

      {tab === "details" && <DetailsPanel j={j} up={up} />}
      {tab === "measure" && <MeasurePanel j={j} patch={patch} setLightbox={setLightbox} onUseDims={(m) => { patch({ W: String(Math.round(m.length_cm * 10)), H: String(Math.round(m.width_cm * 10)), D: j.D }); setTab("details"); }} />}
      {tab === "estimate" && <EstimatePanel j={j} patch={patch} settings={settings} />}
      {tab === "plan" && <PlanPanel j={j} patch={patch} />}
      {tab === "photos" && <PhotosPanel j={j} setJ={setJ} setLightbox={setLightbox} />}

      <div className="flex items-center justify-between no-print" style={{ marginTop: 18, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
        <button onClick={() => onDelete(j.id)} style={{ color: "#c05c4d", fontSize: 14 }}>Delete job</button>
        <div className="flex gap-2"><button onClick={onCancel} style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${LINE}`, color: INK }}>Cancel</button>
          <button onClick={() => onSave(j)} style={{ padding: "9px 18px", borderRadius: 8, background: ESP, color: CREAM, fontWeight: 600 }}>Save job</button></div>
      </div>
    </div>
  );
}

function DetailsPanel({ j, up }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Job title" full><input style={inp} value={j.title} onChange={(e) => up("title", e.target.value)} placeholder="e.g. Reception counter for Altops" /></Field>
      <Field label="Client"><input style={inp} value={j.client} onChange={(e) => up("client", e.target.value)} /></Field>
      <Field label="Type"><select style={inp} value={j.type} onChange={(e) => up("type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Status"><select style={inp} value={j.status} onChange={(e) => up("status", e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
      <Field label="Due date"><input type="date" style={inp} value={j.due} onChange={(e) => up("due", e.target.value)} /></Field>
      <Field label="Width (mm)"><input style={inp} value={j.W} onChange={(e) => up("W", e.target.value)} /></Field>
      <Field label="Height (mm)"><input style={inp} value={j.H} onChange={(e) => up("H", e.target.value)} /></Field>
      <Field label="Depth (mm)"><input style={inp} value={j.D} onChange={(e) => up("D", e.target.value)} /></Field>
      <Field label="Material" full><input style={inp} value={j.material} onChange={(e) => up("material", e.target.value)} placeholder="e.g. 18mm melamine + plywood" /></Field>
      <Field label="Price (₵)"><input type="number" style={inp} value={j.price} onChange={(e) => up("price", e.target.value)} /></Field>
      <Field label="Deposit paid (₵)"><input type="number" style={inp} value={j.deposit} onChange={(e) => up("deposit", e.target.value)} /></Field>
      <Field label="Notes" full><textarea style={{ ...inp, minHeight: 60 }} value={j.notes} onChange={(e) => up("notes", e.target.value)} /></Field>
      <div style={{ gridColumn: "1 / -1", padding: 12, background: "#faf6ec", border: `1px solid ${LINE}`, borderRadius: 10 }}>
        <label className="flex items-center gap-2" style={{ cursor: "pointer" }}><input type="checkbox" checked={j.portfolio} onChange={(e) => up("portfolio", e.target.checked)} /><span style={{ fontWeight: 600, color: INK }}>Show this build in my public portfolio</span></label>
        {j.portfolio && <textarea style={{ ...inp, minHeight: 54, marginTop: 8 }} value={j.blurb} onChange={(e) => up("blurb", e.target.value)} placeholder="A short line about this piece for visitors." />}
      </div>
    </div>
  );
}

/* ---- MEASURE (AI) ---- */
const REF_OBJECTS = ["A4 paper (297×210mm)", "Standard brick (215×102mm)", "Credit card (85×54mm)", "20cm ruler", "Tape measure visible in photo", "Custom reference object"];
function MeasurePanel({ j, patch, setLightbox, onUseDims }) {
  const [ref, setRef] = useState(REF_OBJECTS[0]);
  const [customRef, setCustomRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [cam, setCam] = useState(false);
  const videoRef = useRef(null); const canvasRef = useRef(null); const streamRef = useRef(null); const fileRef = useRef(null);

  const stopCam = () => { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; setCam(false); };
  const startCam = async () => { setErr(null); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } } }); streamRef.current = s; setCam(true); setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100); } catch (e) { setErr("Camera blocked. Allow permission or upload a photo instead."); } };

  const analyze = async (dataUrl) => {
    setBusy(true); setErr(null);
    const refText = ref === "Custom reference object" && customRef ? customRef : ref;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: dataUrl.split(",")[1] } },
          { type: "text", text: `You measure wood for a furniture workshop. Reference object in image: ${refText}. Using it for scale, respond ONLY with JSON (no markdown): {"items":[{"label":"Board 1","length_cm":190,"width_cm":60,"thickness_cm":1.8,"material_guess":"MDF/Plywood/Hardwood","condition":"new/used"}],"total_boards":1,"reference_detected":true,"confidence":"high/medium/low","recommended_product":"what it suits"}` }] }] }) });
      const data = await r.json();
      const text = (data.content || []).map((c) => c.text || "").join("");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const entry = { id: Date.now(), image: dataUrl, result: parsed, ref: refText, date: new Date().toLocaleDateString("en-GB") };
      patch({ measurements: [entry, ...(j.measurements || [])].slice(0, 6) });
    } catch (e) { setErr("Could not read the photo. Try clearer lighting and a visible reference object."); }
    setBusy(false);
  };
  const capture = () => { const v = videoRef.current, c = canvasRef.current; if (!v || !c) return; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); const url = canvasDown(c, 1100, 0.8); stopCam(); analyze(url); };
  const onUpload = async (f) => { if (!f) return; try { const url = await fileToThumb(f, 1100, 0.8); analyze(url); } catch (e) { setErr("Could not read that image."); } };

  return (
    <div>
      {!cam ? (
        <>
          <div style={{ background: "#faf6ec", border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: INK2, marginBottom: 8 }}>Place a reference object beside the wood so the AI can estimate real size.</div>
            <div className="flex flex-wrap gap-2">{REF_OBJECTS.map((r) => <button key={r} onClick={() => setRef(r)} style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8, border: `1px solid ${ref === r ? OAK : LINE}`, background: ref === r ? "#f2e6cc" : CARD, color: INK }}>{r}</button>)}</div>
            {ref === "Custom reference object" && <input style={{ ...inp, marginTop: 8 }} value={customRef} onChange={(e) => setCustomRef(e.target.value)} placeholder="e.g. jerry can 40cm tall" />}
          </div>
          <div className="flex gap-2" style={{ marginBottom: 12 }}>
            <button onClick={startCam} disabled={busy} style={{ flex: 1, padding: 12, background: ESP, color: CREAM, borderRadius: 8, fontWeight: 600 }}>Open camera</button>
            <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy} style={{ flex: 1, padding: 12, background: "transparent", color: OAK, border: `1px solid ${OAK}`, borderRadius: 8, fontWeight: 600 }}>Upload photo</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onUpload(e.target.files && e.target.files[0])} />
          </div>
        </>
      ) : (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", marginBottom: 12 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", maxHeight: "60vh", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: "10%", border: "2px dashed rgba(240,192,64,0.6)", borderRadius: 8, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={stopCam} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "8px 14px", borderRadius: 6 }}>Cancel</button>
            <button onClick={capture} style={{ width: 62, height: 62, borderRadius: "50%", background: OAK, border: "4px solid #fff" }} />
            <span style={{ width: 60 }} />
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {busy && <div style={{ textAlign: "center", color: OAK, padding: 16, fontWeight: 600 }}>Analyzing dimensions…</div>}
      {err && <div style={{ background: "#fbecec", color: "#9c3b30", borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 12 }}>{err}</div>}

      {(j.measurements || []).map((m) => (
        <div key={m.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
          <div className="flex gap-3">
            <img src={m.image} onClick={() => setLightbox(m.image)} alt="" style={{ width: 84, height: 84, objectFit: "cover", borderRadius: 8, cursor: "pointer" }} />
            <div style={{ flex: 1 }}>
              <div className="flex items-center justify-between"><span style={{ fontSize: 12, fontWeight: 700, color: INK }}>{m.result.total_boards} board(s) · {m.result.confidence} confidence</span><span style={{ fontSize: 11, color: INK2 }}>{m.date}</span></div>
              {(m.result.items || []).map((it, i) => (
                <div key={i} style={{ marginTop: 6, fontSize: 13 }}>
                  <div style={{ fontWeight: 600, color: INK }}>{it.label} <span style={{ fontFamily: "ui-monospace, monospace", color: INK2 }}>{it.length_cm}×{it.width_cm}×{it.thickness_cm} cm</span></div>
                  <div style={{ fontSize: 11, color: INK2 }}>{it.material_guess} · {it.condition}</div>
                  <button onClick={() => onUseDims(it)} style={{ marginTop: 4, fontSize: 11, color: OAK, fontWeight: 700 }}>Use as job dimensions →</button>
                </div>
              ))}
              {m.result.recommended_product && <div style={{ fontSize: 11, color: OAK, marginTop: 4 }}>Best for: {m.result.recommended_product}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- ESTIMATE + INVOICE ---- */
function EstimatePanel({ j, patch, settings }) {
  const seed = j.estimate;
  const initCab = CABINET_TYPES.find((c) => c.name === (seed ? seed.cabinetType : TYPE_TO_CAB[j.type])) || CABINET_TYPES[0];
  const [cab, setCab] = useState(initCab);
  const [qty, setQty] = useState(seed ? seed.qty : 1);
  const [wood, setWood] = useState(WOOD_TYPES.find((w) => w.name === (seed && seed.woodType)) || WOOD_TYPES[0]);
  const [sheets, setSheets] = useState(seed ? seed.sheets : initCab.sheetsNeeded);
  const [machine, setMachine] = useState(seed ? seed.machine : initCab.machineBase);
  const [fittings, setFittings] = useState(seed ? seed.fittings : initCab.fittingsBase);
  const [marble, setMarble] = useState(seed ? seed.marble : initCab.marbleBase);
  const [tt, setTt] = useState(seed ? seed.tt : 500);
  const [labour, setLabour] = useState(seed ? seed.labour : 9000);
  const [advance, setAdvance] = useState(seed ? seed.advance : (+j.deposit || 0));
  const [invoice, setInvoice] = useState(false);

  const applyCab = (name) => { const c = CABINET_TYPES.find((x) => x.name === name); setCab(c); if (c.name !== "Custom (Manual Entry)") { setSheets(c.sheetsNeeded * qty); setMachine(c.machineBase * qty); setFittings(c.fittingsBase * qty); setMarble(c.marbleBase * qty); } };
  const applyQty = (q) => { const n = Math.max(1, parseInt(q) || 1); setQty(n); if (cab.name !== "Custom (Manual Entry)") { setSheets(cab.sheetsNeeded * n); setMachine(cab.machineBase * n); setFittings(cab.fittingsBase * n); setMarble(cab.marbleBase * n); } };

  const woodCost = (+sheets) * wood.pricePerSheet;
  const subtotal = woodCost + (+machine) + (+fittings) + (+marble) + (+tt) + (+labour);
  const balance = subtotal - (+advance);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  const saveEstimate = () => patch({ estimate: { cabinetType: cab.name, qty, woodType: wood.name, pricePerSheet: wood.pricePerSheet, sheets: +sheets, machine: +machine, fittings: +fittings, marble: +marble, tt: +tt, labour: +labour, advance: +advance, subtotal, balance } });
  const applyToJob = () => patch({ price: String(subtotal), deposit: String(advance), estimate: { cabinetType: cab.name, qty, woodType: wood.name, pricePerSheet: wood.pricePerSheet, sheets: +sheets, machine: +machine, fittings: +fittings, marble: +marble, tt: +tt, labour: +labour, advance: +advance, subtotal, balance } });

  const rows = [["Wood material cost", woodCost], ["Machine charges", machine], ["Fittings/accessories", fittings], ["Marble and fabrication", marble], ["T and T", tt], ["Labour charge", labour]];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Project / cabinet type" full><select style={inp} value={cab.name} onChange={(e) => applyCab(e.target.value)}>{CABINET_TYPES.map((c) => <option key={c.name}>{c.name}</option>)}</select></Field>
        <Field label="Quantity"><input type="number" min="1" style={inp} value={qty} onChange={(e) => applyQty(e.target.value)} /></Field>
        <Field label="Wood type"><select style={inp} value={wood.name} onChange={(e) => setWood(WOOD_TYPES.find((w) => w.name === e.target.value))}>{WOOD_TYPES.map((w) => <option key={w.name}>{w.name}</option>)}</select></Field>
        <Field label={`Sheets (× ${money(wood.pricePerSheet)})`}><input type="number" style={inp} value={sheets} onChange={(e) => setSheets(e.target.value)} /></Field>
        <Field label="Machine charges (₵)"><input type="number" style={inp} value={machine} onChange={(e) => setMachine(e.target.value)} /></Field>
        <Field label="Fittings (₵)"><input type="number" style={inp} value={fittings} onChange={(e) => setFittings(e.target.value)} /></Field>
        <Field label="Marble & fabrication (₵)"><input type="number" style={inp} value={marble} onChange={(e) => setMarble(e.target.value)} /></Field>
        <Field label="T and T (₵)"><input type="number" style={inp} value={tt} onChange={(e) => setTt(e.target.value)} /></Field>
        <Field label="Labour (₵)"><input type="number" style={inp} value={labour} onChange={(e) => setLabour(e.target.value)} /></Field>
        <Field label="Advance paid (₵)"><input type="number" style={inp} value={advance} onChange={(e) => setAdvance(e.target.value)} /></Field>
      </div>

      <div style={{ background: "#faf6ec", border: `1px solid ${OAK}`, borderRadius: 10, padding: 14, marginTop: 14 }}>
        <div className="flex justify-between" style={{ fontSize: 14, color: INK }}><span>Wood material</span><span>{money(woodCost)}</span></div>
        <div className="flex justify-between" style={{ fontSize: 14, color: INK, marginTop: 4 }}><span>Other charges</span><span>{money(subtotal - woodCost)}</span></div>
        <div className="flex justify-between" style={{ borderTop: `1px solid ${OAK}`, marginTop: 8, paddingTop: 8, fontWeight: 800, color: INK, fontFamily: "Georgia, serif", fontSize: 18 }}><span>Grand total</span><span>{money(subtotal)}</span></div>
        {(+advance) > 0 && <div className="flex justify-between" style={{ fontSize: 14, marginTop: 4, color: balance < 0 ? "#c05c4d" : "#4f9d69" }}><span>Balance B/Forward</span><span>{money(balance)}</span></div>}
      </div>

      <div className="flex flex-wrap gap-2 no-print" style={{ marginTop: 12 }}>
        <button onClick={applyToJob} style={{ padding: "9px 16px", background: ESP, color: CREAM, borderRadius: 8, fontWeight: 600 }}>Apply price to job</button>
        <button onClick={saveEstimate} style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${OAK}`, color: OAK, borderRadius: 8, fontWeight: 600 }}>Save estimate</button>
        <button onClick={() => setInvoice((v) => !v)} style={{ padding: "9px 16px", background: OAK, color: ESP, borderRadius: 8, fontWeight: 700 }}>{invoice ? "Hide invoice" : "Generate invoice"}</button>
      </div>

      {invoice && (
        <div style={{ background: "#fff", borderRadius: 8, padding: "28px 24px", color: "#111", marginTop: 14, border: `1px solid ${LINE}` }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: 1, fontFamily: "Georgia, serif" }}>{settings.business.toUpperCase()}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>TEL: {settings.phone} &nbsp;|&nbsp; {settings.location}</div>
            <div style={{ fontSize: 13, fontWeight: "bold", marginTop: 6 }}>INVOICE</div>
          </div>
          <div style={{ fontSize: 12 }}><b>DATE:</b> {today}</div>
          <div style={{ fontSize: 12 }}><b>CLIENT:</b> {j.client || "—"}</div>
          <div style={{ fontSize: 12, marginBottom: 12 }}><b>PROJECT:</b> {qty > 1 ? qty + "× " : ""}{cab.name.replace("Custom (Manual Entry)", "Custom project")}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#d9d9d9" }}><th style={ith}>SN</th><th style={{ ...ith, textAlign: "left" }}>DESCRIPTION</th><th style={{ ...ith, textAlign: "right" }}>AMOUNT (₵)</th></tr></thead>
            <tbody>{rows.map(([d, a], i) => <tr key={i} style={{ borderBottom: "1px solid #ddd" }}><td style={itd}>{i + 1}</td><td style={{ ...itd, textAlign: "left" }}>{d}</td><td style={{ ...itd, textAlign: "right" }}>{Number(a).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</td></tr>)}
              <tr style={{ background: "#d9d9d9", fontWeight: "bold" }}><td style={itd}>7</td><td style={{ ...itd, textAlign: "left" }}>Grand total</td><td style={{ ...itd, textAlign: "right" }}>{subtotal.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</td></tr></tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 13 }}><div className="flex justify-between"><span>Advance/paid</span><span>₵{Number(advance).toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between" style={{ fontWeight: "bold", marginTop: 4 }}><span>Balance B/Forward</span><span>₵{balance.toLocaleString("en-GH", { minimumFractionDigits: 2 })}</span></div></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, fontSize: 12 }}>
            <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #111", width: 150, marginBottom: 4 }} />{j.client || "CLIENT"} (CUSTOMER)</div>
            <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #111", width: 150, marginBottom: 4 }} />WIAFE AKENTEN STEPHEN (CEO)</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }} className="no-print"><button onClick={() => window.print()} style={{ padding: "10px 24px", background: ESP, color: OAK, borderRadius: 6 }}>Print / Save as PDF</button></div>
        </div>
      )}
    </div>
  );
}
const ith = { padding: "8px 10px", textAlign: "center", border: "1px solid #bbb", fontSize: 12 };
const itd = { padding: "6px 10px", textAlign: "center", border: "1px solid #ddd", fontSize: 12 };

/* ---- PLAN (cut list + boards) ---- */
function PlanPanel({ j, patch }) {
  const [t, setT] = useState(j.plan ? j.plan.t : 18);
  const [shelves, setShelves] = useState(j.plan ? j.plan.shelves : 1);
  const [doors, setDoors] = useState(j.plan ? j.plan.doors : 2);
  const plan = j.plan;
  const generate = () => { const p = buildPlan(j, +t, +shelves, +doors); if (p) patch({ plan: p }); };

  return (
    <div>
      {(!j.W || !j.H) && <div style={{ background: "#fbecec", color: "#9c3b30", borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 12 }}>Set the job Width and Height (Details tab, or from a measurement) to generate a cut plan.</div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Board thickness (mm)"><input type="number" style={inp} value={t} onChange={(e) => setT(e.target.value)} /></Field>
        <Field label="Shelves"><input type="number" style={inp} value={shelves} onChange={(e) => setShelves(e.target.value)} /></Field>
        <Field label="Doors"><input type="number" style={inp} value={doors} onChange={(e) => setDoors(e.target.value)} /></Field>
      </div>
      <button onClick={generate} disabled={!j.W || !j.H} style={{ marginTop: 12, padding: "9px 16px", background: ESP, color: CREAM, borderRadius: 8, fontWeight: 600, opacity: (!j.W || !j.H) ? 0.5 : 1 }}>Generate cut plan</button>

      {plan && (
        <div style={{ marginTop: 14 }}>
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
            {plan.boards.map((b) => <div key={b.mat} style={{ background: "#faf6ec", border: `1px solid ${OAK}`, borderRadius: 10, padding: "10px 14px" }}><div style={{ fontSize: 20, fontWeight: 800, color: OAK, fontFamily: "Georgia, serif" }}>{b.count}</div><div style={{ fontSize: 12, color: INK2 }}>{b.mat} board{b.count !== 1 ? "s" : ""} (8×4)</div></div>)}
          </div>
          <table className="w-full" style={{ fontSize: 13, borderCollapse: "collapse" }}>
            <thead><tr style={{ background: ESP, color: CREAM }}><th style={{ ...ith, borderColor: "#4a3a26" }}>Part</th><th style={{ ...ith, borderColor: "#4a3a26" }}>Size (mm)</th><th style={{ ...ith, borderColor: "#4a3a26" }}>Qty</th><th style={{ ...ith, borderColor: "#4a3a26" }}>Material</th></tr></thead>
            <tbody style={{ fontFamily: "ui-monospace, monospace" }}>{plan.parts.map((p, i) => <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}><td style={{ ...itd, textAlign: "left" }}>{p.name}</td><td style={itd}>{p.L} × {p.Wd}</td><td style={itd}>{p.qty}</td><td style={itd}>{p.mat}</td></tr>)}</tbody>
          </table>
          <div className="no-print" style={{ marginTop: 10 }}><button onClick={() => window.print()} style={{ padding: "8px 16px", background: OAK, color: ESP, borderRadius: 8, fontWeight: 700 }}>Print cut plan</button></div>
        </div>
      )}
    </div>
  );
}

/* ---- PHOTOS ---- */
function PhotosPanel({ j, setJ, setLightbox }) {
  const [busy, setBusy] = useState(false); const fileRef = useRef();
  const add = async (files) => { setBusy(true); const arr = [...(j.photos || [])];
    for (const f of Array.from(files).slice(0, 8 - arr.length)) { try { arr.push(await fileToThumb(f, 1000, 0.72)); } catch (e) {} }
    setJ((x) => ({ ...x, photos: arr })); setBusy(false); };
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Photos ({(j.photos || []).length}/8)</span>
        <button onClick={() => fileRef.current && fileRef.current.click()} disabled={busy} style={{ fontSize: 13, color: OAK, fontWeight: 600 }}>{busy ? "Adding…" : "+ Add photos"}</button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && add(e.target.files)} />
      </div>
      <div className="flex flex-wrap gap-2">{(j.photos || []).map((p, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={p} onClick={() => setLightbox(p)} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `1px solid ${LINE}` }} />
          <button onClick={() => setJ((x) => ({ ...x, photos: x.photos.filter((_, k) => k !== i) }))} style={{ position: "absolute", top: -6, right: -6, background: "#c05c4d", color: "#fff", borderRadius: 999, width: 20, height: 20, fontSize: 12 }}>✕</button>
        </div>))}
      </div>
      <div style={{ fontSize: 12, color: INK2, marginTop: 8 }}>Tip: tick “Show in portfolio” on the Details tab to feature this build publicly.</div>
    </div>
  );
}

/* ---- portfolio + settings ---- */
function Portfolio({ jobs, settings, setLightbox, onGoWorkshop }) {
  return (
    <div>
      <div style={{ background: ESP, color: CREAM, borderRadius: 14, padding: "32px 24px", textAlign: "center", marginBottom: 22 }}>
        <div style={{ color: OAK, letterSpacing: "0.22em", fontSize: 12, fontWeight: 700 }}>HANDMADE FURNITURE</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 800, margin: "6px 0" }}>{settings.business}</h1>
        <p style={{ color: "#d8cbb8", maxWidth: 520, margin: "0 auto" }}>{settings.tagline}</p>
        <div style={{ fontSize: 13, marginTop: 8, color: "#a99a83" }}>{settings.location}{settings.phone ? " · " + settings.phone : ""}</div>
      </div>
      {jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", background: CARD, border: `1px dashed ${LINE}`, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, color: INK }}>Your portfolio is empty</div>
          <div style={{ fontSize: 13, color: INK2, marginTop: 4 }}>Open a job, add photos, and tick “Show in portfolio.”</div>
          <button onClick={onGoWorkshop} style={{ marginTop: 12, background: OAK, color: ESP, padding: "9px 16px", borderRadius: 8, fontWeight: 700 }}>Go to Workshop</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{jobs.map((j) => { const cover = j.photos && j.photos[0]; return (
          <div key={j.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden" }}>
            <div onClick={() => cover && setLightbox(cover)} style={{ height: 190, background: "#000", cursor: cover ? "pointer" : "default" }}>{cover ? <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", background: "#efe7d6" }} />}</div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: OAK, fontWeight: 700, letterSpacing: "0.08em" }}>{j.type.toUpperCase()}</div>
              <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 18, color: INK, marginTop: 2 }}>{j.title || "Custom piece"}</div>
              {j.blurb && <p style={{ fontSize: 13, color: INK2, marginTop: 6 }}>{j.blurb}</p>}
              {(j.W || j.H || j.D) && <div style={{ fontSize: 12, color: INK2, marginTop: 8, fontFamily: "ui-monospace, monospace" }}>{[j.W, j.D, j.H].filter(Boolean).join(" × ")} mm</div>}
            </div>
          </div>); })}
        </div>
      )}
    </div>
  );
}

function Settings({ settings, onSave, onClose, onClearAll }) {
  const [s, setS] = useState(settings); const up = (k, v) => setS((x) => ({ ...x, [k]: v }));
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: CARD, borderRadius: 12, padding: 20, width: "100%", maxWidth: 420 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 800, marginBottom: 14 }}>Business details</h2>
        <div className="grid gap-3">
          <Field label="Business name"><input style={inp} value={s.business} onChange={(e) => up("business", e.target.value)} /></Field>
          <Field label="Tagline"><input style={inp} value={s.tagline} onChange={(e) => up("tagline", e.target.value)} /></Field>
          <Field label="Location"><input style={inp} value={s.location} onChange={(e) => up("location", e.target.value)} /></Field>
          <Field label="Phone / contact"><input style={inp} value={s.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <button onClick={() => { if (confirm("Delete ALL jobs? This cannot be undone.")) onClearAll(); }} style={{ color: "#c05c4d", fontSize: 13 }}>Clear all data</button>
          <button onClick={() => { onSave(s); onClose(); }} style={{ padding: "9px 18px", borderRadius: 8, background: ESP, color: CREAM, fontWeight: 600 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
