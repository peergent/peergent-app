"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flag, Megaphone } from "lucide-react";
import type { MarketingContentItem } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProjectTimelineEntry } from "@/lib/peer-experience/marketing/projects/types";
import type {
  ProjectConversationEntry,
  ProjectQuestion,
} from "@/lib/peer-experience/marketing/projects/project-experience-types";
import { getContentHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  countDeliverableApprovalStates,
  presentCampaignConciseGoal,
  presentCampaignProgressLabel,
} from "../lib/campaign-detail-presenter";
import { presentCampaignDetailHero } from "../lib/campaign-detail-hero-presenter";
import type { CampaignExecutionPlanViewModel } from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";
import CampaignExecutionPlanSection from "./CampaignExecutionPlanSection";
import CampaignStartCampaignAction from "./CampaignStartCampaignAction";
import CampaignStrategyWorkUnitAction from "./CampaignStrategyWorkUnitAction";
import CampaignCreativeDirectionWorkUnitAction from "./CampaignCreativeDirectionWorkUnitAction";
import CampaignLinkedInPostWorkUnitAction from "./CampaignLinkedInPostWorkUnitAction";
import CampaignEmailWorkUnitAction from "./CampaignEmailWorkUnitAction";
import { findLinkedInPostWorkUnits, findEmailCampaignWorkUnits } from "@/lib/peer-experience/marketing/runtime";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { CampaignExecutionWorkspaceResult } from "@/lib/peer-experience/marketing/campaign-execution";
import type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProjectOrigin } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignOnboardingInput, CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import MarketingPeerCampaignOnboardingModal from "./MarketingPeerCampaignOnboardingModal";
import MarketingPeerOnboardingCard from "./MarketingPeerOnboardingCard";
import MarketingPeerOnboardingIncompleteCard from "./MarketingPeerOnboardingIncompleteCard";
import {
  shouldHideStartCampaignDuringSetup,
  shouldShowCampaignExecutionPlan,
  shouldShowMarketingPeerIncompleteSetup,
  shouldShowMarketingPeerWelcomeCard,
  type CampaignOnboardingUiContext,
} from "../lib/marketing-peer-onboarding-presenter";

export type CampaignDetailMeta = {
  ownerLabel: string;
  campaignTypeLabel: string;
  createdAt: string;
};

export type CampaignDetailSectionsProps = {
  campaign: MarketingCampaignDetailViewModel;
  projectActivity?: readonly MarketingProjectTimelineEntry[];
  campaignMeta?: CampaignDetailMeta;
  contentItems?: readonly MarketingContentItem[];
  contentPeerId?: string;
  peerId?: string;
  questions?: readonly ProjectQuestion[];
  peerName?: string;
  conversation?: readonly ProjectConversationEntry[];
  executionPlan?: CampaignExecutionPlanViewModel | null;
  campaignsEnabled?: boolean;
  projectId?: string;
  projectOrigin?: MarketingProjectOrigin;
  workUnits?: readonly WorkUnit[];
  project?: MarketingProject;
  onStartCampaignExecution?: (projectId: string) => Promise<CampaignExecutionWorkspaceResult>;
  onCompleteCampaignOnboarding?: (
    projectId: string,
    input: CampaignOnboardingInput
  ) => Promise<CampaignOnboardingResult>;
  onExecuteMarketingWorkUnit?: (
    workUnitId: string
  ) => Promise<MarketingWorkUnitExecutionResult>;
  executingWorkUnitId?: string | null;
  campaignStrategy?: import("@/lib/marketing-intelligence").MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
};

function statusChipClass(statusLabel: string): string {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("block")) return "mw-project-status mw-project-status--blocked";
  if (lower.includes("plan")) return "mw-project-status mw-project-status--planning";
  return "mw-project-status";
}

