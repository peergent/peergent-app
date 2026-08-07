"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import PgMetricCard, { type PgMetricCardProps } from "./PgMetricCard";

export type PgHeroCardProps = Omit<PgMetricCardProps, "emphasis" | "gradientValue">;

/** P0 — single headline KPI for a page or band. */
export default function PgHeroCard(props: PgHeroCardProps) {
  return (
    <PgMetricCard
      {...props}
      emphasis="hero"
      gradientValue
      raised
    />
  );
}

export type PgHeroBandProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
  /** aria-label for the KPI group */
  label?: string;
};

/** P0 — grid container for up to 4 metric cards. */
export function PgHeroBand({
  children,
  className,
  testId = "pg-hero-band",
  label = "Key metrics",
}: PgHeroBandProps) {
  return (
    <section
      className={cn("pg-ds-hero-band", className)}
      data-testid={testId}
      aria-label={label}
    >
      {children}
    </section>
  );
}
