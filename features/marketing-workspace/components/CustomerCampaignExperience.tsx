"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CampaignContinuationResult } from "@/lib/peer-experience/marketing/campaign-continuation";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { CampaignOnboardingInput, CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import { buildCampaignReviewViewModel } from "@/lib/peer-experience/marketing/campaign-review";
import { buildCampaignCollaborationViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration";
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
import CampaignStartCampaignAction from "./CampaignStartCampaignAction";
import MarketingPeerCampaignOnboardingModal from "./MarketingPeerCampaignOnboardingModal";
import MarketingPeerOnboardingCard from "./MarketingPeerOnboardingCard";
import MarketingPeerOnboardingIncompleteCard from "./MarketingPeerOnboardingIncompleteCard";
import MarketingPeerPresenceHeader from "./MarketingPeerPresenceHeader";
import CustomerWaitingRow from "./CustomerWaitingRow";
import CustomerPreparedRow from "./CustomerPreparedRow";
import CustomerWorkingNowBlock from "./CustomerWorkingNowBlock";
import CustomerEngagementJourney from "./CustomerEngagementJourney";
import { buildCampaignReviewBuildInput } from "../lib/build-campaign-review-input";
import { buildCampaignCollaborationBuildInput } from "../lib/build-campaign-collaboration-input";
import {
  buildEngagementJourneyPresentation,
  buildPeerPresencePresentation,
  buildWorkingNowPresentation,
  collectAttentionItems,
  collectPreparedCompletedItems,
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

  const attentionItems = useMemo(() => collectAttentionItems(reviewVm), [reviewVm]);
  const preparedItems = useMemo(
    () => collectPreparedCompletedItems(reviewVm),
    [reviewVm]
  );

  const presence = useMemo(
    () =>
      buildPeerPresencePresentation(reviewVm, copy, reviewVm.campaignTitle, {
        continuationRunning: campaignContinuationRunning,
        hideStartCampaign,
        canStartCampaign: Boolean(onStartCampaignExecution),
      }),
    [
      reviewVm,
      copy,
      campaignContinuationRunning,
      hideStartCampaign,
      onStartCampaignExecution,
    ]
  );

  const workingNow = useMemo(
    () => buildWorkingNowPresentation(reviewVm, copy, campaignContinuationRunning),
    [reviewVm, copy, campaignContinuationRunning]
  );

  const journey = useMemo(
    () => buildEngagementJourneyPresentation(reviewVm, copy),
    [reviewVm, copy]
  );

  const firstReviewHref =
    reviewVm.reviewQueue[0] != null
      ? getCampaignReviewItemHref(peerId, projectId, reviewVm.reviewQueue[0].id)
      : null;

  const primaryHref =
    presence.headerKey === "waiting_review" && firstReviewHref ? firstReviewHref : null;

  const primaryAction =
    presence.showStartCampaign && onStartCampaignExecution ? (
      <CampaignStartCampaignAction
        projectId={projectId}
        campaignsEnabled={campaignsEnabled}
        projectOrigin={projectOrigin}
        workUnits={workUnits}
        executionPlan={executionPlan}
        approvalModeLabel={campaign.approvalModeLabel}
        onStartCampaignExecution={onStartCampaignExecution}
        buttonLabel={presence.primaryActionLabel ?? copy.startCampaign}
        className="mw-peer-presence-cta-btn"
      />
    ) : presence.headerKey === "setup" &&
      presence.primaryActionLabel &&
      onCompleteCampaignOnboarding ? (
      <button
        type="button"
        className="mw-btn-primary pg-focus-premium pg-press"
        data-testid="mw-campaign-primary-cta"
        onClick={() => setSetupModalOpen(true)}
      >
        {presence.primaryActionLabel}
      </button>
    ) : primaryHref && presence.primaryActionLabel ? (
      <Link
        href={primaryHref}
        className="mw-btn-primary pg-focus-premium pg-press"
        data-testid="mw-campaign-primary-cta"
      >
        {presence.primaryActionLabel}
      </Link>
    ) : null;

  return (
    <section
      className="mw-section mw-customer-campaign mw-digital-employee"
      data-testid="mw-customer-campaign"
    >
      {reviewCompleteBanner ? (
        <div className="mw-review-complete-banner pg-animate-in" role="status">
          {copy.campaignReviewCompleteBanner}
        </div>
      ) : null}

      <MarketingPeerPresenceHeader
        peerName={domainInput.peerName}
        campaignTitle={reviewVm.campaignTitle}
        presenceKey={presence.key}
        presenceLabel={presence.presenceLabel}
        narrative={presence.narrative}
        primaryAction={primaryAction}
      />

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

      {attentionItems.length > 0 ? (
        <section className="mw-waiting-on-you" aria-labelledby="mw-waiting-heading">
          <h2 id="mw-waiting-heading" className="mw-section-title-minimal">
            {copy.waitingOnYouTitle}
          </h2>
          <div className="mw-waiting-row-list">
            {attentionItems.map((item) => (
              <CustomerWaitingRow
                key={item.id}
                peerId={peerId}
                projectId={projectId}
                item={item}
                copy={copy}
                updatedAt={item.updatedAt ?? item.decidedAt}
              />
            ))}
          </div>
        </section>
      ) : null}

      <CustomerWorkingNowBlock
        peerName={domainInput.peerName}
        copy={copy}
        working={workingNow}
      />

      {preparedItems.length > 0 ? (
        <section className="mw-prepared-ready" aria-labelledby="mw-prepared-heading">
          <h2 id="mw-prepared-heading" className="mw-section-title-minimal">
            {copy.preparedReadyTitle}
          </h2>
          <div className="mw-prepared-row-list">
            {preparedItems.map((item) => (
              <CustomerPreparedRow
                key={item.id}
                peerId={peerId}
                projectId={projectId}
                item={item}
                copy={copy}
              />
            ))}
          </div>
        </section>
      ) : null}

      <CustomerEngagementJourney copy={copy} journey={journey} />

      <footer className="mw-campaign-footer">
        <button
          type="button"
          className="mw-section-link pg-focus-premium"
          onClick={() => setMoreInfoOpen((open) => !open)}
          aria-expanded={moreInfoOpen}
        >
          {copy.moreInformation}
        </button>
        {moreInfoOpen ? (
          <div className="mw-campaign-more-panel">
            <ul className="mw-campaign-meta">
              {collaborationVm.publishTargets.targets.map((target) => (
                <li key={target.id}>
                  {target.label} — {target.description} ({copy.publishComingSoon})
                </li>
              ))}
            </ul>
            <ul className="mw-campaign-meta" style={{ marginTop: 12 }}>
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
          <Link href={getCampaignInspectorHref(peerId, projectId)} className="mw-section-link">
            {copy.technicalDetailsDev}
          </Link>
        ) : null}
        <Link href={getProjectHref(peerId)} className="mw-section-link">
          ← {copy.backToProjects}
        </Link>
      </footer>
    </section>
  );
}
