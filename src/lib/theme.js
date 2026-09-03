import { useCallback, useEffect, useState } from "react";

const KEY = "altops-theme";
export const THEME_MODES = ["light", "dark", "system"];

export const readTheme = () => {
  try {
    const v = localStorage.getItem(KEY);
    return THEME_MODES.includes(v) ? v : "system";
  } catch {
    return "system";
  }
};

const prefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (mode) => {
  const root = document.documentElement;
  if (mode === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", mode);

  const dark = mode === "dark" || (mode === "system" && prefersDark());
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#121110" : "#222222");
};

export function useTheme() {
  const [theme, set] = useState(readTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (readTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback(
    (m) => set(THEME_MODES.includes(m) ? m : "system"),
    [],
  );

  return { theme, setTheme };
}
