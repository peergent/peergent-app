import type { ActivityFeedItem } from "@/lib/marketing-workspace";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "../projects/types";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import {
  applyCampaignReviewDecision,
  activityTitleForReviewDecision,
  buildReviewFeedbackTaskHintAppendix,
  bumpCampaignArtifactVersion,
  campaignReviewBlocksContinuation,
  reopenMarketingWorkUnitForRevision,
  type CampaignReviewDecisionResult,
  type CampaignReviewFeedback,
  type CampaignReviewRejectionReason,
} from "./index";
import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import { getCampaignArtifactVersion } from "./campaign-artifact-version";
import {
  findCampaignStrategyWorkUnit,
  findCreativeDirectionWorkUnit,
  resolveMarketingWorkUnitKind,
} from "../runtime/identify-work-unit";

export type CampaignReviewWorkspaceSnapshot = {
  readonly peerId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly projects: readonly MarketingProject[];
  readonly workUnits: readonly WorkUnit[];
  readonly domainInput: MarketingPeerDomainInput;
};

function resolveReviewArtifactMeta(input: {
  projectId: string;
  workUnitId: string;
  workUnits: readonly WorkUnit[];
  artifactVersions?: MarketingPeerDomainInput["campaignArtifactVersionByWorkUnitId"];
}): {
  artifactType: CampaignReviewArtifactType;
  artifactVersion: number;
} | null {
  const strategy = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (strategy?.id === input.workUnitId) {
    return {
      artifactType: "campaign_strategy",
      artifactVersion: getCampaignArtifactVersion(input.workUnitId, input.artifactVersions),
    };
  }
  const creative = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  if (creative?.id === input.workUnitId) {
    return {
      artifactType: "creative_direction",
      artifactVersion: getCampaignArtifactVersion(input.workUnitId, input.artifactVersions),
    };
  }
  const unit = input.workUnits.find((u) => u.id === input.workUnitId);
  if (!unit) return null;
  const kind = resolveMarketingWorkUnitKind(unit);
  if (kind === "linkedin_post") {
    return {
      artifactType: "linkedin_post",
      artifactVersion: getCampaignArtifactVersion(input.workUnitId, input.artifactVersions),
    };
  }
  if (kind === "email_campaign") {
    return {
      artifactType: "email_campaign",
      artifactVersion: getCampaignArtifactVersion(input.workUnitId, input.artifactVersions),
    };
  }
  return null;
}

export type CampaignReviewWorkspaceCommit = {
  readonly campaignReviewDecisionByWorkUnitId?: Record<
    string,
    import("./campaign-review-decision-types").CampaignReviewDecision
  >;
  readonly campaignReviewDecisionHistoryByWorkUnitId?: Record<
    string,
    readonly import("./campaign-review-decision-types").CampaignReviewDecision[]
  >;
  readonly campaignArtifactVersionByWorkUnitId?: Record<string, number>;
  readonly workUnits?: WorkUnit[];
  readonly activityFeed?: ActivityFeedItem[];
};

export type CampaignReviewHandlerDeps = {
  readonly getSnapshot: () => CampaignReviewWorkspaceSnapshot;
  readonly commit: (patch: CampaignReviewWorkspaceCommit) => void;
  readonly logActivity: (item: ActivityFeedItem) => void;
  readonly createActivity: typeof import("@/lib/marketing-workspace").createActivity;
  readonly executeWorkUnit: (
    workUnitId: string,
    options?: {
      fromCampaignContinuation?: boolean;
      forceRegenerate?: boolean;
      reviewFeedbackTaskHint?: string;
    }
  ) => Promise<import("../runtime").MarketingWorkUnitExecutionResult>;
  readonly continueCampaign: (projectId: string) => Promise<
    import("../campaign-continuation").CampaignContinuationResult
  >;
  readonly reviewActionInFlight: { current: string | null };
};

function findReviewItem(
  snap: CampaignReviewWorkspaceSnapshot,
  projectId: string,
  workUnitId: string
): {
  artifactType: CampaignReviewArtifactType;
  artifactVersion: number;
} | null {
  return resolveReviewArtifactMeta({
    projectId,
    workUnitId,
    workUnits: snap.workUnits,
    artifactVersions: snap.domainInput.campaignArtifactVersionByWorkUnitId,
  });
}

