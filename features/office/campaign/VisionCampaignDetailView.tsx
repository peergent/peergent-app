"use client";

import Link from "next/link";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { officeHref } from "@/lib/office/links";
import CampaignWorkspaceCore from "./CampaignWorkspaceCore";
import OfficeExecutiveCampaignReview from "./OfficeExecutiveCampaignReview";
import type { CampaignWorkflowStep, CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { CampaignApprovalResult } from "@/lib/peer-experience/marketing/campaign-approval";

export type VisionCampaignDetailViewProps = {
  model: CampaignDetailViewModel;
  locale?: string | null;
  executiveBriefing?: ExecutiveCampaignBriefing | null;
  executiveBriefingPendingApproval?: boolean;
  campaignPublicationUnlocked?: boolean;
  onApproveCampaign?: (input: { projectId: string }) => Promise<CampaignApprovalResult>;
  onWorkflowStepOpen?: (stepId: CampaignWorkflowStepId) => void;
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
  onRetryStrategy?: () => void;
  onViewCampaignContext?: () => void;
  progressMessage?: string | null;
};

export default function VisionCampaignDetailView({
  model,
  locale,
  executiveBriefing,
  executiveBriefingPendingApproval = false,
  campaignPublicationUnlocked = false,
  onApproveCampaign,
  onWorkflowStepOpen,
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
  onRetryStrategy,
  onViewCampaignContext,
  progressMessage,
}: VisionCampaignDetailViewProps) {
  const nl = locale === "nl";
  const showExecutiveBriefing = executiveBriefing != null;

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

      {showExecutiveBriefing ? (
        <OfficeExecutiveCampaignReview
          briefing={executiveBriefing}
          pendingApproval={executiveBriefingPendingApproval}
          publicationUnlocked={campaignPublicationUnlocked}
          projectId={model.projectId}
          locale={locale}
          onApproveCampaign={onApproveCampaign}
          onWorkflowStepOpen={onWorkflowStepOpen}
        />
      ) : null}

      <CampaignWorkspaceCore
        model={model}
        locale={locale}
        variant="page"
        executiveBriefingActive={showExecutiveBriefing}
        executiveBriefingPendingApproval={executiveBriefingPendingApproval}
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
        onRetryStrategy={onRetryStrategy}
        onViewCampaignContext={onViewCampaignContext}
      />
    </div>
  );
}
