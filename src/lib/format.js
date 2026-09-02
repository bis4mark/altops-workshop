export const money = (n) =>
  "₵" +
  (Number(n) || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const rid = (p = "j") => p + Math.random().toString(36).slice(2, 9);

/** Board feet from mm dimensions × qty. length×width in mm, thickness in inches. */
export const boardFeet = (lenMm, widthMm, thicknessIn, qty = 1) => {
  const bf = ((lenMm / 25.4) * (widthMm / 25.4) * thicknessIn) / 144;
  return Math.round(bf * qty * 10) / 10;
};

/** Whole days from now until an ISO date. Negative = overdue. null = no date. */
export const daysUntil = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso + "T00:00:00").getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
};

export const jobCode = (job) => "#" + String(job.id || "").replace(/^j/, "").slice(0, 4).toUpperCase();

/** Push a generated file to the browser's downloads. */
export const download = (name, text, mime = "text/plain") => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Total settled on a job: deposit field + every recorded payment. */
export const amountPaid = (job) =>
  (+job.deposit || 0) + (job.payments || []).reduce((s, p) => s + (+p.amount || 0), 0);

export const emptyJob = () => ({
  id: rid(),
  title: "",
  client: "",
  type: "Cabinet",
  species: "Mahogany",
  stage: "deposit",
  status: "quote",
  W: "",
  H: "",
  D: "",
  material: "",
  price: "",
  deposit: "",
  due: "",
  notes: "",
  photos: [],
  measurements: [],
  estimate: null,
  plan: null,
  portfolio: false,
  blurb: "",
  payments: [],
  createdAt: Date.now(),
});
