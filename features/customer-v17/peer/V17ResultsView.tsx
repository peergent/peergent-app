"use client";

import Link from "next/link";
import type { V17ResultsViewModel } from "@/lib/customer-v17/build-v17-results-view-model";
import V17MetricCard from "@/features/customer-v17/components/V17MetricCard";

export default function V17ResultsView({ model }: { model: V17ResultsViewModel }) {
  return (
    <div className="v17-section-page" data-testid="v17-results-view">
      <h2 className="v17-section-page-title">{model.title}</h2>
      {model.summaryLine ? <p className="v17-result-line">{model.summaryLine}</p> : null}
      {model.metrics.length > 0 ? (
        <div className="v17-result-grid">
          {model.metrics.map((m) => (
            <V17MetricCard
              key={m.id}
              value={m.value}
              label={m.label}
              href={m.href}
              testId={`v17-result-metric-${m.id}`}
            />
          ))}
        </div>
      ) : null}
      {model.unavailableMessage ? (
        <p className="v17-page-support">{model.unavailableMessage}</p>
      ) : null}
      {model.connectionsHref && model.connectionsCta ? (
        <Link href={model.connectionsHref} className="v17-btn v17-btn--ghost pg-focus-premium">
          {model.connectionsCta}
        </Link>
      ) : null}
    </div>
  );
}
