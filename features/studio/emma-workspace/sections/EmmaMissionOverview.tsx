"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmmaMissionControlCta, EmmaMissionOverviewViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaMissionOverviewProps = {
  model: EmmaMissionOverviewViewModel;
  onMissionCta?: (cta: EmmaMissionControlCta) => void;
};

export default function EmmaMissionOverview({ model, onMissionCta }: EmmaMissionOverviewProps) {
  return (
    <EmmaWorkspaceSection title="Mission Control" subtitle={model.sectionSubtitle}>
      <EmmaCard className="emma-mission-control">
        <div className="emma-mission-control__identity">
          <p className="emma-mission-control__role">{model.roleLabel}</p>
          <div className="emma-mission-control__name-row">
            <h3 className="emma-mission-control__name">{model.peerName}</h3>
            <span className="emma-live-dot emma-live-dot--sm" aria-hidden>
              <span className="emma-live-dot__pulse" />
            </span>
          </div>
        </div>

        {model.kpis.length > 0 && (
          <div className="emma-mission-control__block">
            <p className="emma-card-label">This week</p>
            <div className="emma-mission-control__kpis">
              {model.kpis.map((kpi) => (
                <div key={kpi.id} className="emma-mission-control__kpi">
                  <span className="emma-mission-control__kpi-value">{kpi.value}</span>
                  <span className="emma-mission-control__kpi-label">{kpi.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="emma-mission-control__block">
          <p className="emma-card-label">Performance</p>
          {model.performanceMetrics.length > 0 ? (
            <div className="emma-mission-control__performance">
              {model.performanceMetrics.map((metric) => (
                <div key={metric.id} className="emma-mission-control__perf-item">
                  <span className="emma-mission-control__perf-value">{metric.value}</span>
                  <span className="emma-mission-control__perf-label">{metric.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="emma-mission-control__perf-empty">
              {model.performanceEmptyMessage}
            </p>
          )}
          <Link
            href={model.performanceLinkHref}
            className="emma-mission-control__perf-link pg-focus-premium"
          >
            {model.performanceLinkLabel}
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {model.currentFocus && (
          <div className="emma-mission-control__block">
            <p className="emma-card-label">Current focus</p>
            <div className="emma-mission-control__focus-row">
              <p className="emma-card-value">{model.currentFocus}</p>
              {model.inProgress && (
                <span className="emma-mission-control__badge">In progress</span>
              )}
            </div>
          </div>
        )}

        {model.estimatedImpact && (
          <div className="emma-mission-control__block">
            <p className="emma-card-label">Estimated impact</p>
            <p className="emma-mission-control__impact-value">{model.estimatedImpact}</p>
          </div>
        )}

        {model.missionCta && onMissionCta && (
          <button
            type="button"
            className="emma-mission-control__cta pg-focus-premium"
            onClick={() => onMissionCta(model.missionCta!)}
          >
            {model.missionCta.label}
            <ArrowRight size={16} aria-hidden />
          </button>
        )}
      </EmmaCard>
    </EmmaWorkspaceSection>
  );
}
