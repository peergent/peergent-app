"use client";

import { CurrentlyWorkingFigma, teamPulseToPeerCards } from "@/components/workforce/figma";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { cn } from "@/lib/ui/cn";

type CurrentlyWorkingSectionProps = {
  homeState: Pick<HandoffHomeState, "viewModel" | "handoff" | "copy">;
  visible?: boolean;
  className?: string;
};

/** Currently working — Figma presentation. */
export default function CurrentlyWorkingSection({
  homeState,
  visible = true,
  className,
}: CurrentlyWorkingSectionProps) {
  const { viewModel, handoff, copy } = homeState;

  if (!handoff) return null;

  const teamPulse = viewModel?.teamPulse ?? [];
  if (teamPulse.length === 0) return null;

  const activeCount = handoff.companyActivity.activeCount;

  return (
    <div
      className={cn(
        "hf-enter hf-enter-delay-4 transition-opacity duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <CurrentlyWorkingFigma
        items={teamPulseToPeerCards(teamPulse)}
        activeCount={activeCount}
        title={copy.ui.currentlyWorking}
        activeBadgeLabel={
          activeCount === 1 ? copy.ui.activeBadgeSingle : copy.ui.activeBadgeMultiple(activeCount)
        }
        footerHref="/team"
        footerLabel={copy.ui.seeAllPeers}
        openWorkspaceLabel={copy.ui.openWorkspace}
      />
    </div>
  );
}
