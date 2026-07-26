"use client";

import { ListOrdered } from "lucide-react";
import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";

export type CampaignExecutionPlanSectionProps = {
  plan: CampaignExecutionPlanViewModel;
};

function itemStatusClass(statusLabel: string): string {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("block")) return "mw-project-status mw-project-status--blocked";
  if (lower.includes("progress")) return "mw-project-status mw-project-status--planning";
  if (lower.includes("complete")) return "mw-project-status";
  return "mw-project-status mw-project-status--planning";
}

export default function CampaignExecutionPlanSection({ plan }: CampaignExecutionPlanSectionProps) {
  if (plan.availability === "unavailable") {
    return (
      <div
        className="mw-section mw-glass"
        style={{ padding: 16, marginBottom: 12 }}
        data-testid="mw-campaign-execution-plan-unavailable"
      >
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          <ListOrdered size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
          Campaign plan
        </div>
        <p className="mw-empty-inline">{plan.unavailableMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="mw-section mw-glass mw-campaign-execution-plan"
      style={{ padding: 16, marginBottom: 12 }}
      data-testid="mw-campaign-execution-plan"
    >
      <div className="mw-section-head" style={{ marginBottom: 12 }}>
        <div className="mw-section-title">
          <ListOrdered size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
          Campaign plan
        </div>
        <span className={itemStatusClass(plan.statusLabel)}>{plan.statusLabel}</span>
      </div>

      <p className="mw-kn-helper" style={{ marginBottom: 8 }}>
        {plan.objective}
      </p>
      <p className="mw-kn-helper" style={{ marginBottom: 12 }}>
        {plan.progressSummary}
      </p>

      {plan.restrictionMessage && (
        <p className="mw-kn-helper" style={{ marginBottom: 12 }}>
          {plan.restrictionMessage}
        </p>
      )}

      {plan.warnings.length > 0 && (
        <ul className="mw-campaign-meta" style={{ marginBottom: 12 }}>
          {plan.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {plan.missingInformation.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="mw-modal-label" style={{ marginBottom: 6 }}>
            Still needed
          </div>
          <ul className="mw-campaign-meta">
            {plan.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.blockers.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="mw-modal-label" style={{ marginBottom: 6 }}>
            Blockers
          </div>
          <ul className="mw-campaign-meta">
            {plan.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.approvalMoments.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="mw-modal-label" style={{ marginBottom: 6 }}>
            Approval moments
          </div>
          <ul className="mw-resp-list">
            {plan.approvalMoments.map((moment) => (
              <li key={`${moment.label}-${moment.description}`} className="mw-resp-row">
                <p className="mw-approval-title">{moment.label}</p>
                <p className="mw-kn-helper">{moment.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.nextPlannedStep && (
        <div className="mw-glass" style={{ padding: 12, marginBottom: 14 }}>
          <div className="mw-modal-label" style={{ marginBottom: 4 }}>
            Next planned step
          </div>
          <p className="mw-approval-title">{plan.nextPlannedStep.title}</p>
          <p className="mw-kn-helper">{plan.nextPlannedStep.description}</p>
        </div>
      )}

      <div className="mw-modal-label" style={{ marginBottom: 8 }}>
        Planned work
      </div>
      <div className="mw-glass mw-project-steps" style={{ padding: 12 }}>
        {plan.workItems.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="mw-step"
            data-testid="mw-campaign-plan-step"
          >
            <span className="mw-step-mark" aria-hidden>
              {item.statusLabel === "Complete" ? "✓" : index + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div className="mw-approval-title">{item.title}</div>
              <p className="mw-kn-helper">{item.description}</p>
              <ul className="mw-campaign-meta" style={{ marginTop: 6 }}>
                <li>{item.phaseLabel}</li>
                <li>{item.statusLabel}</li>
                <li>{item.ownerLabel}</li>
                <li>{item.effortLabel}</li>
                {item.approvalLabel && <li>{item.approvalLabel}</li>}
                {item.channelLabel && <li>Channel: {item.channelLabel}</li>}
                {item.deliverableLabel && <li>Format: {item.deliverableLabel}</li>}
                {item.dependencySummary && <li>{item.dependencySummary}</li>}
                {item.blockerSummary && <li>{item.blockerSummary}</li>}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
