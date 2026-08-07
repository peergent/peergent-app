"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import PgAccordion, { PgAccordionSection } from "./PgAccordion";
import PgStatusChip from "./PgStatusChip";

export type PgBriefingCardSection = {
  id: string;
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

export type PgBriefingCardProps = {
  peerLabel: string;
  title: string;
  summary: string;
  statusLabel?: string | null;
  statusTone?: "waiting" | "live" | "working" | "neutral";
  accentVar?: string;
  sections?: readonly PgBriefingCardSection[];
  footer?: ReactNode;
  metadata?: ReactNode;
  className?: string;
  testId?: string;
};

/** P0 — peer handover moment. Accordion sections, never slideshow. */
export default function PgBriefingCard({
  peerLabel,
  title,
  summary,
  statusLabel,
  statusTone = "neutral",
  accentVar = "var(--pg-peer-marketing)",
  sections = [],
  footer,
  metadata,
  className,
  testId = "pg-briefing-card",
}: PgBriefingCardProps) {
  return (
    <article
      className={cn(
        "pg-ds-card pg-ds-card--raised pg-ds-card--accent-top mx-auto w-full max-w-[var(--pg-canvas-prose)]",
        "overflow-hidden p-0",
        className
      )}
      style={{ ["--pg-card-accent" as string]: accentVar }}
      data-testid={testId}
    >
      <header className="border-b border-[var(--pg-border-soft)] p-[var(--pg-card-padding-lg)]">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
            style={{ background: accentVar }}
            aria-hidden
          >
            {peerLabel.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="pg-ds-label">{peerLabel}</p>
            <h2 className="mt-1 text-[20px] font-semibold leading-snug text-[var(--pg-text)] sm:text-[22px]">
              {title}
            </h2>
            {statusLabel ? (
              <div className="mt-3">
                <PgStatusChip label={statusLabel} tone={statusTone} testId={`${testId}-status`} />
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--pg-text-soft)]">{summary}</p>
        {metadata ? <div className="mt-5">{metadata}</div> : null}
      </header>

      {sections.length > 0 ? (
        <div className="px-[var(--pg-card-padding-lg)] py-2">
          <PgAccordion testId={`${testId}-sections`}>
            {sections.map((section) => (
              <PgAccordionSection
                key={section.id}
                id={section.id}
                title={section.title}
                defaultOpen={section.defaultOpen}
                testId={`${testId}-section-${section.id}`}
              >
                {section.content}
              </PgAccordionSection>
            ))}
          </PgAccordion>
        </div>
      ) : null}

      {footer ? (
        <footer className="border-t border-[var(--pg-border-soft)] bg-[var(--pg-office-inset,var(--pg-v13-panel))] p-[var(--pg-card-padding-lg)]">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
