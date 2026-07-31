"use client";

import { cn } from "@/lib/ui/cn";
import PgCard from "./PgCard";
import { peerAccentVar } from "@/lib/design-system/foundation";

/**
 * §4.1a The autonomy request. Lives on the Desk, where she speaks daily —
 * not in the working agreement, which is visited a few times a year.
 *
 * Carries her accent, never amber. Amber means "you are blocking work"; she is
 * not blocked, she is asking.
 *
 * Four parts, in this order: evidence → proposal → bounded scope → the exit,
 * offered before it is asked for. The fourth is what makes the request feel
 * safe rather than like pressure.
 */

export type PgAutonomyRequestProps = {
  peerRole: string;
  /** Specific and countable, one sentence, checkable. */
  evidence: string;
  /** Stated as a consequence, never as a setting. */
  proposal: string;
  /** Exactly what changes — and what does not. */
  scope: string;
  /** What tomorrow looks like differently, in plain terms. */
  impact: string;
  /** The exit, offered unprompted. */
  reassurance: string;
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel?: string;
  declineLabel?: string;
  className?: string;
  testId?: string;
};

export default function PgAutonomyRequest({
  peerRole,
  evidence,
  proposal,
  scope,
  impact,
  reassurance,
  onAccept,
  onDecline,
  acceptLabel = "Yes, go ahead",
  declineLabel = "Keep asking me",
  className,
  testId,
}: PgAutonomyRequestProps) {
  const accent = peerAccentVar(peerRole);

  return (
    <PgCard
      className={cn("border-l-2", className)}
      style={{ borderLeftColor: accent }}
      data-testid={testId ?? "pg-autonomy-request"}
    >
      <div className="flex flex-col gap-[var(--pg-space-3)]">
        <div className="flex flex-col gap-[var(--pg-space-2)]">
          <p className="pg-voice">{evidence}</p>
          <p className="pg-voice">{proposal}</p>
        </div>

        <div className="flex flex-col gap-[var(--pg-space-1)]">
          <p className="pg-body pg-body--sm">{scope}</p>
          <p className="pg-body pg-body--sm">{impact}</p>
          <p className="pg-body pg-body--sm">{reassurance}</p>
        </div>

        <div className="mt-[var(--pg-space-1)] flex flex-wrap items-center gap-[var(--pg-space-2)]">
          <button
            type="button"
            onClick={onAccept}
            className={cn(
              "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
              "px-4 text-sm font-medium text-[var(--pg-color-text-inverse)] transition"
            )}
            style={{ background: accent }}
          >
            {acceptLabel}
          </button>
          <button
            type="button"
            onClick={onDecline}
            className={cn(
              "pg-focus-premium inline-flex min-h-9 items-center rounded-[var(--pg-radius-sm)]",
              "border border-[var(--pg-color-border)] px-4 text-sm",
              "text-[var(--pg-color-text-secondary)] transition",
              "hover:text-[var(--pg-color-text-primary)]"
            )}
          >
            {declineLabel}
          </button>
        </div>
      </div>
    </PgCard>
  );
}
