"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CampaignContinuationResult } from "@/lib/peer-experience/marketing/campaign-continuation";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { CampaignOnboardingInput, CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import type { CampaignReviewItem } from "@/lib/peer-experience/marketing/campaign-review";
import { isMarketingCampaignInspectorEnabled } from "@/lib/peer-experience/marketing/campaign-inspector-guard";
import {
  getCampaignInspectorHref,
  getCampaignReviewItemHref,
  getProjectHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import CampaignContinueCampaignAction from "./CampaignContinueCampaignAction";
import CampaignStartCampaignAction from "./CampaignStartCampaignAction";
import MarketingPeerCampaignOnboardingModal from "./MarketingPeerCampaignOnboardingModal";
import MarketingPeerOnboardingCard from "./MarketingPeerOnboardingCard";
import MarketingPeerOnboardingIncompleteCard from "./MarketingPeerOnboardingIncompleteCard";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import {
  shouldHideStartCampaignDuringSetup,
  shouldShowMarketingPeerIncompleteSetup,
  shouldShowMarketingPeerWelcomeCard,
  type CampaignOnboardingUiContext,
} from "../lib/marketing-peer-onboarding-presenter";

export type CustomerCampaignExperienceProps = {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  campaign: MarketingCampaignDetailViewModel;
  project: MarketingProject;
  projectOrigin?: MarketingProjectOrigin;
  workUnits: readonly WorkUnit[];
  campaignsEnabled: boolean;
  executionPlan?: CampaignExecutionPlanViewModel | null;
  onStartCampaignExecution?: (projectId: string) => Promise<CampaignExecutionWorkspaceResult>;
  onCompleteCampaignOnboarding?: (
    projectId: string,
    input: CampaignOnboardingInput
  ) => Promise<CampaignOnboardingResult>;
  onContinueCampaign?: (projectId: string) => Promise<CampaignContinuationResult>;
  campaignContinuationRunning?: boolean;
};

function ReviewItemCard({
  peerId,
  projectId,
  item,
}: {
  peerId: string;
  projectId: string;
  item: CampaignReviewItem;
}) {
  return (
    <div className="mw-glass mw-customer-review-card" style={{ padding: 14 }}>
      <p className="mw-kn-helper">{item.artifactTypeLabel}</p>
      <p className="mw-approval-title">{item.title}</p>
      <p className="mw-kn-helper">{item.shortSummary}</p>
      <p className="mw-kn-helper">{item.statusLabel}</p>
      {item.preview ? (
        <Link
          href={getCampaignReviewItemHref(peerId, projectId, item.id)}
          className="mw-section-link pg-focus-premium"
          style={{ marginTop: 10, display: "inline-block" }}
        >
          Review
        </Link>
      ) : null}
    </div>
  );
}

export default function CustomerCampaignExperience({
  peerId,
  projectId,
  domainInput,
  campaign,
  project,
  projectOrigin,
  workUnits,
  campaignsEnabled,
  executionPlan,
  onStartCampaignExecution,
  onCompleteCampaignOnboarding,
  onContinueCampaign,
  campaignContinuationRunning = false,
}: CustomerCampaignExperienceProps) {
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const reviewInput = useMemo(
    () =>
      buildCampaignReviewBuildInput({
        peerId,
        projectId,
        domainInput,
        campaignDetail: campaign,
        project,
        campaignsEnabled,
        continuationRunning: campaignContinuationRunning,
        activeWorkUnitId: domainInput.activeWorkUnitId,
      }),
    [
      peerId,
      projectId,
      domainInput,
      campaign,
      project,
      campaignsEnabled,
      campaignContinuationRunning,
    ]
  );

  const reviewVm = useMemo(
    () => buildCampaignReviewViewModel(reviewInput),
    [reviewInput]
  );

  const onboardingCtx: CampaignOnboardingUiContext = useMemo(
    () => ({
      campaignsEnabled,
      projectOrigin,
      projectId,
      workUnits,
      campaignStatus: campaign.status,
      campaignSetup: project.campaignSetup,
      welcomeDismissed,
    }),
    [
      campaignsEnabled,
      projectOrigin,
      projectId,
      workUnits,
      campaign.status,
      project.campaignSetup,
      welcomeDismissed,
    ]
  );

  const showWelcomeCard = shouldShowMarketingPeerWelcomeCard(onboardingCtx);
  const showIncompleteSetup = shouldShowMarketingPeerIncompleteSetup(onboardingCtx);
  const hideStartCampaign = shouldHideStartCampaignDuringSetup(onboardingCtx);

  const orchestratorInput = useMemo(
    () => ({
      projectId,
      workUnits,
      strategy: domainInput.strategy,
      creativeBriefByCampaignId: domainInput.creativeBriefByCampaignId,
    }),
    [projectId, workUnits, domainInput.strategy, domainInput.creativeBriefByCampaignId]
  );

  const firstReviewHref =
    reviewVm.reviewQueue[0] != null
      ? getCampaignReviewItemHref(peerId, projectId, reviewVm.reviewQueue[0].id)
      : null;

  return (
    <section className="mw-section mw-customer-campaign" data-testid="mw-customer-campaign">
      <div className="mw-glass mw-detail-hero" style={{ padding: 18, marginBottom: 16 }}>
        <h1 className="mw-detail-title">{reviewVm.campaignTitle}</h1>
        <p className="mw-project-status mw-project-status--planning" role="status">
          {reviewVm.campaignStatusLabel}
        </p>
        <p className="mw-kn-helper" style={{ marginTop: 8 }}>
          {reviewVm.progress.preparedCount} of {reviewVm.progress.totalCount} items prepared
        </p>
        <div className="mw-project-track" style={{ marginTop: 10 }}>
          <div
            className="mw-project-fill"
            style={{ width: `${reviewVm.progress.percent}%` }}
          />
        </div>
        <p className="mw-kn-helper" style={{ marginTop: 12 }}>
          {campaignContinuationRunning
            ? "Marketing Peer is continuing your campaign..."
            : reviewVm.customerSummary}
        </p>
        {firstReviewHref && reviewVm.primaryActionLabel ? (
          <Link
            href={firstReviewHref}
            className="mw-btn-primary pg-focus-premium"
            style={{ marginTop: 14, display: "inline-block", textDecoration: "none" }}
          >
            {reviewVm.primaryActionLabel}
          </Link>
        ) : null}
      </div>

      {showWelcomeCard ? (
        <MarketingPeerOnboardingCard
          peerName={domainInput.peerName}
          onSetUpCampaign={() => setSetupModalOpen(true)}
          onSkip={() => setWelcomeDismissed(true)}
        />
      ) : null}
      {showIncompleteSetup ? (
        <MarketingPeerOnboardingIncompleteCard
          peerName={domainInput.peerName}
          onContinueSetup={() => setSetupModalOpen(true)}
        />
      ) : null}
      {onCompleteCampaignOnboarding ? (
        <MarketingPeerCampaignOnboardingModal
          open={setupModalOpen}
          project={project}
          peerName={domainInput.peerName}
          campaignGoal={campaign.goal.businessObjective || project.goal}
          approvalModeLabel={campaign.approvalModeLabel}
          onClose={() => setSetupModalOpen(false)}
          onSkipForNow={() => {
            setSetupModalOpen(false);
            setWelcomeDismissed(true);
          }}
          onComplete={onCompleteCampaignOnboarding}
        />
      ) : null}

      <section className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <h2 className="mw-section-title">Needs your attention</h2>
        {reviewVm.reviewQueue.length > 0 ? (
          <>
            <p className="mw-kn-helper" role="status">
              {reviewVm.attentionMessage}
            </p>
            <div className="mw-customer-review-grid" style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {reviewVm.reviewQueue.map((item) => (
                <ReviewItemCard key={item.id} peerId={peerId} projectId={projectId} item={item} />
              ))}
            </div>
          </>
        ) : (
          <p className="mw-kn-helper">Nothing needs your attention right now.</p>
        )}
      </section>

      <section className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <h2 className="mw-section-title">Marketing Peer activity</h2>
        <ul className="mw-campaign-meta">
          <li>Current focus: {reviewVm.activitySummary.currentFocus}</li>
          {reviewVm.activitySummary.recentlyCompleted ? (
            <li>Recently completed: {reviewVm.activitySummary.recentlyCompleted}</li>
          ) : null}
          {reviewVm.activitySummary.upNext ? (
            <li>Up next: {reviewVm.activitySummary.upNext}</li>
          ) : null}
        </ul>
      </section>

      {onContinueCampaign ? (
        <CampaignContinueCampaignAction
          projectId={projectId}
          campaignsEnabled={campaignsEnabled}
          orchestratorInput={orchestratorInput}
          continuationRunning={campaignContinuationRunning}
          manualExecutionDisabled={campaignContinuationRunning}
          onContinueCampaign={onContinueCampaign}
        />
      ) : null}

      {campaignsEnabled && onStartCampaignExecution && !hideStartCampaign ? (
        <div style={{ marginBottom: 12 }}>
          <CampaignStartCampaignAction
            projectId={projectId}
            campaignsEnabled={campaignsEnabled}
            projectOrigin={projectOrigin}
            workUnits={workUnits}
            executionPlan={executionPlan}
            approvalModeLabel={campaign.approvalModeLabel}
            onStartCampaignExecution={onStartCampaignExecution}
          />
        </div>
      ) : null}

      <section className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <h2 className="mw-section-title">Prepared work</h2>
        {reviewVm.preparedItems.length === 0 && reviewVm.reviewQueue.length === 0 ? (
          <p className="mw-kn-helper">Prepared deliverables will appear here.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {[...reviewVm.reviewQueue, ...reviewVm.preparedItems]
              .filter(
                (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
              )
              .map((item) => (
                <ReviewItemCard key={item.id} peerId={peerId} projectId={projectId} item={item} />
              ))}
          </div>
        )}
      </section>

      <section className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <h2 className="mw-section-title">Campaign progress</h2>
        <nav aria-label="Campaign progress">
          <ol className="mw-detail-phases">
            {reviewVm.progress.phases.map((phase) => (
              <li
                key={phase.id}
                className={`mw-detail-phase${phase.complete ? " mw-detail-phase--done" : ""}${phase.current ? " mw-detail-phase--current" : ""}`}
              >
                {phase.label}
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section className="mw-section" style={{ marginBottom: 24 }}>
        <button
          type="button"
          className="mw-section-link pg-focus-premium"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
        >
          View campaign details
        </button>
        {detailsOpen ? (
          <div className="mw-glass" style={{ padding: 16, marginTop: 12 }}>
            <ul className="mw-campaign-meta">
              {campaign.audience.targetAudience.trim() ? (
                <li>Audience: {campaign.audience.targetAudience.trim()}</li>
              ) : null}
              {campaign.channels.length > 0 ? (
                <li>Channels: {campaign.channels.join(", ")}</li>
              ) : null}
              <li>Approvals: {campaign.approvalModeLabel}</li>
            </ul>
          </div>
        ) : null}
        {isMarketingCampaignInspectorEnabled() ? (
          <p style={{ marginTop: 12 }}>
            <Link href={getCampaignInspectorHref(peerId, projectId)} className="mw-section-link">
              Technical details (development)
            </Link>
          </p>
        ) : null}
        <Link href={getProjectHref(peerId)} className="mw-section-link" style={{ display: "block", marginTop: 12 }}>
          ← Back to projects
        </Link>
      </section>
    </section>
  );
}
