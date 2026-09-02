/* Per-browser persistence via localStorage. Jobs are one key each
   (`wjob_<id>`); other collections use the generic helpers below. */

const has = typeof window !== "undefined" && !!window.localStorage;

function readPrefix(prefix) {
  if (!has) return [];
  const out = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      try {
        out.push(JSON.parse(localStorage.getItem(key)));
      } catch {
        /* skip a corrupt entry */
      }
    }
  }
  return out;
}

const safeSet = (key, value) => {
  if (!has) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — nothing we can do here */
  }
};
const safeDel = (key) => {
  if (!has) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

/* ── jobs ── */
export const loadJobs = async () => readPrefix("wjob_");
export const persistJob = async (job) => safeSet("wjob_" + job.id, job);
export const removeJob = async (id) => safeDel("wjob_" + id);

/* ── generic collections: lumber, consumables, timecards, reservations ── */
export const loadCollection = async (prefix) => readPrefix(prefix);
export const persistItem = async (prefix, item) => safeSet(prefix + item.id, item);
export const removeItem = async (prefix, id) => safeDel(prefix + id);
export const persistMany = async (prefix, items) => items.forEach((it) => safeSet(prefix + it.id, it));

/* ── settings ── */
export async function loadSettings() {
  if (!has) return null;
  try {
    const raw = localStorage.getItem("wsettings");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export const persistSettings = async (s) => safeSet("wsettings", s);

export const flag = {
  get: (name) => (has ? localStorage.getItem("wflag_" + name) : null),
  set: (name, v) => {
    if (has) {
      try {
        localStorage.setItem("wflag_" + name, String(v));
      } catch {
        /* ignore */
      }
    }
  },
};
