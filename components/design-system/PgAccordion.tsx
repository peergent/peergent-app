"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";

export type PgAccordionSectionProps = {
  id: string;
  title: string;
  count?: number | null;
  defaultOpen?: boolean;
  children: ReactNode;
  testId?: string;
};

export function PgAccordionSection({
  id,
  title,
  count,
  defaultOpen = false,
  children,
  testId,
}: PgAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className="border-b border-[var(--pg-office-line)] last:border-b-0" data-testid={testId}>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={`${panelId}-panel`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "pg-focus-premium flex w-full items-center gap-[var(--pg-space-3)]",
          "py-[var(--pg-space-4)] text-left transition-colors",
          "hover:text-[var(--pg-color-text-primary)]"
        )}
      >
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            "shrink-0 text-[var(--pg-color-text-tertiary)] transition-transform duration-[var(--pg-duration-state)]",
            open && "rotate-180"
          )}
        />
        <span className="pg-title flex-1 text-[var(--pg-color-text-primary)]">{title}</span>
        {typeof count === "number" ? (
          <span className="pg-micro tabular-nums">{count}</span>
        ) : null}
      </button>
      <div
        id={`${panelId}-panel`}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        hidden={!open}
        className={cn(!open && "hidden")}
      >
        <div className="pb-[var(--pg-space-5)]">{children}</div>
      </div>
    </section>
  );
}

export type PgAccordionProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
};

export default function PgAccordion({ children, className, testId }: PgAccordionProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--pg-radius-md)] border border-[var(--pg-office-line)] bg-[var(--pg-office-panel)]",
        "px-[var(--pg-space-5)]",
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
