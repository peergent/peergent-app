"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemePreference } from "@/lib/theme/constants";

const OPTIONS: { id: ThemePreference; label: string; subtitle: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Executive Workspace", subtitle: "Bright", Icon: Sun },
  { id: "dark", label: "Mission Control", subtitle: "Dark", Icon: Moon },
  { id: "system", label: "System", subtitle: "Auto", Icon: Monitor },
];

type PgThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export default function PgThemeToggle({ compact = false }: PgThemeToggleProps) {
  const { preference, setPreference } = useTheme();

  if (compact) {
    const cycle: ThemePreference[] = ["light", "dark", "system"];
    const next = cycle[(cycle.indexOf(preference) + 1) % cycle.length]!;
    const current = OPTIONS.find((o) => o.id === preference)!;
    const Current = current.Icon;

    return (
      <button
        type="button"
        className="pg-theme-toggle-compact"
        onClick={() => setPreference(next)}
        aria-label={`Theme: ${current.label}. Click to change.`}
        title={current.label}
      >
        <Current size={13} strokeWidth={1.75} />
      </button>
    );
  }

  return (
    <div className="pg-theme-toggle" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map(({ id, label, subtitle, Icon }) => {
        const active = preference === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`pg-theme-toggle-option${active ? " is-active" : ""}`}
            onClick={() => setPreference(id)}
          >
            <Icon size={14} strokeWidth={1.75} />
            <span className="pg-theme-toggle-copy">
              <span className="pg-theme-toggle-label">{label}</span>
              <span className="pg-theme-toggle-sub">{subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
