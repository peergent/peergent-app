"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";

export type PgRecommendationCardProps = {
  peerLabel: string;
  recommendation: string;
  primaryLabel: string;
  href?: string;
  onAction?: () => void;
  accentVar?: string;
  className?: string;
  testId?: string;
};

/** P2 — one proactive peer suggestion with a single CTA. */
export default function PgRecommendationCard({
  peerLabel,
  recommendation,
  primaryLabel,
  href,
  onAction,
  accentVar = "var(--pg-peer-marketing)",
  className,
  testId = "pg-recommendation-card",
}: PgRecommendationCardProps) {
  return (
    <div
      className={cn(
        "pg-ds-card pg-ds-card--accent-top p-[var(--pg-card-padding-lg)]",
        className
      )}
      style={{ ["--pg-card-accent" as string]: accentVar }}
      data-testid={testId}
    >
      <p className="pg-ds-label">{peerLabel}</p>
      <p className="pg-ds-voice mt-2 max-w-[52ch]">{recommendation}</p>
      <div className="mt-4">
        {href ? (
          <Link href={href} className="pg-v13-btn inline-flex no-underline">
            {primaryLabel}
          </Link>
        ) : (
          <button type="button" className="pg-v13-btn" onClick={onAction}>
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
