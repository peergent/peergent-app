import type { ActivityPeerTone, TeamActivityEvent } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type TeamActivityFeedProps = {
  events: TeamActivityEvent[];
  reducedMotion?: boolean;
  className?: string;
};

const toneDot: Record<ActivityPeerTone, string> = {
  sales: "bg-emerald-400/85 shadow-[0_0_8px_rgba(52,211,153,0.35)]",
  marketing: "bg-violet-400/80 shadow-[0_0_8px_rgba(167,139,250,0.3)]",
  neutral: "bg-slate-500",
};

export default function TeamActivityFeed({
  events,
  reducedMotion,
  className,
}: TeamActivityFeedProps) {
  return (
    <section
      aria-labelledby="team-activity-heading"
      className={cn(
        "rounded-[22px] border border-white/[0.06] bg-white/[0.015] p-5",
        className
      )}
    >
      <h2
        id="team-activity-heading"
        className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600"
      >
        Updates
      </h2>

      <ol className="mt-4 space-y-0" aria-live="polite">
        {events.map((event, index) => (
          <li
            key={event.id}
            className={cn(
              "border-t border-white/[0.04] py-4 first:border-t-0 first:pt-0",
              !reducedMotion && "pg-section-enter"
            )}
            style={
              reducedMotion ? undefined : { animationDelay: `${80 + index * 60}ms` }
            }
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  toneDot[event.tone],
                  event.tone !== "neutral" && !reducedMotion && "pg-pulse-live"
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium tracking-tight text-white/90">
                  {event.peerName}
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-slate-400">
                  {event.message}
                </p>
                <p className="mt-1.5 text-xs text-slate-600">{event.relativeTime}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
