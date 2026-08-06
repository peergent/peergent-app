import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { MarketingProject } from "../projects/types";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import { buildCampaignReviewViewModel } from "../campaign-review/build-campaign-review-view-model";
import type { CampaignReviewBuildInput } from "../campaign-review/campaign-review-types";
import { buildCampaignExecutiveBriefing } from "../campaign-review/build-campaign-executive-briefing";
import type {
  CampaignApprovalHistoryMap,
  CampaignApprovalMap,
  CampaignApprovalResult,
} from "./campaign-approval-types";
import { applyCampaignApproval } from "./apply-campaign-approval";
import { computeCampaignPackageVersion } from "./compute-campaign-package-version";
import { isCampaignApprovalPending, isCampaignApprovalValid } from "./campaign-approval-validation";
import { persistCampaignApprovalDurably } from "../campaign-execution/persist-campaign-approval-durably";
import { buildCampaignExecutionCorrelation } from "../campaign-execution/campaign-execution-correlation";
import { seedCampaignPublicationState } from "../campaign-execution/continue-campaign-with-execution";
import { resolveCampaignRunForProject } from "../campaign-execution/campaign-run-store";

export type CampaignApprovalWorkspaceSnapshot = {
  readonly peerId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly projects: readonly MarketingProject[];
  readonly domainInput: MarketingPeerDomainInput;
};

export type CampaignApprovalWorkspaceCommit = {
  readonly campaignApprovalByProjectId?: CampaignApprovalMap;
  readonly campaignApprovalHistoryByProjectId?: CampaignApprovalHistoryMap;
  readonly activityFeed?: ActivityFeedItem[];
};

export type CampaignApprovalHandlerDeps = {
  readonly getSnapshot: () => CampaignApprovalWorkspaceSnapshot;
  readonly commit: (patch: CampaignApprovalWorkspaceCommit) => void;
  readonly logActivity: (item: ActivityFeedItem) => void;
  readonly createActivity: typeof import("@/lib/marketing-workspace").createActivity;
  readonly continueCampaign: (projectId: string) => Promise<
    import("../campaign-continuation").CampaignContinuationResult
  >;
  readonly approvalActionInFlight: { current: string | null };
};

function buildReviewInputForApproval(
  snap: CampaignApprovalWorkspaceSnapshot,
  project: MarketingProject
): CampaignReviewBuildInput {
  return {
    peerId: snap.peerId,
    peerName: snap.domainInput.peerName,
    projectId: project.id,
    project,
    campaignDetail: {
      id: project.id,
      title: project.title,
      status: "planning",
      statusLabel: "Planning",
      goal: { businessObjective: project.goal },
      audience: { targetAudience: project.campaignSetup?.confirmedAudience ?? "" },
      channels: [],
      timeline: { summary: "" },
      approvalModeLabel: "",
      approvalQueue: { pendingCount: 0 },
      deliverableSummary: "",
      progress: 0,
      progressKnown: false,
      linkedContent: [],
      activitySummary: [],
    } as unknown as CampaignReviewBuildInput["campaignDetail"],
    workUnits: snap.domainInput.workUnits,
    strategy: snap.domainInput.strategy,
    creativeBriefByCampaignId: snap.domainInput.creativeBriefByCampaignId,
    linkedinPostByWorkUnitId: snap.domainInput.linkedinPostByWorkUnitId,
    emailByWorkUnitId: snap.domainInput.emailByWorkUnitId,
    approvalMode: project.campaignSetup?.approvalMode,
    campaignsEnabled: true,
    onboardingComplete: Boolean(project.campaignSetup?.onboardingCompletedAt),
    hasExecutionWork: snap.domainInput.workUnits.some((u) => u.projectId === project.id),
    domainInput: snap.domainInput,
    campaignReviewDecisionByWorkUnitId: snap.domainInput.campaignReviewDecisionByWorkUnitId,
    campaignReviewDecisionHistoryByWorkUnitId:
      snap.domainInput.campaignReviewDecisionHistoryByWorkUnitId,
    campaignArtifactVersionByWorkUnitId: snap.domainInput.campaignArtifactVersionByWorkUnitId,
    campaignApprovalByProjectId: snap.domainInput.campaignApprovalByProjectId,
  };
}

export function campaignApprovalAuditDescription(input: {
  campaignContextVersion: number;
  brainOutputVersion: string;
  briefingVersion: string;
  campaignPackageVersion: string;
  approvalMode: string;
}): string {
  return [
    `contextVersion=${input.campaignContextVersion}`,
    `brainOutputVersion=${input.brainOutputVersion}`,
    `briefingVersion=${input.briefingVersion}`,
    `packageVersion=${input.campaignPackageVersion}`,
    `approvalMode=${input.approvalMode}`,
  ].join("; ");
}

