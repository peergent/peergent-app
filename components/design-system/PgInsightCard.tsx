import { cn } from "@/lib/ui/cn";
import PgCard from "./PgCard";

/**
 * §5 Insight card — carries an observation plus advice.
 *
 * The observation is the Peer speaking, so it sits at voice size. The
 * recommendation is set behind a quiet rule and labelled in her words, so it
 * reads as counsel rather than a metric readout.
 *
 * §11.2 Numbers never travel alone.
 */

export type PgInsightCardProps = {
  observation: string;
  recommendation?: string | null;
  /** Her words, not a category name. Defaults to the spec's phrasing. */
  recommendationLabel?: string;
  className?: string;
  testId?: string;
};

export default function PgInsightCard({
  observation,
  recommendation,
  recommendationLabel = "What I'd suggest",
  className,
  testId,
}: PgInsightCardProps) {
  return (
    <PgCard className={cn("p-[var(--pg-space-5)]", className)} data-testid={testId}>
      <p className="pg-voice pg-measure">{observation}</p>

      {recommendation ? (
        <div
          className={cn(
            "mt-[var(--pg-space-3)] border-l-2 pl-[var(--pg-space-3)]",
            "border-[var(--pg-color-border)]"
          )}
        >
          <p className="text-[var(--pg-type-body-sm)] font-semibold text-[var(--pg-color-text-tertiary)]">
            {recommendationLabel}
          </p>
          <p className="pg-body pg-body--sm pg-measure mt-0.5">{recommendation}</p>
        </div>
      ) : null}
    </PgCard>
  );
}