export async function approveCampaignReviewItem(
  deps: CampaignReviewHandlerDeps,
  input: {
    projectId: string;
    workUnitId: string;
    autoContinue?: boolean;
  }
): Promise<CampaignReviewDecisionResult & { nextReviewItemId?: string }> {
  if (deps.reviewActionInFlight.current) {
    return {
      ok: false,
      status: "failed",
      workUnitId: input.workUnitId,
      campaignCanContinue: false,
      message: "Marketing Peer is already working on this item.",
    };
  }

  deps.reviewActionInFlight.current = input.workUnitId;
  try {
    const snap = deps.getSnapshot();
    const project = snap.projects.find((p) => p.id === input.projectId);
    const meta = findReviewItem(snap, input.projectId, input.workUnitId);
    if (!project || !meta) {
      return {
        ok: false,
        status: "invalid",
        workUnitId: input.workUnitId,
        campaignCanContinue: false,
        message: "This review item could not be found.",
      };
    }

    const decidedAt = new Date().toISOString();
    const result = applyCampaignReviewDecision(
      {
        organizationId: snap.organizationId,
        peerId: snap.peerId,
        projectId: input.projectId,
        workUnitId: input.workUnitId,
        artifactType: meta.artifactType,
        artifactVersion: meta.artifactVersion,
        decision: "approved",
        decidedBy: snap.userId,
        decidedAt,
      },
      {
        approvalMode: project.campaignSetup?.approvalMode,
        workUnits: snap.workUnits,
        strategy: snap.domainInput.strategy,
        creativeBriefByCampaignId: snap.domainInput.creativeBriefByCampaignId,
        linkedinPostByWorkUnitId: snap.domainInput.linkedinPostByWorkUnitId,
        emailByWorkUnitId: snap.domainInput.emailByWorkUnitId,
        decisions: snap.domainInput.campaignReviewDecisionByWorkUnitId,
        decisionHistory: snap.domainInput.campaignReviewDecisionHistoryByWorkUnitId,
        artifactVersions: snap.domainInput.campaignArtifactVersionByWorkUnitId,
      },
      (next) => {
        deps.commit({
          campaignReviewDecisionByWorkUnitId: { ...next.decisions },
          campaignReviewDecisionHistoryByWorkUnitId: { ...next.decisionHistory },
        });
      }
    );

    if (result.ok && result.decision) {
      deps.logActivity(
        deps.createActivity(
          "plan_completed",
          activityTitleForReviewDecision({
            artifactType: meta.artifactType,
            decision: "approved",
          }),
          result.message,
          { relatedObject: project.title }
        )
      );
    }

    if (
      result.ok &&
      input.autoContinue &&
      project.campaignSetup?.approvalMode === "approval_before_generation" &&
      result.campaignCanContinue
    ) {
      await deps.continueCampaign(input.projectId);
    }

    return result;
  } finally {
    deps.reviewActionInFlight.current = null;
  }
}

export function requestCampaignReviewChanges(
  deps: CampaignReviewHandlerDeps,
  input: {
    projectId: string;
    workUnitId: string;
    feedback: CampaignReviewFeedback;
  }
): CampaignReviewDecisionResult {
  if (deps.reviewActionInFlight.current) {
    return {
      ok: false,
      status: "failed",
      workUnitId: input.workUnitId,
      campaignCanContinue: false,
      message: "Marketing Peer is already working on this item.",
    };
  }

  deps.reviewActionInFlight.current = input.workUnitId;
  try {
    const snap = deps.getSnapshot();
    const project = snap.projects.find((p) => p.id === input.projectId);
    const meta = findReviewItem(snap, input.projectId, input.workUnitId);
    if (!project || !meta) {
      return {
        ok: false,
        status: "invalid",
        workUnitId: input.workUnitId,
        campaignCanContinue: false,
        message: "This review item could not be found.",
      };
    }

    const decidedAt = new Date().toISOString();
    const result = applyCampaignReviewDecision(
      {
        organizationId: snap.organizationId,
        peerId: snap.peerId,
        projectId: input.projectId,
        workUnitId: input.workUnitId,
        artifactType: meta.artifactType,
        artifactVersion: meta.artifactVersion,
        decision: "changes_requested",
        feedback: input.feedback,
        decidedBy: snap.userId,
        decidedAt,
      },
      {
        approvalMode: project.campaignSetup?.approvalMode,
        workUnits: snap.workUnits,
        strategy: snap.domainInput.strategy,
        creativeBriefByCampaignId: snap.domainInput.creativeBriefByCampaignId,
        linkedinPostByWorkUnitId: snap.domainInput.linkedinPostByWorkUnitId,
        emailByWorkUnitId: snap.domainInput.emailByWorkUnitId,
        decisions: snap.domainInput.campaignReviewDecisionByWorkUnitId,
        decisionHistory: snap.domainInput.campaignReviewDecisionHistoryByWorkUnitId,
        artifactVersions: snap.domainInput.campaignArtifactVersionByWorkUnitId,
      },
      (next) => {
        const unit = snap.workUnits.find((u) => u.id === input.workUnitId);
        const nextUnits = unit
          ? snap.workUnits.map((u) =>
              u.id === input.workUnitId
                ? reopenMarketingWorkUnitForRevision(
                    u,
                    "Customer requested changes during campaign review."
                  )
                : u
            )
          : [...snap.workUnits];

        deps.commit({
          campaignReviewDecisionByWorkUnitId: { ...next.decisions },
          campaignReviewDecisionHistoryByWorkUnitId: { ...next.decisionHistory },
          workUnits: nextUnits,
        });
      }
    );

    if (result.ok && result.decision) {
      deps.logActivity(
        deps.createActivity(
          "plan_completed",
          activityTitleForReviewDecision({
            artifactType: meta.artifactType,
            decision: "changes_requested",
          }),
          result.message,
          { relatedObject: project.title }
        )
      );
    }

    return result;
  } finally {
    deps.reviewActionInFlight.current = null;
  }
}

