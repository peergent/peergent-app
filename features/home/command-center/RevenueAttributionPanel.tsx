"use client";

import { useEffect, useState } from "react";
import type { CommandCenterViewModel } from "@/lib/home/build-command-center-view-model";
import { sparkAreaPath, sparkLinePath } from "@/lib/home/cc-chart-paths";

export function RevenueAttributionPanel({ roi }: { roi: CommandCenterViewModel["roi"] }) {
  const width = 460;
  const height = 120;
  const linePath = sparkLinePath(roi.chartValues, width, height, 4);
  const areaPath = sparkAreaPath(roi.chartValues, width, height, 4);
  const chartClass = roi.chartMuted
    ? "command-center__roi-chart command-center__roi-chart--muted"
    : "command-center__roi-chart";

  return (
    <section className="command-center__section command-center__section--delay-35" aria-labelledby="cc-roi-title">
      <div className="command-center__roi-panel command-center__glass">
        <div className="command-center__roi-left">
          <p className="command-center__roi-eyebrow" id="cc-roi-title">
            REVENUE INFLUENCED
          </p>
          <div className="command-center__roi-value-row">
            <p className="command-center__roi-value">{roi.valueLabel}</p>
            {roi.deltaLabel && <span className="command-center__roi-delta">{roi.deltaLabel}</span>}
          </div>
          <p className="command-center__roi-caption">{roi.caption}</p>
          <svg className={chartClass} viewBox={`0 0 ${width} ${height}`} aria-hidden>
            <defs>
              <linearGradient id="ccRoiFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ccRoiStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#ccRoiFill)" stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="url(#ccRoiStroke)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="command-center__roi-right">
          <p className="command-center__attrib-title">ATTRIBUTION BY AGENT</p>
          {roi.attribution.map((row, index) => (
            <AttributionRow
              key={row.serviceKey}
              serviceKey={row.serviceKey}
              percent={row.percent}
              label={row.label}
              delayIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AttributionRow({
  serviceKey,
  percent,
  label,
  delayIndex,
}: {
  serviceKey: string;
  percent: number;
  label: string;
  delayIndex: number;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setValue(percent), 200 + delayIndex * 120);
    return () => window.clearTimeout(timeout);
  }, [percent, delayIndex]);

  return (
    <div className="command-center__attrib-row">
      <div className="command-center__attrib-top">
        <span className="command-center__attrib-name">
          <span className={`command-center__attrib-dot command-center__activity-dot--${serviceKey}`} aria-hidden />
          {label}
        </span>
        <span className="command-center__attrib-pct">{percent}%</span>
      </div>
      <div className="command-center__attrib-bar-track">
        <meter
          className={`attrib attrib--${serviceKey}`}
          value={value}
          min={0}
          max={100}
          aria-label={`${label} ${percent}%`}
        />
      </div>
    </div>
  );
}
