"use client";

import Link from "next/link";
import type { PerformanceProviderCard } from "@/lib/office/performance/provider-cards";
import { officeHref } from "@/lib/office/links";

export type VisionPerformanceProviderViewProps = {
  peerId: string;
  card: PerformanceProviderCard;
  locale?: string | null;
};

export default function VisionPerformanceProviderView({
  peerId,
  card,
  locale,
}: VisionPerformanceProviderViewProps) {
  const nl = locale === "nl";

  return (
    <div data-testid={`office-performance-provider-${card.id}`}>
      <Link
        href={officeHref(peerId, "performance")}
        className="pg-v13-btn pg-v13-btn--ghost mb-6 inline-flex no-underline"
      >
        {nl ? "← Terug naar Resultaten" : "← Back to Performance"}
      </Link>

      <p className="pg-v13-eyebrow">{nl ? "Resultaten" : "Performance"}</p>
      <h1 className="pg-v13-title">{card.title}</h1>

      <section className="pg-v13-sec mt-8">
        <div className="pg-v13-channel-grid">
          <div className="pg-v13-channel-card col-span-full sm:col-span-1">
            {card.metrics.map((metric) => (
              <div key={metric.key} className="mb-4 last:mb-0">
                <div className="pg-v13-cs-lbl">{metric.label}</div>
                <div className="pg-v13-cs-val">{metric.value}</div>
                <p className="mt-1 text-[11px] text-[var(--pg-v13-ink-faint)]">{metric.sourceLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
