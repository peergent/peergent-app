"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  createModalFocusSession,
  findModalInitialFocusTarget,
} from "@/lib/peer-experience/marketing/mw-modal-focus-session";

export type MwModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  variant?: "default" | "v17";
  closeAriaLabel?: string;
};

export default function MwModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 540,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  variant = "default",
  closeAriaLabel = "Close",
}: MwModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const focusSessionRef = useRef(createModalFocusSession());
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeOnEscape]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`mw-modal-overlay mw-modal-overlay--open${variant === "v17" ? " v17-modal-overlay" : ""}`}
      role="presentation"
      onClick={(e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={`mw-modal-box${variant === "v17" ? " v17-modal-panel" : ""}`}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mw-modal-head">
          <div>
            <h2 id={titleId} className="mw-modal-title">
              {title}
            </h2>
            {subtitle && <p className="mw-modal-subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="mw-modal-close pg-focus-premium" onClick={onClose} aria-label={closeAriaLabel}>
            <X size={14} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
