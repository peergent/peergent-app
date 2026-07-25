"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PgCallout } from "@/components/design-system";
import { cn } from "@/lib/ui/cn";
import type { BriefingDecisionProps } from "./types";

type BriefingDecisionCalloutProps = BriefingDecisionProps & {
  className?: string;
};

/** Decision emphasis — links to a real attention destination. */
export function BriefingDecisionCallout({
  title,
  href,
  ctaLabel,
  className,
}: BriefingDecisionCalloutProps) {
  return (
    <PgCallout className={cn("briefing-decision-callout mt-5 max-w-[480px]", className)}>
      <p className="text-[16px] font-bold leading-[1.35] tracking-[-0.022em] text-[var(--pg-color-text-primary)]">
        {title}
      </p>
      <Link
        href={href}
        className="pg-focus-premium mt-2.5 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--pg-color-accent)] opacity-90 transition hover:opacity-100"
      >
        {ctaLabel}
        <ArrowRight size={11} aria-hidden />
      </Link>
    </PgCallout>
  );
}
