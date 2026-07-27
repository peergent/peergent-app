"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CampaignContinuationResult } from "@/lib/peer-experience/marketing/campaign-continuation";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { CampaignOnboardingInput, CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import {
  buildCampaignCollaborationViewModel,
  findArtifactCollaboration,
} from "@/lib/peer-experience/marketing/campaign-collaboration";
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
import {
  getMarketingCampaignCopy,
  resolveMarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";
import CampaignContinueCampaignAction from "./CampaignContinueCampaignAction";
import CampaignStartCampaignAction from "./CampaignStartCampaignAction";
import MarketingPeerCampaignOnboardingModal from "./MarketingPeerCampaignOnboardingModal";
import MarketingPeerOnboardingCard from "./MarketingPeerOnboardingCard";
import MarketingPeerOnboardingIncompleteCard from "./MarketingPeerOnboardingIncompleteCard";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import { buildCampaignCollaborationBuildInput } from "../lib/build-campaign-collaboration-input";
import CustomerDeliverableCard from "./CustomerDeliverableCard";
import {
  buildLocalizedCampaignHeader,
  buildSimplifiedCustomerActivity,
  collectAttentionItems,
  collectPreparedOverviewItems,
  currentPhasePresentation,
  presentCampaignPhases,
} from "../lib/customer-campaign-presenter";
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
  localePreference?: string | null;
  onStartCampaignExecution?: (projectId: string) => Promise<CampaignExecutionWorkspaceResult>;
  onCompleteCampaignOnboarding?: (
    projectId: string,
    input: CampaignOnboardingInput
  ) => Promise<CampaignOnboardingResult>;
  onContinueCampaign?: (projectId: string) => Promise<CampaignContinuationResult>;
  campaignContinuationRunning?: boolean;
};

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
  localePreference,
  onStartCampaignExecution,
  onCompleteCampaignOnboarding,
  onContinueCampaign,
  campaignContinuationRunning = false,
}: CustomerCampaignExperienceProps) {
  const searchParams = useSearchParams();
  const reviewCompleteBanner = searchParams.get("campaignReviewComplete") === "1";
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  const locale = resolveMarketingCampaignLocale(localePreference);
  const copy = useMemo(() => getMarketingCampaignCopy(locale), [locale]);

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

  const collaborationVm = useMemo(
    () =>
      buildCampaignCollaborationViewModel(
        buildCampaignCollaborationBuildInput({
          reviewBuildInput: reviewInput,
          reviewVm,
        })
      ),
    [reviewInput, reviewVm]
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

  const getCollab = (workUnitId: string) =>
    findArtifactCollaboration(collaborationVm, workUnitId);

  const attentionItems = useMemo(() => collectAttentionItems(reviewVm), [reviewVm]);
  const preparedOverview = useMemo(
    () => collectPreparedOverviewItems(reviewVm),
    [reviewVm]
  );

  const header = useMemo(
    () =>
      buildLocalizedCampaignHeader(reviewVm, copy, {
        continuationRunning: campaignContinuationRunning,
        hideStartCampaign,
        canStartCampaign: Boolean(onStartCampaignExecution),
        canContinueCampaign: Boolean(onContinueCampaign),
      }),
    [
      reviewVm,
      copy,
      campaignContinuationRunning,
      hideStartCampaign,
      onStartCampaignExecution,
      onContinueCampaign,
    ]
  );

  const phases = useMemo(
    () => presentCampaignPhases(reviewVm.progress.phases, copy),
    [reviewVm.progress.phases, copy]
  );
  const currentPhase = useMemo(() => currentPhasePresentation(phases), [phases]);

  const activity = useMemo(
    () => buildSimplifiedCustomerActivity(reviewVm, copy, campaignContinuationRunning),
    [reviewVm, copy, campaignContinuationRunning]
  );

  const firstReviewHref =
    reviewVm.reviewQueue[0] != null
      ? getCampaignReviewItemHref(peerId, projectId, reviewVm.reviewQueue[0].id)
      : null;

  const primaryHref =
    header.key === "waiting_review" && firstReviewHref ? firstReviewHref : null;

  const showPrimaryLink = Boolean(header.primaryActionLabel && primaryHref);
  const showPrimarySetup =
    header.key === "setup" && header.primaryActionLabel && onCompleteCampaignOnboarding;
  const showPrimaryStart =
    header.showStartCampaign && onStartCampaignExecution && header.primaryActionLabel;

  const hasHeroPrimary = showPrimaryLink || showPrimarySetup || showPrimaryStart;

  const showSecondaryContinue =
    onContinueCampaign &&
    campaignsEnabled &&
    !hasHeroPrimary &&
    header.key === "working";

  const showSecondaryStart =
    campaignsEnabled &&
    onStartCampaignExecution &&
    !hideStartCampaign &&
    header.showStartCampaign &&
    !hasHeroPrimary;

  return (
    <section className="mw-section mw-customer-campaign" data-testid="mw-customer-campaign">
      {reviewCompleteBanner ? (
        <div className="mw-review-complete-banner" role="status">
          {copy.campaignReviewCompleteBanner}
        </div>
      ) : null}

      <header className="mw-glass mw-campaign-hero" data-testid="mw-campaign-hero">
        <h1 className="mw-detail-title">{reviewVm.campaignTitle}</h1>
        <p className="mw-campaign-hero-status" role="status">
          {header.statusLabel}
        </p>
        <p className="mw-campaign-hero-explanation">{header.explanation}</p>
        <p className="mw-campaign-hero-prep">
          {copy.preparationProgress(
            reviewVm.progress.preparedCount,
            reviewVm.progress.totalCount
          )}
        </p>
        {currentPhase ? (
          <p className="mw-kn-helper mw-campaign-hero-phase">
            {copy.campaignPhaseLabel}: {currentPhase.label}
            {currentPhase.state === "current"
              ? ` · ${copy.currentPhaseExplanation(currentPhase.label)}`
              : ""}
          </p>
        ) : null}

        {showPrimaryStart ? (
            <CampaignStartCampaignAction
              projectId={projectId}
              campaignsEnabled={campaignsEnabled}
              projectOrigin={projectOrigin}
              workUnits={workUnits}
              executionPlan={executionPlan}
              approvalModeLabel={campaign.approvalModeLabel}
              onStartCampaignExecution={onStartCampaignExecution}
              buttonLabel={header.primaryActionLabel ?? copy.startCampaign}
              className="mw-campaign-hero-cta"
            />
          ) : showPrimarySetup ? (
            <button
              type="button"
              className="mw-btn-primary mw-campaign-hero-cta pg-focus-premium"
              data-testid="mw-campaign-primary-cta"
              onClick={() => setSetupModalOpen(true)}
            >
              {header.primaryActionLabel}
            </button>
          ) : showPrimaryLink && primaryHref ? (
            <Link
              href={primaryHref}
              className="mw-btn-primary mw-campaign-hero-cta pg-focus-premium"
              data-testid="mw-campaign-primary-cta"
            >
              {header.primaryActionLabel}
            </Link>
          ) : null}
      </header>

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

      <section
        className="mw-section mw-glass mw-campaign-attention"
        aria-labelledby="mw-attention-heading"
      >
        <h2 id="mw-attention-heading" className="mw-section-title">
          {copy.needsAttentionTitle}
        </h2>
        {attentionItems.length === 0 ? (
          <p className="mw-kn-helper">{copy.nothingNeedsAttention}</p>
        ) : (
          <div className="mw-customer-deliverable-grid">
            {attentionItems.map((item) => (
              <CustomerDeliverableCard
                key={item.id}
                peerId={peerId}
                projectId={projectId}
                item={item}
                copy={copy}
                collaborationArtifact={getCollab(item.workUnitId)}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {(activity.currentFocus || activity.latestUpdate || activity.nextStep) && (
        <section className="mw-section mw-glass mw-campaign-activity">
          <h2 className="mw-section-title">{copy.activityTitle}</h2>
          <ul className="mw-campaign-activity-list">
            {activity.currentFocus ? (
              <li>
                <span className="mw-campaign-activity-label">{copy.activityCurrentFocus}</span>
                {activity.currentFocus}
              </li>
            ) : null}
            {activity.latestUpdate ? (
              <li>
                <span className="mw-campaign-activity-label">{copy.activityLatest}</span>
                {activity.latestUpdate}
              </li>
            ) : null}
            {activity.nextStep ? (
              <li>
                <span className="mw-campaign-activity-label">{copy.activityNext}</span>
                {activity.nextStep}
              </li>
            ) : null}
          </ul>
        </section>
      )}

      {showSecondaryContinue ? (
        <div className="mw-campaign-secondary-action">
          <CampaignContinueCampaignAction
            projectId={projectId}
            campaignsEnabled={campaignsEnabled}
            orchestratorInput={orchestratorInput}
            continuationRunning={campaignContinuationRunning}
            manualExecutionDisabled={campaignContinuationRunning}
            onContinueCampaign={onContinueCampaign!}
          />
        </div>
      ) : null}

      {showSecondaryStart ? (
        <div className="mw-campaign-secondary-action">
          <CampaignStartCampaignAction
            projectId={projectId}
            campaignsEnabled={campaignsEnabled}
            projectOrigin={projectOrigin}
            workUnits={workUnits}
            executionPlan={executionPlan}
            approvalModeLabel={campaign.approvalModeLabel}
            onStartCampaignExecution={onStartCampaignExecution!}
          />
        </div>
      ) : null}

      <section className="mw-section mw-glass mw-campaign-prepared">
        <h2 className="mw-section-title">{copy.preparedWorkTitle}</h2>
        {preparedOverview.length === 0 ? (
          <p className="mw-kn-helper">{copy.preparedWorkEmpty}</p>
        ) : (
          <div className="mw-customer-deliverable-grid">
            {preparedOverview.map((item) => (
              <CustomerDeliverableCard
                key={item.id}
                peerId={peerId}
                projectId={projectId}
                item={item}
                copy={copy}
                collaborationArtifact={getCollab(item.workUnitId)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mw-section mw-glass mw-campaign-phases">
        <h2 className="mw-section-title">{copy.campaignProgressTitle}</h2>
        <ol className="mw-campaign-phase-list" aria-label={copy.campaignProgressTitle}>
          {phases.map((phase) => (
            <li
              key={phase.id}
              className={`mw-campaign-phase mw-campaign-phase--${phase.state}`}
            >
              <span className="mw-campaign-phase-name">{phase.label}</span>
              <span className="mw-campaign-phase-state">{phase.stateLabel}</span>
            </li>
          ))}
        </ol>
        <p className="mw-kn-helper mw-campaign-publish-note">{copy.publishingNotAvailableYet}</p>
      </section>

      <section className="mw-section mw-campaign-more">
        <button
          type="button"
          className="mw-section-link pg-focus-premium mw-campaign-more-toggle"
          onClick={() => setMoreInfoOpen((open) => !open)}
          aria-expanded={moreInfoOpen}
        >
          {copy.moreInformation}
        </button>
        {moreInfoOpen ? (
          <div className="mw-glass mw-campaign-more-panel">
            <h3 className="mw-modal-label">{copy.publishDestinationsTitle}</h3>
            <ul className="mw-campaign-meta">
              {collaborationVm.publishTargets.targets.map((target) => (
                <li key={target.id}>
                  {target.label} — {target.description} ({copy.publishComingSoon})
                </li>
              ))}
            </ul>
            <h3 className="mw-modal-label" style={{ marginTop: 16 }}>
              {copy.campaignDetails}
            </h3>
            <ul className="mw-campaign-meta">
              {campaign.audience.targetAudience.trim() ? (
                <li>{copy.audienceLabel(campaign.audience.targetAudience.trim())}</li>
              ) : null}
              {campaign.channels.length > 0 ? (
                <li>{copy.channelsLabel(campaign.channels.join(", "))}</li>
              ) : null}
              <li>{copy.approvalsLabel(campaign.approvalModeLabel)}</li>
            </ul>
          </div>
        ) : null}
        {isMarketingCampaignInspectorEnabled() ? (
          <p className="mw-campaign-dev-link">
            <Link href={getCampaignInspectorHref(peerId, projectId)} className="mw-section-link">
              {copy.technicalDetailsDev}
            </Link>
          </p>
        ) : null}
        <Link href={getProjectHref(peerId)} className="mw-section-link mw-campaign-back">
          ← {copy.backToProjects}
        </Link>
      </section>
    </section>
  );
}
