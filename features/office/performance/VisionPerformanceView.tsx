"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type {
  PerformanceSectionMetric,
  PerformanceSectionModel,
  PerformanceTrend,
  PerformanceTrendPoint,
  PerformanceViewModel,
} from "@/lib/office/performance/types";

export type VisionPerformanceViewProps = {
  model: PerformanceViewModel;
  locale?: string | null;
};

type SparkVariant = "primary" | "secondary";

function buildSparkGeometry(points: PerformanceTrendPoint[], width: number, height: number) {
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - 15 - ((point.value - min) / range) * (height - 30);
    return { x, y };
  });
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(" L");
  const area = `M${line} L${width},${height} L0,${height} Z`;
  const last = coords[coords.length - 1];
  return { line, area, last };
}

function TrendSpark({
  points,
  large = false,
  variant = "primary",
}: {
  points: PerformanceTrendPoint[];
  large?: boolean;
  variant?: SparkVariant;
}) {
  if (points.length < 2) return null;

  const width = large ? 320 : 120;
  const height = large ? 120 : 48;
  const { line, area, last } = buildSparkGeometry(points, width, height);
  const areaClass =
    variant === "secondary" ? "pg-v13-trend-area pg-v13-trend-area--b" : "pg-v13-trend-area";
  const lineClass =
    variant === "secondary" ? "pg-v13-trend-line pg-v13-trend-line--b" : "pg-v13-trend-line";
  const ptClass = variant === "secondary" ? "pg-v13-trend-pt pg-v13-trend-pt--b" : "pg-v13-trend-pt";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className="h-full w-full">
      {large ? (
        <>
          <line className="pg-v13-grid-line" x1="0" y1="15" x2={width} y2="15" />
          <line className="pg-v13-grid-line" x1="0" y1="50" x2={width} y2="50" />
          <line className="pg-v13-grid-line" x1="0" y1="85" x2={width} y2="85" />
        </>
      ) : null}
      <path className={areaClass} d={area} />
      <path className={lineClass} d={`M${line}`} />
      {last ? <circle className={ptClass} cx={last.x} cy={last.y} r={large ? 3.5 : 2.5} /> : null}
    </svg>
  );
}

