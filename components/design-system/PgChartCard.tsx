"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/cn";
import PgChartFrame, { type PgChartFrameProps } from "./PgChartFrame";
import PgTrendChart, { type PgTrendChartProps } from "./PgTrendChart";

export type PgChartCardProps = Omit<PgChartFrameProps, "children"> & {
  series?: PgTrendChartProps | null;
  insight?: string | null;
  animate?: boolean;
  footer?: ReactNode;
  className?: string;
};

/** P1 — one chart, one story, one insight line. */
export default function PgChartCard({
  series,
  insight,
  animate = true,
  footer,
  className,
  testId = "pg-chart-card",
  ...frame
}: PgChartCardProps) {
  const hasSeries = Boolean(series && series.points.length >= 2);

  return (
    <div
      className={cn(
        "pg-ds-card pg-ds-card--raised p-[var(--pg-card-padding-lg)]",
        className
      )}
      data-testid={testId}
    >
      <PgChartFrame {...frame} testId={`${testId}-frame`}>
        {hasSeries && series ? (
          <PgTrendChart
            {...series}
            animate={animate}
            testId={`${testId}-chart`}
          />
        ) : null}
      </PgChartFrame>
      {hasSeries && insight ? (
        <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-[var(--pg-text-soft)]">
          {insight}
        </p>
      ) : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}
