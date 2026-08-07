import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type PgOpportunityCardProps = {
  label?: string;
  statement: string;
  exploreLabel?: string;
  href?: string;
  onExplore?: () => void;
  className?: string;
  testId?: string;
};

/** P2 — proactive business opportunity. */
export default function PgOpportunityCard({
  label = "Kans",
  statement,
  exploreLabel = "Bekijk →",
  href,
  onExplore,
  className,
  testId = "pg-opportunity-card",
}: PgOpportunityCardProps) {
  return (
    <article
      className={cn(
        "pg-ds-card pg-ds-card--insight pg-ds-card--interactive p-[var(--pg-card-padding-lg)]",
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-start gap-2">
        <span
          className="pg-ds-activity-dot mt-1.5"
          style={{ ["--pg-card-accent" as string]: "var(--pg-action-primary)" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="pg-ds-label">{label}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--pg-text-soft)]">{statement}</p>
          {href ? (
            <Link
              href={href}
              className="pg-focus-premium mt-3 inline-block text-[13px] font-semibold text-[var(--pg-action-primary)] no-underline"
            >
              {exploreLabel}
            </Link>
          ) : onExplore ? (
            <button
              type="button"
              className="pg-focus-premium mt-3 text-[13px] font-semibold text-[var(--pg-action-primary)]"
              onClick={onExplore}
            >
              {exploreLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
