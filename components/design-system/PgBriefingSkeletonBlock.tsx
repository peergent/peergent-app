import { cn } from "@/lib/ui/cn";

export type PgBriefingSkeletonBlockProps = {
  className?: string;
};

/**
 * Briefing section skeleton block. Phase 1 scaffold — visual implementation in a later phase.
 */
export default function PgBriefingSkeletonBlock({ className }: PgBriefingSkeletonBlockProps) {
  return <div className={cn("hidden", className)} aria-hidden />;
}
