"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import {
  createModalFocusSession,
  findModalInitialFocusTarget,
} from "@/lib/peer-experience/marketing/mw-modal-focus-session";

/**
 * §2 A modal is not a third elevation level — it is a full-screen mode change.
 * §4.4 Review mode: entered from a decision, 320ms scale-and-fade. Escape
 * returns without deciding, and the decision remains exactly where it was.
 *
 * Everything else in the product is hidden while this is open: one decision
 * per moment (§11.5).
 */

export type PgFocusedModeProps = {
  open: boolean;
  /** Returns without deciding. Never destructive. */
  onExit: () => void;
  /** Screen-reader name for the mode. */
  title: string;
  /** Quiet position marker, e.g. "2 of 3". */
  positionLabel?: string | null;
  /** Pinned actions. The work itself stays dominant above them. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  testId?: string;
};

export default function PgFocusedMode({
  open,
  onExit,
  title,
  positionLabel,
  footer,
  children,
  className,
  testId,
}: PgFocusedModeProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const focusSessionRef = useRef(createModalFocusSession());
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const session = focusSessionRef.current;

    if (!open) {
      session.markClosed();
      return;
    }

    session.markOpened();
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    if (session.shouldApplyInitialFocus()) {
      const panel = panelRef.current;
      const target = panel ? findModalInitialFocusTarget(panel) : null;
      target?.focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onExitRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--pg-color-canvas)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid={testId}
    >
      <div
        ref={panelRef}
        className={cn("pg-mode-enter flex min-h-0 flex-1 flex-col", className)}
      >
        <header
          className={cn(
            "flex shrink-0 items-center gap-[var(--pg-space-4)]",
            "border-b border-[var(--pg-office-line)]",
            "px-[var(--pg-space-5)] py-[var(--pg-space-3)]"
          )}
        >
          <button
            type="button"
            onClick={onExit}
            aria-label="Close without deciding"
            className={cn(
              "pg-focus-premium inline-flex h-8 w-8 items-center justify-center",
              "rounded-[var(--pg-radius-sm)] text-[var(--pg-color-text-tertiary)]",
              "transition-colors duration-[var(--pg-duration-state)]",
              "hover:text-[var(--pg-color-text-primary)]"
            )}
          >
            <X size={16} aria-hidden />
          </button>
          <h2 id={titleId} className="pg-section-title">
            {title}
          </h2>
          {positionLabel ? (
            <span className="pg-label ml-auto">{positionLabel}</span>
          ) : null}
        </header>

        {/* The work itself. Dominant — most of the screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--pg-space-5)] py-[var(--pg-space-5)]">
          {children}
        </div>

        {footer ? (
          <footer
            className={cn(
              "shrink-0 border-t border-[var(--pg-office-line)]",
              "px-[var(--pg-space-5)] py-[var(--pg-space-4)]"
            )}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