export function rejectCampaignReviewItem(
  deps: CampaignReviewHandlerDeps,
  input: {
    projectId: string;
    workUnitId: string;
    rejectionReason: CampaignReviewRejectionReason;
    message?: string;
  }
): CampaignReviewDecisionResult {
  if (deps.reviewActionInFlight.current) {
    return {
      ok: false,
      status: "failed",
      workUnitId: input.workUnitId,
      campaignCanContinue: false,
      message: "Marketing Peer is already working on this item.",
    };
  }

  deps.reviewActionInFlight.current = input.workUnitId;
  try {
    const snap = deps.getSnapshot();
    const project = snap.projects.find((p) => p.id === input.projectId);
    const meta = findReviewItem(snap, input.projectId, input.workUnitId);
    if (!project || !meta) {
      return {
        ok: false,
        status: "invalid",
        workUnitId: input.workUnitId,
        campaignCanContinue: false,
        message: "This review item could not be found.",
      };
    }

    const decidedAt = new Date().toISOString();
    const result = applyCampaignReviewDecision(
      {
        organizationId: snap.organizationId,
        peerId: snap.peerId,
        projectId: input.projectId,
        workUnitId: input.workUnitId,
        artifactType: meta.artifactType,
        artifactVersion: meta.artifactVersion,
        decision: "rejected",
        feedback: {
          rejectionReason: input.rejectionReason,
          message: input.message,
        },
        decidedBy: snap.userId,
        decidedAt,
      },
      {
        approvalMode: project.campaignSetup?.approvalMode,
        workUnits: snap.workUnits,
        strategy: snap.domainInput.strategy,
        creativeBriefByCampaignId: snap.domainInput.creativeBriefByCampaignId,
        linkedinPostByWorkUnitId: snap.domainInput.linkedinPostByWorkUnitId,
        emailByWorkUnitId: snap.domainInput.emailByWorkUnitId,
        decisions: snap.domainInput.campaignReviewDecisionByWorkUnitId,
        decisionHistory: snap.domainInput.campaignReviewDecisionHistoryByWorkUnitId,
        artifactVersions: snap.domainInput.campaignArtifactVersionByWorkUnitId,
      },
      (next) => {
        deps.commit({
          campaignReviewDecisionByWorkUnitId: { ...next.decisions },
          campaignReviewDecisionHistoryByWorkUnitId: { ...next.decisionHistory },
        });
      }
    );

    if (result.ok && result.decision) {
      deps.logActivity(
        deps.createActivity(
          "plan_completed",
          activityTitleForReviewDecision({
            artifactType: meta.artifactType,
            decision: "rejected",
          }),
          result.message,
          { relatedObject: project.title }
        )
      );
    }

    return result;
  } finally {
    deps.reviewActionInFlight.current = null;
  }
}

export async function reviseCampaignReviewItem(
  deps: CampaignReviewHandlerDeps,
  input: { projectId: string; workUnitId: string }
): Promise<{ ok: boolean; message: string }> {
  if (deps.reviewActionInFlight.current) {
    return {
      ok: false,
      message: "Marketing Peer is already working on this item.",
    };
  }

  deps.reviewActionInFlight.current = input.workUnitId;
  try {
    const snap = deps.getSnapshot();
    const decision =
      snap.domainInput.campaignReviewDecisionByWorkUnitId?.[input.workUnitId];
    if (!decision || decision.decision === "approved") {
      return { ok: false, message: "This item is not ready for revision." };
    }

    const { nextMap } = bumpCampaignArtifactVersion(
      input.workUnitId,
      snap.domainInput.campaignArtifactVersionByWorkUnitId
    );
    deps.commit({ campaignArtifactVersionByWorkUnitId: nextMap });

    const feedbackHint = buildReviewFeedbackTaskHintAppendix(decision.feedback);
    const exec = await deps.executeWorkUnit(input.workUnitId, {
      forceRegenerate: true,
      reviewFeedbackTaskHint: feedbackHint,
    });

    if (!exec.ok) {
      return {
        ok: false,
        message: exec.message ?? "Marketing Peer could not revise this item. Try again.",
      };
    }

    return { ok: true, message: "Updated version is ready for your review." };
  } finally {
    deps.reviewActionInFlight.current = null;
  }
}

export function hasPendingRequiredCampaignReview(
  snap: CampaignReviewWorkspaceSnapshot,
  projectId: string
): boolean {
  const project = snap.projects.find((p) => p.id === projectId);
  if (!project) return false;
  return campaignReviewBlocksContinuation({
    approvalMode: project.campaignSetup?.approvalMode,
    projectId,
    workUnits: snap.workUnits,
    strategy: snap.domainInput.strategy,
    creativeBriefByCampaignId: snap.domainInput.creativeBriefByCampaignId,
    linkedinPostByWorkUnitId: snap.domainInput.linkedinPostByWorkUnitId,
    emailByWorkUnitId: snap.domainInput.emailByWorkUnitId,
    decisions: snap.domainInput.campaignReviewDecisionByWorkUnitId,
    artifactVersions: snap.domainInput.campaignArtifactVersionByWorkUnitId,
  });
}
