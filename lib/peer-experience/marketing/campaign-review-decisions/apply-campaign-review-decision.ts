import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

import type { CampaignReviewArtifactType } from "../campaign-review/campaign-review-types";
import { isCustomerReviewRelevant } from "../campaign-review/campaign-review-status";
import {
  findCampaignStrategyWorkUnit,
  findCreativeDirectionWorkUnit,
  resolveMarketingWorkUnitKind,
  isCampaignStrategyWorkUnitReviewReady,
  isCreativeDirectionWorkUnitReviewReady,
  isEmailCampaignWorkUnitReviewReady,
  isLinkedInPostWorkUnitReviewReady,
} from "../runtime/identify-work-unit";
import { getCampaignArtifactVersion } from "./campaign-artifact-version";
import {
  appendCampaignReviewDecisionHistory,
  resolveCurrentCampaignReviewDecision,
} from "./campaign-review-decision-history";
import type {
  ApplyCampaignReviewDecisionInput,
  CampaignArtifactVersionMap,
  CampaignReviewDecision,
  CampaignReviewDecisionHistoryMap,
  CampaignReviewDecisionMap,
  CampaignReviewDecisionResult,
} from "./campaign-review-decision-types";
import { canCampaignContinueAfterReviewDecision } from "./can-campaign-continue-after-review-decision";
import {
  CampaignReviewDecisionError,
  customerMessageForReviewDecisionError,
} from "./errors";
import { validateCampaignReviewFeedback } from "./validate-campaign-review-feedback";

