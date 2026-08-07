"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import PgSparkline from "@/components/design-system/PgSparkline";
import { CcAnimatedMetric } from "./CcAnimatedMetric";
import type { CcKpiTileProps } from "./CcAnimatedMetric";
import { kpiSparklineFor, kpiTrendTone, peerIconSurfaceStyle } from "./cc-visual-utils";

export function CcKpiTile({
  id,
  label,
  value,
  trend,
  icon: Icon,
  href,
  accent = "var(--pg-action-primary)",
  hero = false,
}: CcKpiTileProps) {
  const sparkline = kpiSparklineFor(id, value);
  const tone = kpiTrendTone(trend);

  const inner = (
    <>
      <span
        className="pg-cc6-kpi__icon"
        style={{ color: accent, ...peerIconSurfaceStyle(accent) }}
      >
        <Icon size={15} strokeWidth={2} aria-hidden />
      </span>

      <p className="pg-ds-label pg-cc6-kpi__label">{label}</p>

      {trend ? (
        <span
          className={cn(
            "pg-cc6-kpi__trend",
            tone === "positive" && "pg-cc6-kpi__trend--positive",
            tone === "negative" && "pg-cc6-kpi__trend--negative",
            tone === "neutral" && "pg-cc6-kpi__trend--neutral"
          )}
        >
          {tone === "positive" ? (
            <ArrowUpRight size={11} className="pg-cc6-kpi__trend-icon" aria-hidden />
          ) : tone === "negative" ? (
            <ArrowDownRight size={11} className="pg-cc6-kpi__trend-icon" aria-hidden />
          ) : null}
          {trend}
        </span>
      ) : null}

      <CcAnimatedMetric value={value} className="pg-cc6-kpi__value" />

      {sparkline ? (
        <div className="pg-cc6-kpi__sparkline" aria-hidden>
          <PgSparkline
            points={sparkline}
            colorVar={
              tone === "positive"
                ? "var(--pg-state-positive)"
                : tone === "negative"
                  ? "var(--pg-state-attention)"
                  : "var(--pg-text-faint)"
            }
            height={20}
          />
        </div>
      ) : null}
    </>
  );

  const className = cn(
    "pg-cc6-card pg-cc6-kpi pg-ds-card--interactive pg-focus-premium",
    hero && "pg-cc6-kpi--hero"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}
