"use client";

import type {
  AvailabilityMode,
  AvailabilityOption,
} from "@/lib/peer-detail";
import { cn } from "@/lib/ui/cn";
import WorkspacePanel from "./WorkspacePanel";

type AvailabilityControlProps = {
  options: AvailabilityOption[];
  value: AvailabilityMode;
  evenings: boolean;
  weekends: boolean;
  onChange: (value: AvailabilityMode) => void;
  onEveningsChange: (enabled: boolean) => void;
  onWeekendsChange: (enabled: boolean) => void;
};

export default function AvailabilityControl({
  options,
  value,
  evenings,
  weekends,
  onChange,
  onEveningsChange,
  onWeekendsChange,
}: AvailabilityControlProps) {
  const showExtendedControls =
    value === "extended" || value === "24-7";

  return (
    <WorkspacePanel
      title="Availability"
      description="When this colleague is working for your business."
    >
      <fieldset>
        <legend className="sr-only">Availability schedule</legend>
        <div className="space-y-2">
          {options.map((option) => {
            const selected = value === option.id;

            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-[18px] border px-4 py-3.5 transition",
                  selected
                    ? "border-violet-500/30 bg-violet-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                )}
              >
                <input
                  type="radio"
                  name="peer-availability"
                  value={option.id}
                  checked={selected}
                  onChange={() => onChange(option.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {option.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {showExtendedControls && (
        <div className="mt-4 space-y-2 border-t border-white/[0.05] pt-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">
            Coverage
          </p>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-slate-300">Evenings</span>
            <input
              type="checkbox"
              checked={evenings || value === "24-7"}
              disabled={value === "24-7"}
              onChange={(event) => onEveningsChange(event.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-sm text-slate-300">Weekends</span>
            <input
              type="checkbox"
              checked={weekends || value === "24-7"}
              disabled={value === "24-7"}
              onChange={(event) => onWeekendsChange(event.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
          </label>
        </div>
      )}
    </WorkspacePanel>
  );
}
