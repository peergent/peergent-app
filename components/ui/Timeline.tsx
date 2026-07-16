import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

export type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  icon?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
};

export type TimelineProps = {
  items: TimelineItem[];
  timestampPosition?: "inline" | "left";
  variant?: "default" | "quiet";
  className?: string;
};

const toneStyles = {
  default: "border-white/10 bg-white/5 text-slate-400",
  accent: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
};

export default function Timeline({
  items,
  timestampPosition = "inline",
  variant = "default",
  className,
}: TimelineProps) {
  const quiet = variant === "quiet";

  if (timestampPosition === "left") {
    return (
      <ol className={cn(quiet ? "space-y-5" : "space-y-6", className)}>
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            {item.timestamp && (
              <time
                className={cn(
                  "w-full shrink-0 sm:w-28",
                  quiet ? "text-[11px] text-slate-600" : "text-xs text-slate-500"
                )}
              >
                {item.timestamp}
              </time>
            )}
            <div
              className={cn(
                "relative min-w-0 flex-1 border-l pl-4",
                quiet ? "border-white/[0.05]" : "border-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute -left-1 top-1.5 h-2 w-2 rounded-full",
                  quiet ? "bg-slate-600" : "bg-violet-500/80"
                )}
                aria-hidden
              />
              <p
                className={cn(
                  "text-sm font-medium",
                  quiet ? "text-slate-400" : "text-white"
                )}
              >
                {item.title}
              </p>
              {item.description && (
                <p
                  className={cn(
                    "mt-1 text-sm leading-6",
                    quiet ? "text-slate-600" : "text-slate-400"
                  )}
                >
                  {item.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < items.length - 1 && (
            <span
              className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-white/10"
              aria-hidden
            />
          )}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs",
              toneStyles[item.tone ?? "default"]
            )}
          >
            {item.icon ?? index + 1}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-white">{item.title}</p>
              {item.timestamp && (
                <time className="text-xs text-slate-500">{item.timestamp}</time>
              )}
            </div>
            {item.description && (
              <p className="mt-1 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
