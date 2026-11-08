/* Whole-database backup. Everything the app owns lives in localStorage under
   a handful of prefixes, so one JSON file can carry the entire workshop:
   jobs, lumber, consumables, timecards, settings and flags. */

const PREFIXES = ["wjob_", "wlumber_", "wcons_", "wtc_", "wsettings", "wflag_"];
const FILE_TAG = "altops-workshop";
const VERSION = 1;

const owns = (key) => PREFIXES.some((p) => key.startsWith(p));

const ownedKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && owns(key)) keys.push(key);
  }
  return keys;
};

/** Snapshot every owned key as raw strings, so restore is byte-for-byte. */
export function collectBackup() {
  const data = {};
  ownedKeys().forEach((key) => { data[key] = localStorage.getItem(key); });
  return { app: FILE_TAG, version: VERSION, exportedAt: new Date().toISOString(), data };
}

/** Build the file and hand it to the browser. Returns the record count. */
export function downloadBackup() {
  const payload = collectBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `altops-backup-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return Object.keys(payload.data).length;
}

/** Replace the current database with a backup file. Returns the record count. */
export async function restoreBackup(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!payload || payload.app !== FILE_TAG || !payload.data || typeof payload.data !== "object") {
    throw new Error("That is not an Altops backup file.");
  }

  const incoming = Object.keys(payload.data).filter(owns);
  ownedKeys().forEach((key) => localStorage.removeItem(key));
  incoming.forEach((key) => localStorage.setItem(key, payload.data[key]));
  return incoming.length;
}
