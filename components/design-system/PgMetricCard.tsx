"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import PgMetric, { type PgMetricProps } from "./PgMetric";

export type PgMetricCardProps = PgMetricProps & {
  id?: string;
  href?: string | null;
  /** Hero band uses gradient stat value */
  gradientValue?: boolean;
  raised?: boolean;
  interactive?: boolean;
  className?: string;
  testId?: string;
  animateCounter?: boolean;
};

export default function PgMetricCard({
  id,
  href,
  gradientValue = false,
  raised = false,
  interactive,
  className,
  testId,
  emphasis = "outcome",
  animateCounter = true,
  ...metric
}: PgMetricCardProps) {
  const isInteractive = interactive ?? Boolean(href);
  const classes = cn(
    "pg-ds-card block min-w-0 p-[var(--pg-card-padding)]",
    raised && "pg-ds-card--raised",
    isInteractive && "pg-ds-card--interactive pg-focus-premium",
    gradientValue && "[&_[data-emphasis]]:pg-ds-stat-value--hero",
    className
  );

  const inner = (
    <PgMetric
      {...metric}
      emphasis={emphasis}
      animateCounter={animateCounter}
      testId={testId}
      className={gradientValue ? "[&_span:nth-of-type(2)]:pg-ds-stat-value--hero" : undefined}
    />
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