export async function approveCampaign(
  deps: CampaignApprovalHandlerDeps,
  input: { projectId: string }
): Promise<CampaignApprovalResult> {
  if (deps.approvalActionInFlight.current) {
    return {
      ok: false,
      status: "failed",
      projectId: input.projectId,
      publicationUnlocked: false,
      continuationStarted: false,
      message: "Marketing Peer is already processing an approval.",
    };
  }

  deps.approvalActionInFlight.current = input.projectId;
  try {
    const snap = deps.getSnapshot();
    const project = snap.projects.find((p) => p.id === input.projectId);
    if (!project) {
      return {
        ok: false,
        status: "invalid",
        projectId: input.projectId,
        publicationUnlocked: false,
        continuationStarted: false,
        message: "This campaign could not be found.",
      };
    }

    const approvalMode = project.campaignSetup?.approvalMode ?? "approval_before_publication";
    const reviewInput = buildReviewInputForApproval(snap, project);
    const reviewVm = buildCampaignReviewViewModel(reviewInput);
    const executiveBriefing =
      reviewVm.executiveBriefing ??
      buildCampaignExecutiveBriefing({
        project,
        domainInput: snap.domainInput,
        allReviewItems: reviewVm.allReviewItems,
        approvalMode,
      });

    if (!executiveBriefing) {
      return {
        ok: false,
        status: "not_ready",
        projectId: input.projectId,
        publicationUnlocked: false,
        continuationStarted: false,
        message: "The management briefing is not ready for approval yet.",
      };
    }

    const packageVersion = computeCampaignPackageVersion({
      project,
    });

    const existingApproval = snap.domainInput.campaignApprovalByProjectId?.[input.projectId];
    if (isCampaignApprovalValid(existingApproval, packageVersion)) {
      return {
        ok: true,
        status: "already_approved",
        projectId: input.projectId,
        approval: existingApproval,
        publicationUnlocked: true,
        continuationStarted: false,
        message: "This campaign package is already approved.",
      };
    }

    if (
      !isCampaignApprovalPending({
        project,
        allReviewItems: reviewVm.allReviewItems,
        approvalMode,
        campaignApproval: existingApproval,
        executiveBriefing,
      })
    ) {
      return {
        ok: false,
        status: "not_ready",
        projectId: input.projectId,
        publicationUnlocked: false,
        continuationStarted: false,
        message: "The management briefing is not ready for approval yet.",
      };
    }

    const decidedAt = new Date().toISOString();
    const applyResult = applyCampaignApproval(
      {
        organizationId: snap.organizationId,
        peerId: snap.peerId,
        projectId: input.projectId,
        approvalMode,
        packageVersion,
        approvedBy: snap.userId,
        approvedAt: decidedAt,
      },
      {
        approvals: snap.domainInput.campaignApprovalByProjectId ?? {},
        history: snap.domainInput.campaignApprovalHistoryByProjectId ?? {},
      },
      (next) => {
        deps.commit({
          campaignApprovalByProjectId: next.approvals,
          campaignApprovalHistoryByProjectId: next.history,
        });
        persistCampaignApprovalDurably(snap.peerId, {
          campaignApprovalByProjectId: next.approvals,
          campaignApprovalHistoryByProjectId: next.history,
        });
      }
    );

    if (!applyResult.ok || !applyResult.approval) {
      return {
        ok: false,
        status: "failed",
        projectId: input.projectId,
        publicationUnlocked: false,
        continuationStarted: false,
        message: applyResult.message,
      };
    }

    const run = resolveCampaignRunForProject({
      peerId: snap.peerId,
      organizationId: snap.organizationId,
      project,
      approval: applyResult.approval,
    });

    seedCampaignPublicationState({
      peerId: snap.peerId,
      projectId: input.projectId,
      campaignRunId: run.campaignRunId,
      approvalId: applyResult.approval.id,
      hasApproval: true,
    });

    const correlation = buildCampaignExecutionCorrelation({
      projectId: input.projectId,
      organizationId: snap.organizationId,
      campaignRunId: run.campaignRunId,
      approvalId: applyResult.approval.id,
    });

    deps.logActivity(
      deps.createActivity(
        "campaign_approved",
        "Campaign approved",
        [
          campaignApprovalAuditDescription({
            campaignContextVersion: packageVersion.campaignContextVersion,
            brainOutputVersion: packageVersion.brainOutputVersion,
            briefingVersion: packageVersion.briefingVersion,
            campaignPackageVersion: packageVersion.campaignPackageVersion,
            approvalMode,
          }),
          `approvalId=${applyResult.approval.id}`,
        ].join("; "),
        { relatedObject: project.title, correlation }
      )
    );

    let continuationStarted = false;
    if (applyResult.status === "approved") {
      await deps.continueCampaign(input.projectId);
      continuationStarted = true;
    }

    return {
      ok: true,
      status: applyResult.status,
      projectId: input.projectId,
      approval: applyResult.approval,
      publicationUnlocked: true,
      continuationStarted,
      message: applyResult.message,
    };
  } finally {
    deps.approvalActionInFlight.current = null;
  }
}
