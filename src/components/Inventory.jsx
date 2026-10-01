import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Pill } from "./ui/widgets";
import { loadCollection, persistItem, removeItem } from "../lib/storage";

const stockTone = (qty, reorder) =>
  qty <= reorder ? "alert" : qty <= reorder * 1.35 ? "warn" : "ok";
const stockText = (qty, reorder) =>
  qty <= reorder ? "Low stock" : qty <= reorder * 1.35 ? "Order soon" : "In stock";

function SortHead({ col, label, sort, setSort, className = "" }) {
  const on = sort.col === col;
  return (
    <th
      onClick={() => setSort({ col, dir: on && sort.dir === "asc" ? "desc" : "asc" })}
      className={`cursor-pointer select-none px-3 py-2 text-left label hover:text-ink ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {on && (sort.dir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </span>
    </th>
  );
}

export default function Inventory({ pushToast }) {
  const [lumber, setLumber] = useState([]);
  const [cons, setCons] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ col: "species", dir: "asc" });

  useEffect(() => {
    loadCollection("wlumber_").then(setLumber);
    loadCollection("wcons_").then(setCons);
  }, []);

  const setBf = (row, bf) => {
    const next = { ...row, bf: Math.max(0, bf) };
    setLumber((l) => l.map((x) => (x.id === row.id ? next : x)));
    persistItem("wlumber_", next);
  };
  const setQty = (row, qty) => {
    const next = { ...row, qty: Math.max(0, qty) };
    setCons((c) => c.map((x) => (x.id === row.id ? next : x)));
    persistItem("wcons_", next);
  };
  const removeLumber = (row) => {
    setLumber((l) => l.filter((x) => x.id !== row.id));
    removeItem("wlumber_", row.id);
    pushToast?.(`${row.species} ${row.thickness} removed`, {
      label: "Undo",
      onClick: () => {
        persistItem("wlumber_", row);
        setLumber((l) => [row, ...l]);
      },
    });
  };
  const removeCons = (row) => {
    setCons((c) => c.filter((x) => x.id !== row.id));
    removeItem("wcons_", row.id);
    pushToast?.(`${row.name} removed`, {
      label: "Undo",
      onClick: () => {
        persistItem("wcons_", row);
        setCons((c) => [row, ...c]);
      },
    });
  };

  const rows = useMemo(() => {
    const f = lumber.filter((r) =>
      (r.species + r.thickness + r.drying).toLowerCase().includes(q.trim().toLowerCase()),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...f].sort((a, b) => {
      const va = a[sort.col];
      const vb = b[sort.col];
      return (typeof va === "number" ? va - vb : String(va).localeCompare(String(vb))) * dir;
    });
  }, [lumber, q, sort]);

  return (
    <div className="flex flex-col gap-4 p-4 lg:px-6">
      <div className="card">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <Search size={14} className="text-ink-3" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-3"
            placeholder="Filter species, thickness, drying…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sunk/50">
              <tr>
                <SortHead col="species" label="Species" sort={sort} setSort={setSort} />
                <SortHead col="thickness" label="Thick." sort={sort} setSort={setSort} />
                <SortHead col="drying" label="Drying" sort={sort} setSort={setSort} />
                <SortHead col="bf" label="Board feet" sort={sort} setSort={setSort} />
                <th className="px-3 py-2 text-left label">Status</th>
                <th className="px-3 py-2 text-left label"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-sunk/40">
                  <td className="px-3 py-2 font-medium text-ink">{r.species}</td>
                  <td className="px-3 py-2 font-mono text-ink-2">{r.thickness}</td>
                  <td className="px-3 py-2 text-ink-2">{r.drying}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={r.bf}
                      onChange={(e) => setBf(r, +e.target.value)}
                      className="w-20 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-sm focus:border-amber focus:outline-none"
                    />
                    <span className="ml-1 text-xs text-ink-3">/ {r.reorder}</span>
                  </td>
                  <td className="px-3 py-2">
                    <Pill tone={stockTone(r.bf, r.reorder)}>{stockText(r.bf, r.reorder)}</Pill>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeLumber(r)}
                      aria-label="Remove"
                      className="rounded px-1.5 py-0.5 text-xs text-ink-3 transition-colors hover:bg-alert/10 hover:text-alert"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-ink-2">Nothing matches “{q}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <span className="label">Consumables & hardware</span>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cons.map((c) => (
            <div key={c.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium text-ink">{c.name}</div>
                <button
                  onClick={() => removeCons(c)}
                  aria-label="Remove"
                  className="shrink-0 rounded px-1 text-xs text-ink-3 transition-colors hover:bg-alert/10 hover:text-alert"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex items-end gap-1">
                <input
                  type="number"
                  value={c.qty}
                  onChange={(e) => setQty(c, +e.target.value)}
                  className="w-16 rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-lg font-bold focus:border-amber focus:outline-none"
                />
                <span className="mb-0.5 text-xs text-ink-3">{c.unit}</span>
              </div>
              <div className="mt-2"><Pill tone={stockTone(c.qty, c.reorder)}>{stockText(c.qty, c.reorder)}</Pill></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
