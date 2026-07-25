import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { TEAM_PEERS_VIEW_ALL_HREF } from "@/lib/team";
import type { WorkforceSummary } from "@/lib/team/types";
import { cn } from "@/lib/ui/cn";

type WorkforceSummaryProps = {
  summary: WorkforceSummary;
  reducedMotion?: boolean;
};

export default function WorkforceSummaryCard({
  summary,
  reducedMotion,
}: WorkforceSummaryProps) {
  const colleagueLabel = summary.totalCount === 1 ? "colleague" : "colleagues";

  return (
    <section
      aria-labelledby="workforce-summary-heading"
      className={cn(
        "pg-card-elevated relative overflow-hidden p-6 md:p-7",
        "bg-gradient-to-br from-[color-mix(in_srgb,var(--pg-accent)_6%,transparent)] via-[var(--pg-card-bg)] to-transparent",
        !reducedMotion && "pg-section-enter [animation-delay:200ms]"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--pg-accent)_8%,transparent)] blur-3xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[var(--pg-card-border)] bg-[var(--pg-surface-secondary)]">
          <Users size={20} className="text-[var(--pg-accent)]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id="workforce-summary-heading"
            className="text-lg font-medium tracking-tight text-[var(--pg-text)]"
          >
            Your AI Workforce
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--pg-text-muted)]">
            You now have {summary.totalCount} AI {colleagueLabel} working for your
            business.
          </p>
        </div>
      </div>

      {summary.roles.length > 0 && (
        <ul className="relative mt-5 flex flex-wrap gap-2">
          {summary.roles.map((role) => (
            <li
              key={role}
              className="rounded-full border border-[var(--pg-border-soft)] bg-[var(--pg-pill-bg)] px-3 py-1 text-xs text-[var(--pg-text-muted)]"
            >
              {role}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={summary.workforceHref || TEAM_PEERS_VIEW_ALL_HREF}
        className="pg-btn-contrast pg-hover-lift pg-focus-premium relative mt-6"
      >
        View all AI Peers
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </section>
  );
}
