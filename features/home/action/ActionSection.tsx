"use client";

import { AgentActionFigma, agentSlidesFromPrimary } from "@/components/workforce/figma";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { cn } from "@/lib/ui/cn";
import { primaryActionForHome } from "./action-presenters";

type ActionSectionProps = {
  homeState: Pick<HandoffHomeState, "viewModel" | "handoff" | "copy">;
  visible?: boolean;
  className?: string;
  onPrimaryActivate?: () => void;
};

/** Agent Action — Figma presentation, primary work only. */
export default function ActionSection({
  homeState,
  visible = true,
  className,
  onPrimaryActivate,
}: ActionSectionProps) {
  const { viewModel, handoff, copy } = homeState;

  if (!handoff) return null;

  const primary = primaryActionForHome(handoff, viewModel);
  const slides = agentSlidesFromPrimary(primary, {
    waiting: copy.ui.primaryStatusWaitingReview,
    blocked: copy.ui.primaryStatusNeededToContinue,
    inProgress: copy.ui.primaryStatusInProgress,
    ready: copy.ui.primaryStatusReadyForReview,
  }, copy.ui.open, copy.ui.openWorkspace);

  if (slides.length === 0) return null;

  return (
    <div
      className={cn(
        "hf-enter hf-enter-delay-1 transition-opacity duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <AgentActionFigma
        slides={slides}
        sectionLabel={copy.ui.agentAction}
        onPrimaryActivate={onPrimaryActivate}
      />
    </div>
  );
}
