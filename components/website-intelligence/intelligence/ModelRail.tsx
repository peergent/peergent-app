"use client";

import { cn } from "@/lib/ui/cn";
import type { ModelZoneId } from "@/lib/website-intelligence/assessment-presenter";

const zones: { id: ModelZoneId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "business-model", label: "Business Model" },
  { id: "growth", label: "Growth" },
  { id: "execution", label: "Execution" },
  { id: "workforce", label: "AI Workforce" },
];

type ModelRailProps = {
  activeZone: ModelZoneId;
  onSelect: (zone: ModelZoneId) => void;
};

export default function ModelRail({ activeZone, onSelect }: ModelRailProps) {
  return (
    <>
      <nav className="hidden shrink-0 flex-col gap-1 lg:flex lg:w-40">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelect(zone.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-left text-sm transition duration-200",
              activeZone === zone.id
                ? "bg-white/[0.06] font-medium text-white shadow-[inset_2px_0_0_0_rgba(139,92,246,0.8)]"
                : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
            )}
          >
            {zone.label}
          </button>
        ))}
      </nav>

      <nav className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelect(zone.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition duration-200",
              activeZone === zone.id
                ? "bg-violet-500/20 text-violet-300"
                : "bg-white/[0.04] text-slate-500"
            )}
          >
            {zone.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export { zones as modelZones };
