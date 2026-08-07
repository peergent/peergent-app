import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type PgInsightCardProps = {
  observation: string;
  recommendation?: string | null;
  recommendationLabel?: string;
  eyebrow?: string;
  href?: string | null;
  linkLabel?: string | null;
  accentVar?: string;
  animateEnter?: boolean;
  className?: string;
  testId?: string;
};

/** P2 — single peer insight with soft gradient surface. */
export default function PgInsightCard({
  observation,
  recommendation,
  recommendationLabel = "What I'd suggest",
  eyebrow = "Peer-inzicht",
  href,
  linkLabel,
  accentVar = "var(--pg-peer-marketing)",
  animateEnter = true,
  className,
  testId = "pg-insight-card",
}: PgInsightCardProps) {
  const titleId = `${testId}-title`;

  return (
    <article
      className={cn(
        "pg-ds-card pg-ds-card--insight max-w-[480px] p-[var(--pg-card-padding-lg)]",
        href && "pg-ds-card--interactive pg-focus-premium",
        animateEnter && "pg-ds-enter",
        className
      )}
      style={{ ["--pg-card-accent" as string]: accentVar }}
      data-testid={testId}
      aria-labelledby={titleId}
    >
      <p className="pg-ds-label">{eyebrow}</p>
      <p id={titleId} className="pg-ds-voice mt-2 max-w-[52ch]">
        {observation}
      </p>

      {recommendation ? (
        <div className="mt-3 border-l-2 border-[var(--pg-border-soft)] pl-3">
          <p className="text-[13px] font-semibold text-[var(--pg-text-faint)]">
            {recommendationLabel}
          </p>
          <p className="mt-0.5 text-[14px] leading-relaxed text-[var(--pg-text-soft)]">
            {recommendation}
          </p>
        </div>
      ) : null}

      {href && linkLabel ? (
        <Link
          href={href}
          className="pg-focus-premium mt-3 inline-block text-[13px] font-semibold text-[var(--pg-action-primary)] no-underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </article>
  );
}
