"use client";

import { AttentionFigma, attentionRows } from "@/components/workforce/figma";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { cn } from "@/lib/ui/cn";
import { attentionItemsForHome, primaryActionForHome } from "./action-presenters";

type AttentionSectionProps = {
  homeState: Pick<HandoffHomeState, "viewModel" | "handoff" | "copy">;
  visible?: boolean;
  className?: string;
};

/** Needs your attention — Figma presentation, real AttentionQueue data. */
export default function AttentionSection({
  homeState,
  visible = true,
  className,
}: AttentionSectionProps) {
  const { viewModel, handoff, copy } = homeState;

  if (!handoff) return null;

  const primary = primaryActionForHome(handoff, viewModel);
  const items = attentionItemsForHome(viewModel, primary?.work.id);

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "hf-enter hf-enter-delay-2 transition-opacity duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <AttentionFigma
        title={copy.ui.needsYourAttention}
        items={attentionRows(items)}
        viewAllHref="/inbox"
        viewAllLabel={copy.needsYouViewAll}
      />
    </div>
  );
}
