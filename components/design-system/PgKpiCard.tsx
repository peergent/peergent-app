"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import PgMetric, { type PgMetricProps } from "./PgMetric";

export type PgKpiCardProps = PgMetricProps & {
  id?: string;
  href?: string | null;
  icon?: ReactNode;
  className?: string;
  testId?: string;
};

export default function PgKpiCard({
  id,
  href,
  icon,
  className,
  testId,
  emphasis = "outcome",
  ...metric
}: PgKpiCardProps) {
  const isOutcome = emphasis === "outcome" || emphasis === "hero";
  const inner = (
    <>
      {icon ? (
        <div className="mb-[var(--pg-space-2)] text-[var(--pg-color-text-tertiary)]">{icon}</div>
      ) : null}
      <PgMetric {...metric} emphasis={emphasis} testId={testId} />
    </>
  );

  const classes = cn(
    "pg-kpi-card block min-w-0",
    isOutcome && "pg-kpi-card--outcome",
    href && "pg-kpi-card--interactive pg-focus-premium",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} data-testid={testId} data-kpi-id={id}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={classes} data-testid={testId} data-kpi-id={id}>
      {inner}
    </div>
  );
}
