import { Monitor, Moon, Sun } from "lucide-react";

const OPTS = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "system", icon: Monitor, label: "System" },
];

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-md border border-line bg-surface p-0.5"
    >
      {OPTS.map(({ key, icon: Icon, label }) => {
        const on = theme === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={on}
            title={label}
            onClick={() => onChange(key)}
            className={`grid h-7 w-7 place-items-center rounded transition-transform active:scale-[0.9] ${
              on ? "bg-amber text-white" : "text-ink-3 hover:text-ink"
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
