import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PgBriefingKickerProps = {
  children: ReactNode;
  className?: string;
};

/** Date / context line above the executive morning brief. */
export default function PgBriefingKicker({ children, className }: PgBriefingKickerProps) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--pg-color-text-tertiary)] opacity-70 mb-2.5",
        className
      )}
    >
      {children}
    </p>
  );
}
