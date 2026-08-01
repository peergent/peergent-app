"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme/constants";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.setAttribute("data-pg-theme", resolved);
  document.documentElement.setAttribute("data-pg-theme-preference", preference);
  return resolved;
}

function withTransition(run: () => void) {
  document.documentElement.setAttribute("data-pg-theme-transition", "true");
  run();
  window.setTimeout(() => {
    document.documentElement.removeAttribute("data-pg-theme-transition");
  }, 360);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = readStoredThemePreference();
    setPreferenceState(stored);
    setResolved(applyTheme(stored));
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (preference !== "system") return;
      setResolved(applyTheme("system"));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    withTransition(() => {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      setPreferenceState(next);
      setResolved(applyTheme(next));
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