function TrendCard({
  metric,
  large = false,
  trend,
  variant = "primary",
}: {
  metric: PerformanceSectionMetric;
  large?: boolean;
  trend?: PerformanceTrend;
  variant?: SparkVariant;
}) {
  const delta = metric.delta;
  const deltaLabel = delta ? `${delta.direction === "down" ? "▼" : "▲"} ${delta.label}` : null;
  const chartPoints = trend && trend.points.length >= 2 ? trend.points : null;

  return (
    <div className={large ? "pg-v13-trend-card" : "pg-v13-trend-card pg-v13-trend-card--sm"}>
      <div className="pg-v13-trend-head">
        <div className="pg-v13-trend-lbl">{metric.label}</div>
        <div className="pg-v13-trend-valrow">
          <span className="pg-v13-trend-val">{metric.value}</span>
          {deltaLabel ? (
            <span
              className={
                delta?.direction === "down"
                  ? "pg-v13-trend-delta pg-v13-trend-delta--down"
                  : "pg-v13-trend-delta"
              }
            >
              {deltaLabel}
            </span>
          ) : null}
        </div>
        <div className="pg-v13-trend-cap">{metric.sourceLabel}</div>
      </div>
      {chartPoints ? (
        <div className={large ? "pg-v13-trend-chart" : "pg-v13-trend-chart pg-v13-trend-chart--mini"}>
          <TrendSpark points={chartPoints} large={large} variant={variant} />
          {large ? (
            <div className="pg-v13-trend-x">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          ) : (
            <div className="pg-v13-trend-x">
              <span>W1</span>
              <span>W2</span>
              <span>W3</span>
              <span>W4</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function channelIconStyle(sourceLabel: string): CSSProperties {
  const lower = sourceLabel.toLowerCase();
  if (lower.includes("linkedin")) return { background: "#0A66C2" };
  if (lower.includes("google ads")) return { background: "#EFAA53", color: "#14151F" };
  if (lower.includes("analytics") || lower.includes("ga4"))
    return { background: "#3FC79A", color: "#14151F" };
  if (lower.includes("hubspot")) return { background: "var(--pg-v13-grad)" };
  return { background: "var(--pg-v13-blue)" };
}

function ChannelCard({ section }: { section: PerformanceSectionModel }) {
  const name = section.title.replace(/ —.*/, "");
  const initial = name.slice(0, 2).toUpperCase();

  return (
    <div className="pg-v13-channel-card">
      <div className="pg-v13-channel-head">
        <div className="pg-v13-channel-ico" style={channelIconStyle(name)}>
          {initial.slice(0, 2)}
        </div>
        <div className="pg-v13-channel-name">{name}</div>
      </div>
      <div className="pg-v13-channel-stats">
        {section.metrics.slice(0, 4).map((metric) => (
          <div key={metric.key}>
            <div className="pg-v13-cs-lbl">{metric.label}</div>
            <div className="pg-v13-cs-val">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Vision v13 Resultaten — grounded metrics only; charts render when real series exist.
 */
export default function VisionPerformanceView({ model, locale }: VisionPerformanceViewProps) {
  const nl = locale === "nl";
  const reporting = model.sections.filter((s) => s.state === "reporting");

  const storyItems = model.executive.length
    ? model.executive.map((item) => ({
        key: item.key,
        text: `${item.value} ${item.label.toLowerCase()}`,
      }))
    : model.metrics.slice(0, 5).map((m) => ({
        key: m.id,
        text: `${m.value} ${m.label.toLowerCase()}`,
      }));

  const executive = model.executive.filter((metric) => metric.kind === "outcome").slice(0, 3);

  const channelSections = [
    reporting.find((s) => s.id === "channels"),
    reporting.find((s) => s.id === "ads"),
    reporting.find((s) => s.id === "content"),
    reporting.find((s) => s.id === "attribution"),
  ].filter(Boolean) as PerformanceSectionModel[];

  const channelCards = channelSections.length ? channelSections : reporting.slice(0, 4);

  return (
    <div data-testid="office-performance-view">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <linearGradient id="pgV13GradA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pg-v13-blue)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--pg-v13-blue)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pgV13GradB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pg-v13-indigo)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--pg-v13-indigo)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mb-6 flex flex-wrap gap-2">
        {model.filterGroups.map((group) =>
          group.options.map((option) => (
            <Link
              key={`${group.id}-${option.id}`}
              href={option.href}
              className={
                option.active
                  ? "pg-v13-chip pg-v13-chip--active no-underline"
                  : "pg-v13-chip no-underline"
              }
            >
              {option.label}
            </Link>
          ))
        )}
      </div>

      {storyItems.length > 0 ? (
        <div className="pg-v13-story-panel">
          <div className="pg-v13-story-lbl">{nl ? "Sinds vorige week" : "Since last week"}</div>
          <div className="pg-v13-story-list">
            {storyItems.map((item) => (
              <div key={item.key} className="pg-v13-story-item">
                <span className="pg-v13-story-plus">+</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {executive.length > 0 ? (
        <>
          <p className="pg-v13-sec-label">
            {nl ? "Belangrijkste trends — 30 dagen" : model.copy.trendHeading}
          </p>
          <div className="pg-v13-trend-grid pg-v13-sec">
            {executive.map((metric, index) => (
              <TrendCard
                key={metric.key}
                metric={metric}
                large={index === 0}
                trend={index === 0 ? model.trend : null}
                variant={index === 1 ? "secondary" : "primary"}
              />
            ))}
          </div>
        </>
      ) : null}

      {channelCards.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Per kanaal — 30 dagen" : "By channel — 30 days"}</p>
          <div className="pg-v13-channel-grid">
            {channelCards.map((section) => (
              <ChannelCard key={section.id} section={section} />
            ))}
          </div>
        </section>
      ) : null}

      {model.gaps.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{model.copy.gapsHeading}</p>
          {model.gaps.map((gap) => (
            <div key={gap.id} className="pg-v13-reco-panel mb-3">
              <p>{gap.missing}</p>
              <Link href={gap.ctaHref} className="pg-v13-btn pg-v13-btn--sm no-underline">
                {gap.ctaLabel}
              </Link>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
