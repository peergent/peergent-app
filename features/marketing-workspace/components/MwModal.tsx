"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type MwModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
};

export default function MwModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 540,
}: MwModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="mw-modal-overlay mw-modal-overlay--open"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="mw-modal-box"
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
          <button type="button" className="mw-modal-close pg-focus-premium" onClick={onClose} aria-label="Close">
            <X size={14} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
