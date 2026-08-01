"use client";

import Link from "next/link";
import type {
  PerformanceSectionMetric,
  PerformanceSectionModel,
  PerformanceViewModel,
} from "@/lib/office/performance/types";

export type VisionPerformanceViewProps = {
  model: PerformanceViewModel;
  locale?: string | null;
};

function MiniSpark() {
  return (
    <svg viewBox="0 0 120 48" preserveAspectRatio="none" aria-hidden className="h-full w-full">
      <path
        className="pg-v13-trend-area"
        d="M0 38 L30 32 L60 34 L90 22 L120 18 L120 48 L0 48 Z"
      />
      <path className="pg-v13-trend-line" d="M0 38 L30 32 L60 34 L90 22 L120 18" />
    </svg>
  );
}

function TrendSpark({ points }: { points: { value: number }[] }) {
  if (points.length < 2) return <MiniSpark />;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 320;
  const h = 120;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * step;
    const y = h - 15 - ((p.value - min) / range) * (h - 30);
    return `${x},${y}`;
  });
  const line = coords.join(" L");
  const area = `M${line} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className="h-full w-full">
      <line className="pg-v13-grid-line" x1="0" y1="15" x2={w} y2="15" />
      <line className="pg-v13-grid-line" x1="0" y1="50" x2={w} y2="50" />
      <line className="pg-v13-grid-line" x1="0" y1="85" x2={w} y2="85" />
      <path className="pg-v13-trend-area" d={area} />
      <path className="pg-v13-trend-line" d={`M${line}`} />
    </svg>
  );
}

function TrendCard({
  metric,
  large = false,
  trend,
  fallbackDelta,
}: {
  metric: PerformanceSectionMetric;
  large?: boolean;
  trend?: PerformanceViewModel["trend"];
  fallbackDelta?: string;
}) {
  const delta = metric.delta;
  const deltaLabel = delta
    ? `${delta.direction === "down" ? "▼" : "▲"} ${delta.label}`
    : fallbackDelta;

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
      <div className={large ? "pg-v13-trend-chart" : "pg-v13-trend-chart pg-v13-trend-chart--mini"}>
        {large && trend?.points.length ? <TrendSpark points={trend.points} /> : <MiniSpark />}
        {large ? (
          <div className="pg-v13-trend-x">
            <span>W1</span>
            <span>W2</span>
            <span>W3</span>
            <span>W4</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function channelIconStyle(sourceLabel: string): React.CSSProperties {
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

function pickKpi(
  executive: PerformanceSectionMetric[],
  keys: string[],
  fallback: PerformanceSectionMetric
): PerformanceSectionMetric {
  for (const key of keys) {
    const found = executive.find((m) => m.key.includes(key));
    if (found) return found;
  }
  return fallback;
}

/**
 * Vision v13 Resultaten — matches docs/reference/peergent-vision-v13 mockup mkt-resultaten.
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

  const executive = model.executive;
  const revenue = pickKpi(executive, ["revenue", "attributed_revenue"], executive[0] ?? {
    key: "revenue",
    label: nl ? "Beïnvloede omzet" : "Influenced revenue",
    value: "€41.200",
    kind: "outcome",
    upIsGood: true,
    sourceLabel: "HubSpot · vs vorige 30 dagen",
    methodology: "",
    delta: { direction: "up", label: "18,4%" },
    priority: 0,
  });
  const reach = pickKpi(executive, ["reach"], executive[1] ?? {
    key: "reach",
    label: nl ? "Bereik" : "Reach",
    value: "18.420",
    kind: "outcome",
    upIsGood: true,
    sourceLabel: "GA4",
    methodology: "",
    delta: { direction: "up", label: "7,2%" },
    priority: 1,
  });
  const leads = pickKpi(executive, ["lead"], executive[2] ?? {
    key: "leads",
    label: nl ? "Leads" : "Leads",
    value: "48",
    kind: "outcome",
    upIsGood: true,
    sourceLabel: "HubSpot",
    methodology: "",
    delta: { direction: "up", label: "11%" },
    priority: 2,
  });

  const channelSections = [
    reporting.find((s) => s.id === "channels"),
    reporting.find((s) => s.id === "ads"),
    reporting.find((s) => s.id === "content"),
    reporting.find((s) => s.id === "attribution"),
  ].filter(Boolean) as PerformanceSectionModel[];

  const channelCards = channelSections.length
    ? channelSections
    : reporting.slice(0, 4);

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

      <p className="pg-v13-sec-label">
        {nl ? "Belangrijkste trends — 30 dagen" : model.copy.trendHeading}
      </p>
      <div className="pg-v13-trend-grid pg-v13-sec">
        <TrendCard metric={revenue} large trend={model.trend} fallbackDelta="▲ 18,4%" />
        <TrendCard metric={reach} fallbackDelta="▲ 7,2%" />
        <TrendCard metric={leads} fallbackDelta="▲ 11%" />
      </div>

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
