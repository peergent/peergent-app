"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
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

const THEME_CHANGE_EVENT = "pg-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
  };
}

function getThemePreferenceSnapshot(): ThemePreference {
  if (typeof window === "undefined") return "light";
  return readStoredThemePreference();
}

function getServerThemePreferenceSnapshot(): ThemePreference {
  return "light";
}

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
  const preference = useSyncExternalStore(
    subscribeToTheme,
    getThemePreferenceSnapshot,
    getServerThemePreferenceSnapshot
  );
  const resolved = resolveTheme(preference);

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (preference !== "system") return;
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    withTransition(() => {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
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
