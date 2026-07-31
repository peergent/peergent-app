import { cn } from "@/lib/ui/cn";

/**
 * §4 Loading — skeletons at final dimensions so the page never reflows.
 * Never a spinner. If loading exceeds ~2s the Peer speaks first; that is
 * handled by the presence line, not here.
 */

export type PgSkeletonProps = {
  /** Match the real content's height exactly — that is the whole point. */
  height?: number | string;
  width?: number | string;
  radius?: string;
  className?: string;
};

export default function PgSkeleton({
  height = 16,
  width = "100%",
  radius,
  className,
}: PgSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("pg-skeleton", className)}
      style={{
        height,
        width,
        ...(radius ? { borderRadius: radius } : null),
      }}
    />
  );
}

/** A row of skeleton lines that reserves the height of a real list item. */
export function PgSkeletonRows({
  rows = 3,
  rowHeight = 56,
  gap = 8,
  className,
}: {
  rows?: number;
  rowHeight?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ gap }}
      aria-hidden
      data-testid="pg-skeleton-rows"
    >
      {Array.from({ length: rows }, (_, i) => (
        <PgSkeleton key={i} height={rowHeight} radius="var(--pg-radius-md)" />
      ))}
    </div>
  );
}
