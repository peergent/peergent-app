import Link from "next/link";
import { cn } from "@/lib/ui/cn";

/**
 * §11.3 Silence is earned and explained. Empty is often the ideal state, but
 * the cause must be named.
 *
 * The API makes a lazy empty state impossible to build: `voice` is required
 * and carries the reason in the Peer's own words. There is no illustration
 * and no "nothing here yet" — that is the failure mode this component exists
 * to prevent.
 */

export type PgEmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export type PgEmptyStateProps = {
  /** Required. What she says, including why it is empty. */
  voice: string;
  /** What happens next, and when. Makes the silence evidenced. */
  next?: string;
  /** Proposed action — an empty state that does work (§4.2). */
  action?: PgEmptyStateAction;
  /** A quieter alternative alongside the proposal. */
  secondaryAction?: PgEmptyStateAction;
  /**
   * What this page will show once it can show anything.
   *
   * Inherited from the Desk briefing: an empty page that only explains its own
   * silence still leaves the customer without a reason to come back. Naming
   * the future makes the page valuable before the data exists.
   */
  future?: { heading: string; promise: string } | null;
  className?: string;
  testId?: string;
};

function ActionControl({
  action,
  variant,
}: {
  action: PgEmptyStateAction;
  variant: "primary" | "ghost";
}) {
  const classes = cn(
    "pg-focus-premium inline-flex items-center justify-center rounded-[var(--pg-radius-sm)]",
    "px-4 min-h-9 text-sm font-medium transition",
    variant === "primary"
      ? "bg-[var(--pg-color-accent)] text-[var(--pg-color-text-inverse)] hover:bg-[var(--pg-color-accent-hover)]"
      : "border border-[var(--pg-color-border)] text-[var(--pg-color-text-secondary)] hover:text-[var(--pg-color-text-primary)]"
  );

  if (action.href) {
    return (
      <Link href={action.href} className={classes}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {action.label}
    </button>
  );
}

export default function PgEmptyState({
  voice,
  next,
  action,
  secondaryAction,
  future = null,
  className,
  testId,
}: PgEmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-start gap-[var(--pg-space-3)]", className)}
      data-testid={testId}
    >
      <p className="pg-voice pg-measure">{voice}</p>
      {next ? <p className="pg-body pg-body--sm pg-measure">{next}</p> : null}
      {action || secondaryAction ? (
        <div className="mt-[var(--pg-space-1)] flex flex-wrap items-center gap-[var(--pg-space-2)]">
          {action ? <ActionControl action={action} variant="primary" /> : null}
          {secondaryAction ? (
            <ActionControl action={secondaryAction} variant="ghost" />
          ) : null}
        </div>
      ) : null}
      {future ? (
        <div className="mt-[var(--pg-space-5)] flex max-w-[52ch] flex-col gap-1.5 border-t border-[var(--pg-office-line)] pt-[var(--pg-space-4)]">
          <span className="text-[10px] font-medium tracking-[0.09em] text-[var(--pg-color-text-tertiary)] uppercase">
            {future.heading}
          </span>
          <p className="text-[13.5px] leading-relaxed text-[var(--pg-color-text-secondary)]">
            {future.promise}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * §6 Failure behaviour. The sequence is fixed: stop, preserve, report
 * unprompted, offer a next step. Never a code, never a provider name, never a
 * stack trace.
 *
 * §8 Bad news is never animated — stillness is respect.
 */
export type PgErrorStateProps = {
  /** What happened, in her voice, without jargon. */
  voice: string;
  /** What was preserved. Required: "nothing is lost" is the point. */
  preserved: string;
  retry?: PgEmptyStateAction;
  secondaryAction?: PgEmptyStateAction;
  className?: string;
  testId?: string;
};

export function PgErrorState({
  voice,
  preserved,
  retry,
  secondaryAction,
  className,
  testId,
}: PgErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-[var(--pg-space-3)] rounded-[var(--pg-radius-md)]",
        "border border-l-2 border-[var(--pg-office-line)]",
        "border-l-[var(--pg-color-error)] p-[var(--pg-space-4)]",
        className
      )}
      role="group"
      data-testid={testId}
    >
      <p className="pg-voice pg-measure">{voice}</p>
      <p className="pg-body pg-body--sm pg-measure">{preserved}</p>
      {retry || secondaryAction ? (
        <div className="mt-[var(--pg-space-1)] flex flex-wrap items-center gap-[var(--pg-space-2)]">
          {retry ? <ActionControl action={retry} variant="primary" /> : null}
          {secondaryAction ? (
            <ActionControl action={secondaryAction} variant="ghost" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { ActionControl as PgInlineAction };
