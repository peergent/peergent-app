import { cn } from "@/lib/ui/cn";

export type PresenceMode =
  | "ready"
  | "live"
  | "thinking"
  | "watching"
  | "waiting";

export type PresenceIndicatorProps = {
  mode: PresenceMode;
  size?: "sm" | "md";
  className?: string;
};

const sizeStyles = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
} as const;

const modeStyles: Record<PresenceMode, { dot: string; animation?: string }> = {
  ready: { dot: "bg-slate-500" },
  live: { dot: "bg-emerald-400", animation: "pg-pulse-live" },
  thinking: { dot: "bg-violet-400", animation: "pg-shimmer" },
  watching: { dot: "bg-violet-400/80", animation: "pg-breathe" },
  waiting: { dot: "bg-amber-400" },
};

export default function PresenceIndicator({
  mode,
  size = "md",
  className,
}: PresenceIndicatorProps) {
  const config = modeStyles[mode];
  const dimension = sizeStyles[size];

  return (
    <span
      className={cn("relative inline-flex shrink-0", dimension, className)}
      aria-hidden
    >
      {config.animation && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-40",
            config.dot,
            config.animation
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          dimension,
          config.dot
        )}
      />
    </span>
  );
}
