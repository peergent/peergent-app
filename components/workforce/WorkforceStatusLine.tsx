"use client";

import { cn } from "@/lib/ui/cn";
import type { WorkforceStatusLineProps } from "./types";

/**
 * Workforce activity status below the morning brief.
 */
export default function WorkforceStatusLine({
  activeCount,
  visible = true,
  prefixLabel = "Your workforce is working —",
  activeLabel,
  className,
}: WorkforceStatusLineProps) {
  if (!visible || activeCount <= 0) return null;

  const label =
    activeLabel ??
    (activeCount === 1
      ? "1 colleague is active right now."
      : `${activeCount} colleagues are active right now.`);

  return (
    <p className={cn("briefing-status-line", className)}>
      <span className="briefing-status-dot" aria-hidden />
      <span>
        {prefixLabel}{" "}
        <span className="font-medium text-[var(--pg-color-text-primary)]">{label}</span>
      </span>
    </p>
  );
}
