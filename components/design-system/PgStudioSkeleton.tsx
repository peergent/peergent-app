import { cn } from "@/lib/ui/cn";

export type PgStudioSkeletonProps = {
  className?: string;
};

/** Work-plane loading placeholder — shell chrome stays mounted separately. */
export default function PgStudioSkeleton({ className }: PgStudioSkeletonProps) {
  return (
    <div
      className={cn("flex min-h-[480px] flex-1 flex-col justify-center gap-4", className)}
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
      <div className="h-8 max-w-md animate-pulse rounded bg-white/[0.08]" />
      <div className="h-4 max-w-lg animate-pulse rounded bg-white/[0.05]" />
      <div className="mt-6 h-12 w-48 animate-pulse rounded-[var(--pg-radius-md)] bg-white/[0.06]" />
    </div>
  );
}
