"use client";

import { RecentActivityFigma, movementToActivityRows } from "@/components/workforce/figma";
import type { HandoffHomeState } from "@/hooks/useHandoffHome";
import { formatHomeRelativeTime } from "@/lib/i18n";
import { cn } from "@/lib/ui/cn";

type RecentActivitySectionProps = {
  homeState: Pick<HandoffHomeState, "viewModel" | "copy">;
  visible?: boolean;
  className?: string;
};

/** Recent activity — Figma presentation. */
export default function RecentActivitySection({
  homeState,
  visible = true,
  className,
}: RecentActivitySectionProps) {
  const { viewModel, copy } = homeState;
  const movement = viewModel?.recentMovement ?? [];

  const items = movementToActivityRows(movement).map((row) => ({
    ...row,
    timeLabel: formatHomeRelativeTime(row.time, copy),
  }));

  return (
    <div
      className={cn(
        "hf-enter hf-enter-delay-3 transition-opacity duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      <RecentActivityFigma
        title={copy.recentMovement}
        items={items}
        emptyMessage={copy.recentMovementEmpty}
      />
    </div>
  );
}
