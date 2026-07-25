import type { ActivityPeerTone, TeamActivityEvent } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type TeamActivityFeedProps = {
  events: TeamActivityEvent[];
  reducedMotion?: boolean;
  className?: string;
};

const toneDot: Record<ActivityPeerTone, string> = {
  sales: "bg-[var(--pg-success)] shadow-[0_0_8px_color-mix(in_srgb,var(--pg-success)_35%,transparent)]",
  marketing:
    "bg-[var(--pg-accent)] shadow-[0_0_8px_color-mix(in_srgb,var(--pg-accent)_30%,transparent)]",
  neutral: "bg-[var(--pg-status-idle-fg)]",
};

export default function TeamActivityFeed({
  events,
  reducedMotion,
  className,
}: TeamActivityFeedProps) {
  return (
    <section
      aria-labelledby="team-activity-heading"
      className={cn("pg-panel-compact", className)}
    >
      <h2 id="team-activity-heading" className="pg-field-label normal-case tracking-[0.18em]">
        Updates
      </h2>

      <ol className="mt-4 space-y-0" aria-live="polite">
        {events.map((event, index) => (
          <li
            key={event.id}
            className={cn(
              "border-t border-[var(--pg-divider-line)] py-4 first:border-t-0 first:pt-0",
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
                <p className="text-sm font-medium tracking-tight text-[var(--pg-text)]">
                  {event.peerName}
                </p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-[var(--pg-text-muted)]">
                  {event.message}
                </p>
                <p className="mt-1.5 text-xs text-[var(--pg-label-text)]">{event.relativeTime}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
