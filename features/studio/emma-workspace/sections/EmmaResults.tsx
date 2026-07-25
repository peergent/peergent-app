"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmmaResultsViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaResultsProps = {
  model: EmmaResultsViewModel;
};

export default function EmmaResults({ model }: EmmaResultsProps) {
  return (
    <EmmaWorkspaceSection title="Results" className="emma-workspace-section--compact">
      <EmmaCard className="emma-results-card">
        {model.metrics.length > 0 ? (
          <div className="emma-results-card__grid">
            {model.metrics.map((metric) => (
              <div key={metric.id} className="emma-results-card__metric">
                <span className="emma-results-card__value">{metric.value}</span>
                <span className="emma-results-card__label">{metric.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="emma-voice emma-voice--muted">{model.emptyMessage}</p>
        )}
        <Link href={model.fullPerformanceHref} className="emma-results-card__link pg-focus-premium">
          {model.fullPerformanceLabel}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </EmmaCard>
    </EmmaWorkspaceSection>
  );
}
