"use client";

import type { AutonomyLevel, AutonomyOption } from "@/lib/peer-detail";
import { cn } from "@/lib/ui/cn";
import WorkspacePanel from "./WorkspacePanel";

type AutonomyControlProps = {
  options: AutonomyOption[];
  value: AutonomyLevel;
  onChange: (value: AutonomyLevel) => void;
};

function DetailList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "default" | "muted" | "warn";
}) {
  const titleClass =
    tone === "warn"
      ? "text-slate-600"
      : tone === "muted"
        ? "text-slate-600"
        : "text-slate-500";

  return (
    <div>
      <p className={cn("text-[10px] font-medium uppercase tracking-[0.12em]", titleClass)}>
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-xs leading-relaxed text-slate-500">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AutonomyControl({
  options,
  value,
  onChange,
}: AutonomyControlProps) {
  const selected = options.find((option) => option.id === value);

  return (
    <WorkspacePanel
      title="Autonomy"
      description="How independently this colleague may work."
    >
      <fieldset>
        <legend className="sr-only">Autonomy level</legend>
        <div className="space-y-2" role="radiogroup" aria-label="Autonomy level">
          {options.map((option) => {
            const isSelected = value === option.id;

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange(option.id)}
                className={cn(
                  "pg-focus-premium w-full rounded-[16px] border px-4 py-3 text-left transition",
                  isSelected
                    ? "border-violet-500/25 bg-violet-500/[0.08]"
                    : "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.1]"
                )}
              >
                <span className="block text-sm font-medium text-white/95">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  {option.summary}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selected && (
        <div className="mt-5 space-y-4 border-t border-white/[0.04] pt-5">
          <DetailList title="Can do" items={selected.canDo} tone="default" />
          <DetailList
            title="Always needs approval"
            items={selected.needsApproval}
            tone="muted"
          />
          <DetailList
            title="Will never do automatically"
            items={selected.neverAutomatic}
            tone="warn"
          />
        </div>
      )}
    </WorkspacePanel>
  );
}
