import { cn } from "@/lib/ui/cn";

export type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  /** Aurora shimmer — use for premium loading rows. */
  shimmer?: boolean;
};

export default function Skeleton({
  className,
  variant = "rectangular",
  shimmer = false,
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        shimmer
          ? "relative overflow-hidden bg-white/[0.06] before:absolute before:inset-0 before:-translate-x-full before:animate-[pg-skeleton-shimmer_var(--pg-duration-sequence)_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent"
          : "animate-pulse bg-white/[0.06]",
        variant === "text" && "h-4 rounded-[var(--pg-radius-sm)]",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-[var(--pg-radius-md)]",
        className
      )}
    />
  );
}
