"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  createModalFocusSession,
  findModalInitialFocusTarget,
} from "@/lib/peer-experience/marketing/mw-modal-focus-session";

export type PgVisionFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  closeAriaLabel?: string;
  className?: string;
  testId?: string;
};

/**
 * Vision v13 form modal — title, subtitle, close control, focus trap.
 * Used by Office surfaces; legacy MwModal remains for team/admin paths.
 */
export default function PgVisionFormModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 560,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  closeAriaLabel = "Close",
  className,
  testId,
}: PgVisionFormModalProps) {
  const { resolved } = useTheme();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const focusSessionRef = useRef(createModalFocusSession());
  const onCloseRef = useRef(onClose);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      focusSessionRef.current.markClosed();
      return;
    }

    focusSessionRef.current.markOpened();
    lastFocus.current = document.activeElement as HTMLElement | null;

    if (focusSessionRef.current.shouldApplyInitialFocus()) {
      const panel = panelRef.current;
      const focusable = panel ? findModalInitialFocusTarget(panel) : null;
      focusable?.focus();
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      lastFocus.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="pg-vision pg-v13-modal-backdrop"
      data-pg-theme={resolved}
      role="presentation"
      data-testid={testId}
      onClick={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={cn("pg-v13-modal pg-v13-modal--form", className)}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="pg-v13-modal-head">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="pg-v13-modal-title">
              {title}
            </h2>
            {subtitle ? <p className="pg-v13-modal-subtitle">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="pg-v13-modal-close flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
            onClick={onClose}
            aria-label={closeAriaLabel}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
        <div className="pg-v13-modal-body">{children}</div>
        {footer ? <div className="pg-v13-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
