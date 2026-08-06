"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { V17CampaignDetailViewModel } from "@/lib/customer-v17/build-v17-campaign-detail-view-model";
import ExecutiveCampaignBriefingPanel from "@/features/marketing-workspace/components/ExecutiveCampaignBriefingPanel";
import V17CampaignApprovalActions from "./V17CampaignApprovalActions";
import { buildExecutiveBriefingStepHref } from "@/features/marketing-workspace/lib/build-executive-briefing-step-href";
import type { CampaignApprovalResult } from "@/lib/peer-experience/marketing/campaign-approval";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";

export default function V17CampaignDetailView({
  model,
  onApproveCampaign,
}: {
  model: V17CampaignDetailViewModel;
  onApproveCampaign?: (input: { projectId: string }) => Promise<CampaignApprovalResult>;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const copy = model.copy;

  return (
    <div className="v17-campaign-detail" data-testid="v17-campaign-detail">
      <Link href={model.backHref} className="v17-detail-back pg-focus-premium">
        {model.backLabel}
      </Link>

      <header className="v17-campaign-hero">
        <div className="v17-campaign-hero-top">
          <div>
            <h1 className="v17-page-title">{model.title}</h1>
            <div className="v17-campaign-meta">
              <span className="v17-status-tag v17-status-tag--lg">{model.statusTag}</span>
              {model.dateRangeLine ? <span className="v17-campaign-meta-item">{model.dateRangeLine}</span> : null}
            </div>
            {model.goalLine ? (
              <p className="v17-page-support">
                {model.copy.detailsTitle === "Campagnedetails" ? "Doel: " : "Goal: "}
                {model.goalLine}
              </p>
            ) : null}
          </div>
        </div>
        {model.summaryLine ? <p className="v17-campaign-summary">{model.summaryLine}</p> : null}
        {model.primaryCta ? (
          <Link href={model.primaryCta.href} className="v17-btn v17-btn--primary pg-focus-premium">
            {model.primaryCta.label}
          </Link>
        ) : null}
      </header>

      {model.reviewHeading ? (
        <section className="v17-detail-card v17-detail-card--attention">
          <h2 className="v17-detail-card-title v17-detail-card-title--attn">{model.reviewHeading}</h2>
          {model.reviewSubline ? <p className="v17-page-support">{model.reviewSubline}</p> : null}
          {model.reviewRows.map((row) => (
            <div key={row.id} className="v17-review-row">
              <div>
                <p className="v17-review-row-title">{row.title}</p>
                <p className="v17-review-row-meta">
                  {row.statusLabel}
                  {row.dateLabel ? ` · ${row.dateLabel}` : ""}
                </p>
              </div>
              <Link
                href={row.reviewHref}
                className="v17-btn v17-btn--primary v17-btn--sm pg-focus-premium"
              >
                {copy.reviewCta}
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {model.executiveBriefing ? (
        <div id="executive-briefing">
          <ExecutiveCampaignBriefingPanel
            briefing={model.executiveBriefing}
            locale={model.locale === "nl" ? "nl" : "en"}
            buildStepHref={(stepId) =>
              buildExecutiveBriefingStepHref({
                peerId: model.peerId,
                projectId: model.projectId,
                stepId: stepId as CampaignWorkflowStepId,
                allReviewItems: model.allReviewItems,
              })
            }
          />
          <V17CampaignApprovalActions
            projectId={model.projectId}
            pendingApproval={model.executiveBriefingPendingApproval}
            publicationUnlocked={model.campaignPublicationUnlocked}
            locale={model.locale === "nl" ? "nl" : "en"}
            onApproveCampaign={onApproveCampaign}
          />
        </div>
      ) : null}

      {(model.progressLine || model.currentPhaseLabel || model.nextStepLine) && (
        <section className="v17-detail-card">
          <h2 className="v17-detail-card-title">{model.progressTitle}</h2>
          {model.progressLine ? <p className="v17-campaign-progress-line">{model.progressLine}</p> : null}
          {model.currentPhaseLabel ? (
            <p className="v17-page-support">
              <strong>{copy.currentPhase}:</strong> {model.currentPhaseLabel}
            </p>
          ) : null}
          {model.nextStepLine ? (
            <p className="v17-page-support">
              <strong>{copy.nextStep}:</strong> {model.nextStepLine}
            </p>
          ) : null}
        </section>
      )}

      {model.deliverables.length > 0 ? (
        <section className="v17-detail-card">
          <h2 className="v17-detail-card-title">{model.deliverablesTitle}</h2>
          {model.deliverables.map((row) => (
            <div key={row.id} className="v17-deliverable-row">
              <div>
                <p className="v17-review-row-title">{row.title}</p>
                <p className="v17-review-row-meta">
                  {row.statusLabel}
                  {row.updatedLabel ? ` · ${row.updatedLabel}` : ""}
                </p>
              </div>
              <Link href={row.href} className="v17-btn v17-btn--ghost v17-btn--sm pg-focus-premium">
                {row.actionLabel}
              </Link>
            </div>
          ))}
        </section>
      ) : null}

      {model.completedItems.length > 0 ? (
        <section className="v17-detail-card">
          <h2 className="v17-eyebrow v17-completed-eyebrow">{model.completedTitle}</h2>
          {model.completedItems.map((item) => (
            <div key={item.id} className="v17-done-row">
              <span className="v17-done-ico" aria-hidden>
                ✓
              </span>
              <span className="v17-done-label">{item.label}</span>
            </div>
          ))}
          {model.historyHref ? (
            <Link href={model.historyHref} className="v17-see-all pg-focus-premium">
              {copy.viewHistory}
            </Link>
          ) : null}
        </section>
      ) : null}

      {model.detailRows.length > 0 ? (
        <section className="v17-detail-card v17-details-disclosure">
          <button
            type="button"
            className="v17-details-toggle pg-focus-premium"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
          >
            <span>{model.detailsTitle}</span>
            <ChevronDown size={16} className={detailsOpen ? "v17-chevron-open" : undefined} aria-hidden />
          </button>
          {detailsOpen ? (
            <dl className="v17-details-dl">
              {model.detailRows.map((row) => (
                <div key={row.label} className="v17-details-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      {model.inspectorHref && model.inspectorLabel ? (
        <p className="v17-inspector-link">
          <Link href={model.inspectorHref} className="v17-see-all pg-focus-premium">
            {model.inspectorLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
