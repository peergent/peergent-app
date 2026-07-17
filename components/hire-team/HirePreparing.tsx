"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { hireBtnFull, hireWhisper } from "@/lib/hire-team/hire-ui";
import type { HireLiveStatus } from "@/lib/hire-team/types";
import type { HireIntegration, HireTeamViewModel } from "@/lib/hire-team/hire-team-presenter";
import { cn } from "@/lib/ui/cn";

type HirePreparingProps = {
  model: HireTeamViewModel;
  onContinue: () => void;
  reducedMotion: boolean;
};

const peerMessageClass = {
  sales: "text-emerald-400/75",
  marketing: "text-violet-400/70",
  shared: "text-slate-400",
  team: "text-slate-400",
} as const;

function IntegrationChip({ item }: { item: HireIntegration }) {
  const stateStyles = {
    connected: "border-emerald-500/15 text-slate-500",
    recommended: "border-violet-500/20 bg-violet-500/[0.04] text-slate-400",
    optional: "border-dashed border-white/[0.08] text-slate-600",
  } as const;

  const stateLabel = {
    connected: "text-emerald-400/70",
    recommended: "text-violet-400/65",
    optional: "text-slate-600",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
        stateStyles[item.state]
      )}
    >
      {item.label}
      <span className={stateLabel[item.state]}>
        {item.state === "connected"
          ? "Connected"
          : item.state === "recommended"
            ? "Recommended"
            : "Optional"}
      </span>
    </span>
  );
}

function StatusRow({
  status,
  state,
  reducedMotion,
}: {
  status: HireLiveStatus;
  state: "upcoming" | "active" | "done";
  reducedMotion: boolean;
}) {
  const peerKey = status.peer ?? "shared";

  return (
    <li
      className={cn(
        "flex items-start justify-between gap-4 py-3 transition-all duration-500 ease-out",
        state === "upcoming" && "opacity-35",
        state === "active" && "opacity-100",
        state === "done" && "opacity-80"
      )}
    >
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[13px] font-medium tracking-tight transition-colors duration-300",
            state === "active" ? "text-white/90" : "text-white/70"
          )}
        >
          {status.label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm transition-all duration-300",
            state === "active" && !reducedMotion && "pg-pulse-live",
            peerMessageClass[peerKey]
          )}
        >
          {status.message}
        </p>
      </div>
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
          state === "done"
            ? "bg-emerald-500/15 text-emerald-400/90"
            : state === "active"
              ? "border border-violet-500/25 bg-violet-500/[0.06]"
              : "border border-white/[0.06]"
        )}
        aria-hidden
      >
        {state === "done" && <Check size={11} strokeWidth={2.5} />}
      </span>
    </li>
  );
}

export default function HirePreparing({
  model,
  onContinue,
  reducedMotion,
}: HirePreparingProps) {
  const [resolvedCount, setResolvedCount] = useState(0);
  const [complete, setComplete] = useState(false);

  const statusDelay = reducedMotion ? 180 : 820;
  const statuses = model.liveStatuses;

  useEffect(() => {
    setResolvedCount(0);
    setComplete(false);

    const timers: number[] = [];

    for (let i = 1; i <= statuses.length; i += 1) {
      timers.push(window.setTimeout(() => setResolvedCount(i), statusDelay * i));
    }

    timers.push(
      window.setTimeout(
        () => setComplete(true),
        statusDelay * statuses.length + (reducedMotion ? 80 : 320)
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion, statusDelay, statuses.length]);

  const activeStatus = statuses[Math.min(resolvedCount, statuses.length - 1)];

  return (
    <div className="w-full max-w-xl">
      <p className={cn("text-center", hireWhisper)}>Preparing the team</p>

      <ul
        className="mt-8 divide-y divide-white/[0.04]"
        aria-label="Team preparation progress"
      >
        {statuses.map((status, index) => {
          let state: "upcoming" | "active" | "done";
          if (index < resolvedCount) state = "done";
          else if (index === resolvedCount && resolvedCount < statuses.length) state = "active";
          else state = "upcoming";

          return (
            <StatusRow
              key={status.label}
              status={status}
              state={state}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </ul>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeStatus && resolvedCount < statuses.length
          ? `${activeStatus.label}: ${activeStatus.message}`
          : complete
            ? "Team preparation complete"
            : ""}
      </div>

      {complete && model.integrations.length > 0 && (
        <div
          className={cn(
            "mt-6 transition-opacity duration-500",
            complete ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex flex-wrap justify-center gap-2">
            {model.integrations.map((item) => (
              <IntegrationChip key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {complete && (
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            "mt-8",
            hireBtnFull,
            !reducedMotion && "pg-section-enter [animation-delay:80ms]"
          )}
        >
          Continue
          <ArrowRight size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
