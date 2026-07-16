"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

export default function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tooltipId : undefined}>{children}</span>
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-[var(--pg-radius-md)] border border-white/10 bg-[#111827] px-2.5 py-1.5 text-xs text-slate-200 shadow-[var(--pg-shadow-sm)] animate-[pg-fade-in_var(--pg-duration-fast)_var(--pg-ease-standard)]",
            side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
            side === "bottom" && "top-full left-1/2 mt-2 -translate-x-1/2"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
