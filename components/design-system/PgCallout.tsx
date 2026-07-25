import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type PgCalloutProps = {
  children: ReactNode;
  className?: string;
};

/** Subtle emphasis surface for a single decisive moment in the brief. */
export default function PgCallout({ children, className }: PgCalloutProps) {
  return (
    <div className={cn("briefing-callout max-w-xl", className)}>
      <div className="briefing-callout-inner">{children}</div>
    </div>
  );
}
