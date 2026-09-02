/* Per-browser persistence via localStorage. Jobs are one key each
   (`wjob_<id>`); settings are a single `wsettings` blob. */

const hasStore = typeof window !== "undefined" && !!window.localStorage;

export async function loadJobs() {
  if (!hasStore) return [];
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wjob_")) {
        try {
          out.push(JSON.parse(localStorage.getItem(key)));
        } catch {
          /* skip a corrupt entry */
        }
      }
    }
  } catch {
    return [];
  }
  return out;
}

export async function persistJob(job) {
  if (!hasStore) return;
  try {
    localStorage.setItem("wjob_" + job.id, JSON.stringify(job));
  } catch {
    /* quota — nothing we can do here */
  }
}

export async function removeJob(id) {
  if (!hasStore) return;
  try {
    localStorage.removeItem("wjob_" + id);
  } catch {
    /* ignore */
  }
}

export async function loadSettings() {
  if (!hasStore) return null;
  try {
    const raw = localStorage.getItem("wsettings");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function persistSettings(settings) {
  if (!hasStore) return;
  try {
    localStorage.setItem("wsettings", JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
