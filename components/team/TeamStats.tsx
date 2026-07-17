import type { TeamImpactStat } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";
import { Fragment } from "react";

type TeamStatsProps = {
  stats: TeamImpactStat[];
  className?: string;
  reducedMotion?: boolean;
};

export default function TeamStats({ stats, className, reducedMotion }: TeamStatsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/[0.05] py-3",
        !reducedMotion && "pg-section-enter [animation-delay:50ms]",
        className
      )}
      aria-label="Today's impact"
    >
      {stats.map((stat, index) => (
        <Fragment key={stat.id}>
          {index > 0 && (
            <span className="hidden h-3 w-px shrink-0 bg-white/[0.08] sm:block" aria-hidden />
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tabular-nums text-white/85">
              {stat.value}
            </span>
            <span className="text-xs text-slate-600">{stat.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
