"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

/** v17 rail theme control — dark / light only (no workspace mode panel). */
export default function V17CompactThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const active = resolved === "dark" ? "dark" : "light";

  return (
    <div className="v17-theme-toggle" role="group" aria-label="Thema">
      <button
        type="button"
        className={`v17-theme-btn pg-focus-premium${active === "dark" ? " is-active" : ""}`}
        onClick={() => setPreference("dark")}
        aria-label="Donker thema"
        aria-pressed={active === "dark"}
        title="Donker"
      >
        <Moon size={13} strokeWidth={2} />
      </button>
      <button
        type="button"
        className={`v17-theme-btn pg-focus-premium${active === "light" ? " is-active" : ""}`}
        onClick={() => setPreference("light")}
        aria-label="Licht thema"
        aria-pressed={active === "light"}
        title="Licht"
      >
        <Sun size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
