export const money = (n) =>
  "₵" +
  (Number(n) || 0).toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const rid = () => "j" + Math.random().toString(36).slice(2, 9);

export const emptyJob = () => ({
  id: rid(),
  title: "",
  client: "",
  type: "Cabinet",
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
  createdAt: Date.now(),
});