function decisionId(): string {
  return `crd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function resolveArtifactTypeForWorkUnit(input: {
  projectId: string;
  workUnitId: string;
  workUnits: readonly WorkUnit[];
}): CampaignReviewArtifactType | null {
  const strategy = findCampaignStrategyWorkUnit(input.projectId, input.workUnits);
  if (strategy?.id === input.workUnitId) return "campaign_strategy";
  const creative = findCreativeDirectionWorkUnit(input.projectId, input.workUnits);
  if (creative?.id === input.workUnitId) return "creative_direction";
  const unit = input.workUnits.find((u) => u.id === input.workUnitId);
  if (!unit) return null;
  const kind = resolveMarketingWorkUnitKind(unit);
  if (kind === "linkedin_post") return "linkedin_post";
  if (kind === "email_campaign") return "email_campaign";
  return null;
}

function artifactExists(input: {
  artifactType: CampaignReviewArtifactType;
  projectId: string;
  workUnitId: string;
  strategy: MarketingStrategy | null;
  creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
}): boolean {
  switch (input.artifactType) {
    case "campaign_strategy":
      return Boolean(input.strategy?.summary?.trim());
    case "creative_direction":
      return Boolean(
        input.creativeBriefByCampaignId?.[input.projectId]?.campaignGoal.summary?.trim()
      );
    case "linkedin_post":
      return Boolean(input.linkedinPostByWorkUnitId?.[input.workUnitId]?.body?.trim());
    case "email_campaign":
      return Boolean(input.emailByWorkUnitId?.[input.workUnitId]?.body?.trim());
    default:
      return false;
  }
}

function isWorkUnitReviewReady(input: {
  artifactType: CampaignReviewArtifactType;
  projectId: string;
  workUnit: WorkUnit;
}): boolean {
  switch (input.artifactType) {
    case "campaign_strategy":
      return isCampaignStrategyWorkUnitReviewReady(input.workUnit);
    case "creative_direction":
      return isCreativeDirectionWorkUnitReviewReady(input.workUnit);
    case "linkedin_post":
      return isLinkedInPostWorkUnitReviewReady(input.workUnit);
    case "email_campaign":
      return isEmailCampaignWorkUnitReviewReady(input.workUnit);
    default:
      return false;
  }
}

export type ApplyCampaignReviewDecisionContext = {
  readonly approvalMode: CampaignApprovalMode | undefined;
  readonly workUnits: readonly WorkUnit[];
  readonly strategy: MarketingStrategy | null;
  readonly creativeBriefByCampaignId?: Readonly<Record<string, CreativeBrief>>;
  readonly linkedinPostByWorkUnitId?: Readonly<Record<string, MarketingLinkedInPost>>;
  readonly emailByWorkUnitId?: Readonly<Record<string, MarketingEmailCampaign>>;
  readonly decisions: CampaignReviewDecisionMap | undefined;
  readonly decisionHistory: CampaignReviewDecisionHistoryMap | undefined;
  readonly artifactVersions: CampaignArtifactVersionMap | undefined;
};

export type ApplyCampaignReviewDecisionPersist = {
  readonly decisions: CampaignReviewDecisionMap;
  readonly decisionHistory: CampaignReviewDecisionHistoryMap;
};

export function applyCampaignReviewDecision(
  input: ApplyCampaignReviewDecisionInput,
  ctx: ApplyCampaignReviewDecisionContext,
  persist: (next: ApplyCampaignReviewDecisionPersist) => void
): CampaignReviewDecisionResult {
  try {
    const workUnit = ctx.workUnits.find((u) => u.id === input.workUnitId);
    if (!workUnit || workUnit.projectId !== input.projectId) {
      throw new CampaignReviewDecisionError({
        code: "UNKNOWN_ITEM",
        customerMessage: customerMessageForReviewDecisionError("UNKNOWN_ITEM"),
      });
    }

    const resolvedType = resolveArtifactTypeForWorkUnit({
      projectId: input.projectId,
      workUnitId: input.workUnitId,
      workUnits: ctx.workUnits,
    });
    if (!resolvedType || resolvedType !== input.artifactType) {
      throw new CampaignReviewDecisionError({
        code: "SCOPE_MISMATCH",
        customerMessage: customerMessageForReviewDecisionError("SCOPE_MISMATCH"),
      });
    }

    if (
      !artifactExists({
        artifactType: input.artifactType,
        projectId: input.projectId,
        workUnitId: input.workUnitId,
        strategy: ctx.strategy,
        creativeBriefByCampaignId: ctx.creativeBriefByCampaignId,
        linkedinPostByWorkUnitId: ctx.linkedinPostByWorkUnitId,
        emailByWorkUnitId: ctx.emailByWorkUnitId,
      })
    ) {
      throw new CampaignReviewDecisionError({
        code: "ARTIFACT_MISSING",
        customerMessage: customerMessageForReviewDecisionError("ARTIFACT_MISSING"),
      });
    }

    if (!isWorkUnitReviewReady({ artifactType: input.artifactType, projectId: input.projectId, workUnit })) {
      throw new CampaignReviewDecisionError({
        code: "NOT_REVIEWABLE",
        customerMessage: customerMessageForReviewDecisionError("NOT_REVIEWABLE"),
      });
    }

    const currentVersion = getCampaignArtifactVersion(
      input.workUnitId,
      ctx.artifactVersions
    );
    if (input.artifactVersion !== currentVersion) {
      throw new CampaignReviewDecisionError({
        code: "STALE_ARTIFACT_VERSION",
        customerMessage: customerMessageForReviewDecisionError("STALE_ARTIFACT_VERSION"),
      });
    }

    const existing = resolveCurrentCampaignReviewDecision({
      workUnitId: input.workUnitId,
      artifactVersion: currentVersion,
      decisions: ctx.decisions,
    });
    if (existing && existing.decision === input.decision) {
      return {
        ok: true,
        status: "already_decided",
        workUnitId: input.workUnitId,
        decision: existing,
        campaignCanContinue: canCampaignContinueAfterReviewDecision({
          approvalMode: ctx.approvalMode,
          projectId: input.projectId,
          workUnits: ctx.workUnits,
          strategy: ctx.strategy,
          creativeBriefByCampaignId: ctx.creativeBriefByCampaignId,
          linkedinPostByWorkUnitId: ctx.linkedinPostByWorkUnitId,
          emailByWorkUnitId: ctx.emailByWorkUnitId,
          decisions: ctx.decisions,
          artifactVersions: ctx.artifactVersions,
        }),
        message: customerMessageForReviewDecisionError("ALREADY_DECIDED"),
      };
    }

    if (
      existing &&
      existing.decision === "approved" &&
      input.decision !== "approved"
    ) {
      throw new CampaignReviewDecisionError({
        code: "ALREADY_DECIDED",
        customerMessage: customerMessageForReviewDecisionError("ALREADY_DECIDED"),
      });
    }

    const feedbackValidation = validateCampaignReviewFeedback({
      decision: input.decision,
      feedback: input.feedback,
    });
    if (!feedbackValidation.ok) {
      throw new CampaignReviewDecisionError({
        code: "INVALID_FEEDBACK",
        customerMessage: customerMessageForReviewDecisionError("INVALID_FEEDBACK"),
        internalMessage: feedbackValidation.reason,
      });
    }

    if (
      isCustomerReviewRelevant(ctx.approvalMode) === false &&
      input.decision !== "approved"
    ) {
      // Optional review — still allow recording when customer chooses.
    }

    const now = input.decidedAt;
    const decision: CampaignReviewDecision = {
      id: decisionId(),
      organizationId: input.organizationId,
      peerId: input.peerId,
      projectId: input.projectId,
      workUnitId: input.workUnitId,
      artifactType: input.artifactType,
      decision: input.decision,
      feedback: input.feedback,
      artifactVersion: currentVersion,
      decidedBy: input.decidedBy,
      decidedAt: now,
      updatedAt: now,
    };

    const nextDecisions: CampaignReviewDecisionMap = {
      ...(ctx.decisions ?? {}),
      [input.workUnitId]: decision,
    };
    const nextHistory = appendCampaignReviewDecisionHistory(
      ctx.decisionHistory,
      input.workUnitId,
      decision
    );

    try {
      persist({ decisions: nextDecisions, decisionHistory: nextHistory });
    } catch {
      throw new CampaignReviewDecisionError({
        code: "PERSISTENCE_FAILED",
        customerMessage: customerMessageForReviewDecisionError("PERSISTENCE_FAILED"),
      });
    }

    const campaignCanContinue = canCampaignContinueAfterReviewDecision({
      approvalMode: ctx.approvalMode,
      projectId: input.projectId,
      workUnits: ctx.workUnits,
      strategy: ctx.strategy,
      creativeBriefByCampaignId: ctx.creativeBriefByCampaignId,
      linkedinPostByWorkUnitId: ctx.linkedinPostByWorkUnitId,
      emailByWorkUnitId: ctx.emailByWorkUnitId,
      decisions: nextDecisions,
      artifactVersions: ctx.artifactVersions,
    });

    const status =
      input.decision === "approved"
        ? "approved"
        : input.decision === "rejected"
          ? "rejected"
          : "changes_requested";

    const message =
      input.decision === "approved"
        ? "Approved."
        : input.decision === "rejected"
          ? "Rejected."
          : "Changes requested.";

    return {
      ok: true,
      status,
      workUnitId: input.workUnitId,
      decision,
      campaignCanContinue,
      message,
    };
  } catch (error) {
    if (error instanceof CampaignReviewDecisionError) {
      return {
        ok: false,
        status: "invalid",
        workUnitId: input.workUnitId,
        campaignCanContinue: false,
        message: error.customerMessage,
      };
    }
    return {
      ok: false,
      status: "failed",
      workUnitId: input.workUnitId,
      campaignCanContinue: false,
      message: customerMessageForReviewDecisionError("PERSISTENCE_FAILED"),
    };
  }
}
