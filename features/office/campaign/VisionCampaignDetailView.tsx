"use client";

import Link from "next/link";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { officeHref } from "@/lib/office/links";
import CampaignWorkspaceCore from "./CampaignWorkspaceCore";
import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";

export type VisionCampaignDetailViewProps = {
  model: CampaignDetailViewModel;
  locale?: string | null;
  onStepClick?: (step: CampaignWorkflowStep) => void;
  onReviewDeliverable?: (draftId: string) => void;
  onNextStepCta?: () => void;
  onApproveAll?: () => void;
  onSchedule?: () => void;
  onPublishDemo?: () => void;
  onSkipWebsite?: () => void;
  onOpenWebsiteModal?: () => void;
  onEditWebsite?: () => void;
  onSkipCompetitors?: () => void;
  onOpenCompetitorModal?: () => void;
  onOpenOptimization?: () => void;
  progressMessage?: string | null;
};

export default function VisionCampaignDetailView({
  model,
  locale,
  onStepClick,
  onReviewDeliverable,
  onNextStepCta,
  onApproveAll,
  onSchedule,
  onPublishDemo,
  onSkipWebsite,
  onOpenWebsiteModal,
  onEditWebsite,
  onSkipCompetitors,
  onOpenCompetitorModal,
  onOpenOptimization,
  progressMessage,
}: VisionCampaignDetailViewProps) {
  const nl = locale === "nl";

  return (
    <div data-testid="office-campaign-detail-view" data-campaign-id={model.projectId}>
      <Link
        href={officeHref(model.peerId, "work")}
        className="pg-v13-btn pg-v13-btn--ghost mb-6 inline-flex no-underline"
      >
        {nl ? "← Terug naar Werk" : "← Back to Work"}
      </Link>

      <p className="pg-v13-eyebrow">{nl ? "Campagne" : "Campaign"}</p>
      <h1 className="pg-v13-title">{model.name}</h1>
      {progressMessage ? (
        <p
          className="pg-v13-mono mt-2 text-[11px] font-bold text-[var(--pg-v13-blue)]"
          data-testid="campaign-progress-message"
        >
          {progressMessage}
        </p>
      ) : (
        <p className="pg-v13-mono mt-2 text-[11px] font-bold text-[var(--pg-v13-attention)]">
          {model.statusLabel}
        </p>
      )}

      <CampaignWorkspaceCore
        model={model}
        locale={locale}
        variant="page"
        onStepClick={onStepClick}
        onReviewDeliverable={onReviewDeliverable}
        onNextStepCta={onNextStepCta}
        onApproveAll={onApproveAll}
        onSchedule={onSchedule}
        onPublishDemo={onPublishDemo}
        onSkipWebsite={onSkipWebsite}
        onOpenWebsiteModal={onOpenWebsiteModal}
        onEditWebsite={onEditWebsite}
        onSkipCompetitors={onSkipCompetitors}
        onOpenCompetitorModal={onOpenCompetitorModal}
        onOpenOptimization={onOpenOptimization}
        onOpenSchedule={onSchedule}
      />
    </div>
  );
}
