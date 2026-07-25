"use client";

import type { HandoffCompanyActivity } from "@/lib/home/handoff-types";
import { cn } from "@/lib/ui/cn";

type AmbientCompanyProps = {
  activity: HandoffCompanyActivity;
  className?: string;
};

const BOKEH = [
  { left: "12%", top: "18%", size: 6, delay: 0, layer: 1 },
  { left: "78%", top: "22%", size: 8, delay: 1.2, layer: 2 },
  { left: "88%", top: "58%", size: 5, delay: 2.4, layer: 1 },
  { left: "8%", top: "72%", size: 7, delay: 0.8, layer: 2 },
  { left: "62%", top: "82%", size: 4, delay: 3.1, layer: 3 },
  { left: "34%", top: "12%", size: 5, delay: 1.8, layer: 3 },
] as const;

export default function AmbientCompany({ activity, className }: AmbientCompanyProps) {
  const visibleCount =
    activity.intensity === "high" ? 6 : activity.intensity === "medium" ? 4 : 2;

  return (
    <div
      className={cn("handoff-ambient pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div className="handoff-ambient-glow absolute inset-0" />
      {BOKEH.slice(0, visibleCount).map((point, index) => (
        <span
          key={index}
          className={cn(
            "handoff-ambient-dot absolute rounded-full",
            `handoff-ambient-layer-${point.layer}`,
            index === 0 && "handoff-ambient-pulse"
          )}
          style={{
            left: point.left,
            top: point.top,
            width: point.size,
            height: point.size,
            animationDelay: `${point.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
