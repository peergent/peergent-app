"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { handleFocusTrapKeyDown } from "@/lib/peer-experience/focus-trap";
import { cn } from "@/lib/ui/cn";

export type PgInspectorProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Reserve space for fixed review bar on mobile (px). */
  reviewBarOffset?: number;
  /** When false, Tab can reach elements outside the inspector (e.g. review bar). */
  focusTrap?: boolean;
  className?: string;
};

/**
 * Secondary context panel — plan, reasoning. No workflow CTAs.
 * Desktop: inline column. Mobile: bottom sheet above review bar.
 */
export default function PgInspector({
  open,
  title,
  onClose,
  children,
  reviewBarOffset = 72,
  focusTrap = false,
  className,
}: PgInspectorProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (focusTrap && panelRef.current) {
        handleFocusTrapKeyDown(event, panelRef.current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open, onClose, focusTrap]);

  if (!open) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close inspector"
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        role="complementary"
        aria-labelledby="pg-inspector-title"
        style={{ ["--pg-review-bar-offset" as string]: `${reviewBarOffset}px` }}
        className={cn(
          "flex flex-col border-[var(--pg-color-border)] bg-[var(--pg-color-elevated)]",
          "fixed inset-x-0 bottom-[var(--pg-review-bar-offset)] z-[35] max-h-[60vh] rounded-t-[var(--pg-radius-xl)] border-t",
          "lg:relative lg:inset-auto lg:bottom-auto lg:z-auto lg:max-h-none lg:rounded-none",
          "lg:w-[var(--pg-container-inspector)] lg:shrink-0 lg:border-l lg:border-t-0",
          className
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--pg-color-divider)] px-4 py-3 md:px-5">
          <h2
            id="pg-inspector-title"
            className="text-base font-semibold text-[var(--pg-color-text-primary)]"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "pg-focus-premium flex h-10 w-10 items-center justify-center rounded-[var(--pg-radius-md)]",
              "text-[var(--pg-color-text-secondary)] transition hover:bg-[var(--pg-color-accent-muted)]",
              "hover:text-[var(--pg-color-text-primary)]"
            )}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5">{children}</div>
      </aside>
    </>
  );
}
