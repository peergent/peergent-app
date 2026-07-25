"use client";

import {
  MorningBriefFigma,
} from "@/components/workforce/figma";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { cn } from "@/lib/ui/cn";
import { decisionForBriefing, narrativeForBriefing } from "./briefing-presenters";

type MorningBriefSectionProps = {
  homeState: Pick<HandoffHomeState, "viewModel" | "handoff" | "copy">;
  visible?: boolean;
  className?: string;
};

function formatKicker(morningBriefingLabel: string): string {
  try {
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    return `${date} · ${morningBriefingLabel}`;
  } catch {
    return morningBriefingLabel;
  }
}

/** Executive morning brief — Figma presentation. */
export default function MorningBriefSection({
  homeState,
  visible = true,
  className,
}: MorningBriefSectionProps) {
  const { viewModel, handoff, copy } = homeState;

  if (!handoff) return null;

  const narrative = narrativeForBriefing(viewModel, handoff);
  const decision = decisionForBriefing(viewModel, handoff, copy);

  const workforceLine =
    handoff.teamWorkingVisible && handoff.companyActivity.activeCount > 0
      ? `${copy.ui.workforceWorking} ${handoff.companyActivity.activeCount === 1 ? copy.ui.colleaguesActiveSingle : copy.ui.colleaguesActiveMultiple(handoff.companyActivity.activeCount)}`
      : null;

  return (
    <div
      className={cn(
        "hf-enter transition-opacity duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <MorningBriefFigma
        kicker={formatKicker(copy.ui.morningBriefing)}
        narrative={narrative}
        decision={decision}
        workforceLine={workforceLine}
      />
    </div>
  );
}