export default function CampaignDetailSections({
  campaign,
  projectActivity,
  campaignMeta,
  contentItems = [],
  contentPeerId,
  peerId,
  questions = [],
  peerName,
  conversation = [],
  executionPlan,
  campaignsEnabled = false,
  projectId,
  projectOrigin,
  workUnits = [],
  project,
  onStartCampaignExecution,
  onCompleteCampaignOnboarding,
  onExecuteMarketingWorkUnit,
  executingWorkUnitId,
  campaignStrategy = null,
  creativeBriefByCampaignId = {},
  linkedinPostByWorkUnitId = {},
  emailByWorkUnitId = {},
}: CampaignDetailSectionsProps) {
  const linkedInPostWorkUnits = useMemo(
    () => (projectId ? findLinkedInPostWorkUnits(projectId, workUnits) : []),
    [projectId, workUnits]
  );

  const emailCampaignWorkUnits = useMemo(
    () => (projectId ? findEmailCampaignWorkUnits(projectId, workUnits) : []),
    [projectId, workUnits]
  );

  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const onboardingCtx: CampaignOnboardingUiContext = useMemo(
    () => ({
      campaignsEnabled,
      projectOrigin,
      projectId: projectId ?? campaign.id,
      workUnits,
      campaignStatus: campaign.status,
      campaignSetup: project?.campaignSetup,
      welcomeDismissed,
    }),
    [
      campaignsEnabled,
      projectOrigin,
      projectId,
      campaign.id,
      campaign.status,
      workUnits,
      project?.campaignSetup,
      welcomeDismissed,
    ]
  );

  const showWelcomeCard = shouldShowMarketingPeerWelcomeCard(onboardingCtx);
  const showIncompleteSetup = shouldShowMarketingPeerIncompleteSetup(onboardingCtx);
  const showExecutionPlan = shouldShowCampaignExecutionPlan(onboardingCtx);
  const hideStartCampaign = shouldHideStartCampaignDuringSetup(onboardingCtx);

  const openSetupFlow = () => setSetupModalOpen(true);

  const hero = useMemo(() => {
    if (!peerId || !peerName || !projectId) {
      return null;
    }
    return presentCampaignDetailHero({
      campaign,
      projectId: projectId ?? campaign.id,
      peerId,
      peerName,
      workUnits,
    });
  }, [campaign, peerId, peerName, projectId, workUnits]);

  const showHeroNextAction =
    hero &&
    (hero.showLinkedNextAction
      ? hero.nextActionLabel.length > 0
      : Boolean(hero.stateLine || hero.nextActionLabel));

  const progressLabel = presentCampaignProgressLabel(campaign);
  const goalLine = presentCampaignConciseGoal(campaign);
  const approvalCounts = countDeliverableApprovalStates(campaign.linkedContent);
  const activityEntries =
    projectActivity && projectActivity.length > 0
      ? projectActivity.map((entry) => ({
          id: entry.id,
          label: entry.label,
          at: entry.at,
        }))
      : campaign.activitySummary;

  const contentDraftIds = new Set(contentItems.map((item) => item.draftId));
  const supplementalLinked = campaign.linkedContent.filter(
    (item) => !contentDraftIds.has(item.id)
  );
  const hasDeliverableContent =
    contentItems.length > 0 || supplementalLinked.length > 0;

  return (
    <section
      className="mw-section mw-campaign-detail"
      data-testid="mw-campaign-detail"
      style={{ animationDelay: "0.02s", marginBottom: 24 }}
    >
      <div className="mw-section-head">
        <div className="mw-section-title">
          <Flag size={15} aria-hidden />
          Campaign
        </div>
      </div>

      <div className="mw-glass mw-detail-hero" style={{ padding: 18, marginBottom: 16 }}>
        <div className="mw-project-head">
          <div>
            <h2 className="mw-detail-title" style={{ fontSize: "1.35rem" }}>
              {campaign.title}
            </h2>
            <div
              className={
                hero?.statusChipVariant === "blocked"
                  ? "mw-project-status mw-project-status--blocked"
                  : hero?.statusChipVariant === "planning"
                    ? "mw-project-status mw-project-status--planning"
                    : statusChipClass(hero?.statusLabel ?? campaign.statusLabel)
              }
              style={{ marginTop: 8 }}
            >
              {hero?.statusLabel ?? campaign.statusLabel}
            </div>
          </div>
          <div className="mw-project-pct">{progressLabel}</div>
        </div>
        {campaign.progressKnown && (
          <div className="mw-project-track" style={{ marginTop: 14 }}>
            <div
              className="mw-project-fill"
              style={{ width: `${Math.min(100, Math.max(0, campaign.progress))}%` }}
            />
          </div>
        )}
        {goalLine && <p className="mw-kn-helper" style={{ marginTop: 12 }}>{goalLine}</p>}
        {campaignsEnabled &&
        projectId &&
        onStartCampaignExecution &&
        !hideStartCampaign ? (
          <div style={{ marginTop: 16 }}>
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
        {hero && showHeroNextAction ? (
          hero.showLinkedNextAction ? (
            <p className="mw-campaign-next" style={{ marginTop: 12 }}>
              Next action:{" "}
              <Link href={hero.nextActionHref} className="mw-section-link">
                {hero.nextActionLabel}
              </Link>
            </p>
          ) : hero.stateLine ? (
            <p className="mw-kn-helper" style={{ marginTop: 12 }}>
              {hero.stateLine}
            </p>
          ) : (
            <p className="mw-kn-helper" style={{ marginTop: 12 }}>
              {hero.nextActionLabel}
            </p>
          )
        ) : null}
      </div>

      {showWelcomeCard && peerName ? (
        <MarketingPeerOnboardingCard
          peerName={peerName}
          onSetUpCampaign={openSetupFlow}
          onSkip={() => setWelcomeDismissed(true)}
        />
      ) : null}

      {showIncompleteSetup && peerName ? (
        <MarketingPeerOnboardingIncompleteCard
          peerName={peerName}
          onContinueSetup={openSetupFlow}
        />
      ) : null}

      {project && onCompleteCampaignOnboarding && peerName ? (
        <MarketingPeerCampaignOnboardingModal
          open={setupModalOpen}
          project={project}
          peerName={peerName}
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

      <div
        id="mw-campaign-overview"
        className="mw-section mw-glass"
        style={{ padding: 16, marginBottom: 12 }}
      >
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Overview
        </div>
        <ul className="mw-campaign-meta">
          {campaign.audience.targetAudience.trim() && (
            <li>Audience: {campaign.audience.targetAudience.trim()}</li>
          )}
          {campaign.channels.length > 0 && (
            <li>Channels: {campaign.channels.join(", ")}</li>
          )}
          {campaign.timeline.summary.trim() && (
            <li>Timeline: {campaign.timeline.summary}</li>
          )}
          <li>Approvals: {campaign.approvalModeLabel}</li>
          {campaign.budgetSummary && <li>Budget: {campaign.budgetSummary}</li>}
        </ul>
        {!campaign.audience.targetAudience.trim() &&
          campaign.channels.length === 0 &&
          !campaign.budgetSummary && (
            <p className="mw-empty-inline">Campaign details will appear as planning progresses.</p>
          )}
      </div>

      {executionPlan && showExecutionPlan ? (
        <CampaignExecutionPlanSection plan={executionPlan} />
      ) : null}

      {projectId && onExecuteMarketingWorkUnit ? (
        <CampaignStrategyWorkUnitAction
          projectId={projectId}
          campaignsEnabled={campaignsEnabled}
          workUnits={workUnits}
          executingWorkUnitId={executingWorkUnitId}
          onExecuteMarketingWorkUnit={onExecuteMarketingWorkUnit}
        />
      ) : null}

      {projectId && onExecuteMarketingWorkUnit ? (
        <CampaignCreativeDirectionWorkUnitAction
          projectId={projectId}
          campaignsEnabled={campaignsEnabled}
          workUnits={workUnits}
          strategy={campaignStrategy}
          executingWorkUnitId={executingWorkUnitId}
          onExecuteMarketingWorkUnit={onExecuteMarketingWorkUnit}
        />
      ) : null}

      {projectId && onExecuteMarketingWorkUnit
        ? linkedInPostWorkUnits.map((linkedinUnit) => (
            <CampaignLinkedInPostWorkUnitAction
              key={linkedinUnit.id}
              projectId={projectId}
              campaignsEnabled={campaignsEnabled}
              workUnit={linkedinUnit}
              workUnits={workUnits}
              strategy={campaignStrategy}
              creativeBriefByCampaignId={creativeBriefByCampaignId}
              linkedinPostByWorkUnitId={linkedinPostByWorkUnitId}
              executingWorkUnitId={executingWorkUnitId}
              onExecuteMarketingWorkUnit={onExecuteMarketingWorkUnit}
            />
          ))
        : null}

      {projectId && onExecuteMarketingWorkUnit
        ? emailCampaignWorkUnits.map((emailUnit) => (
            <CampaignEmailWorkUnitAction
              key={emailUnit.id}
              projectId={projectId}
              campaignsEnabled={campaignsEnabled}
              workUnit={emailUnit}
              workUnits={workUnits}
              strategy={campaignStrategy}
              creativeBriefByCampaignId={creativeBriefByCampaignId}
              emailByWorkUnitId={emailByWorkUnitId}
              executingWorkUnitId={executingWorkUnitId}
              onExecuteMarketingWorkUnit={onExecuteMarketingWorkUnit}
            />
          ))
        : null}

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          <Megaphone size={15} aria-hidden style={{ marginRight: 6, verticalAlign: "middle" }} />
          Deliverables
        </div>
        <p className="mw-kn-helper">{campaign.deliverableSummary}</p>
        {!hasDeliverableContent ? (
          <p className="mw-empty-inline" style={{ marginTop: 8 }}>
            No deliverables yet.
          </p>
        ) : (
          <>
            {contentItems.length > 0 && contentPeerId && (
              <div className="mw-content-grid" style={{ marginTop: 12 }}>
                {contentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={getContentHref(contentPeerId, item.draftId)}
                    className="mw-glass mw-content-card pg-focus-premium"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="mw-content-body">
                      <div className="mw-content-platform">{item.channel}</div>
                      <div className="mw-content-snippet">{item.title}</div>
                      <div className="mw-kn-helper">{item.status.replace(/_/g, " ")}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {supplementalLinked.length > 0 && (
              <ul className="mw-detail-links" style={{ marginTop: 10 }}>
                {supplementalLinked.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="mw-section-link">
                      {item.title} · {item.channelLabel} · {item.statusLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Approvals
        </div>
        {campaign.approvalQueue.pendingCount > 0 ? (
          <>
            <p className="mw-kn-helper">
              Waiting for approval: {campaign.approvalQueue.pendingCount}
            </p>
            {(approvalCounts.approved > 0 || approvalCounts.rejected > 0) && (
              <p className="mw-kn-helper" style={{ marginTop: 6 }}>
                {approvalCounts.approved > 0 && `Approved: ${approvalCounts.approved}`}
                {approvalCounts.approved > 0 && approvalCounts.rejected > 0 && " · "}
                {approvalCounts.rejected > 0 && `Declined: ${approvalCounts.rejected}`}
              </p>
            )}
            <Link
              href={campaign.approvalQueue.reviewHref}
              className="mw-btn-primary pg-focus-premium"
              style={{ marginTop: 12, display: "inline-block" }}
            >
              Review approvals
            </Link>
          </>
        ) : (
          <p className="mw-empty-inline">No items waiting for approval.</p>
        )}
      </div>

      {campaign.workforce.length > 0 && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            Workforce activity
          </div>
          <ul className="mw-resp-list">
            {campaign.workforce.map((worker, index) => (
              <li key={`${worker.roleLabel}-${index}`} className="mw-resp-row">
                <p className="mw-approval-title">{worker.roleLabel}</p>
                <p className="mw-kn-helper">
                  {worker.statusLabel}
                  {worker.responsibility.trim() ? ` · ${worker.responsibility.trim()}` : ""}
                  {worker.completionKnown
                    ? ` · Progress: ${worker.completion}%`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Performance
        </div>
        {campaign.performance.performanceKnown ? (
          <>
            <p className="mw-kn-helper">{campaign.performance.summary}</p>
            <Link href={campaign.performance.performanceHref} className="mw-section-link">
              View performance →
            </Link>
          </>
        ) : (
          <p className="mw-empty-inline">Performance not available yet.</p>
        )}
      </div>

      {campaign.recommendations.length > 0 && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            Recommendations
          </div>
          <ul className="mw-detail-links">
            {campaign.recommendations.map((rec) => (
              <li key={rec.id}>{rec.summary}</li>
            ))}
          </ul>
        </div>
      )}

      {questions.length > 0 && peerName && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }} id="questions">
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            {peerName} has a question
          </div>
          <ul className="mw-resp-list">
            {questions.map((q) => (
              <li key={q.id} className="mw-resp-row">
                <p className="mw-approval-title">{q.prompt}</p>
                {q.context && <p className="mw-kn-helper">{q.context}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Activity
        </div>
        {activityEntries.length === 0 ? (
          <p className="mw-empty-inline">No activity yet.</p>
        ) : (
          <div className="mw-timeline">
            {activityEntries.map((entry) => (
              <div key={entry.id} className="mw-tl-row">
                <div className="mw-tl-dot" aria-hidden />
                <div>
                  <div className="mw-tl-text">{entry.label}</div>
                  {entry.at && (
                    <div className="mw-tl-time">
                      {new Date(entry.at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {campaignMeta && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
          <div className="mw-section-title" style={{ marginBottom: 12 }}>
            Campaign details
          </div>
          <dl className="mw-detail-dl">
            <div>
              <dt>Owner</dt>
              <dd>{campaignMeta.ownerLabel}</dd>
            </div>
            <div>
              <dt>Campaign type</dt>
              <dd>{campaignMeta.campaignTypeLabel}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{new Date(campaignMeta.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      )}

      {conversation.length > 0 && peerName && (
        <div className="mw-section mw-glass" style={{ padding: 16 }}>
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            {peerName}&apos;s workday
          </div>
          <div className="mw-timeline">
            {conversation.slice(0, 6).map((entry) => (
              <div key={entry.id} className="mw-tl-row">
                <div className="mw-tl-dot" aria-hidden />
                <div>
                  <div className="mw-tl-text">&ldquo;{entry.message}&rdquo;</div>
                  <div className="mw-tl-time">{entry.timeLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
