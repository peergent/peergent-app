import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainExecutionMode } from "./approval-policy";
import {
  classifyActionProposal,
  hasExternalActionProposals,
  resolveCapabilityActionClass,
  type BrainActionClass,
} from "./action-class";
import type { BrainActionProposal } from "../evidence/structured-output";

export type BrainPolicyReasonCode =
  | "capability_exempt"
  | "cognitive_autonomous"
  | "external_requires_approval"
  | "guided_cognitive_checkpoint"
  | "manual_mode"
  | "blocked_manual_only"
  | "full_autonomy_external"
  | "default_require_approval";

export type CampaignBrainPolicyContext = {
  campaignApprovalMode: CampaignApprovalMode;
  capabilityId: BrainCapabilityId;
  actionProposals?: readonly BrainActionProposal[];
};

export type ResolvedCampaignBrainPolicy = {
  executionMode: BrainExecutionMode;
  actionClass: BrainActionClass;
  campaignApprovalMode: CampaignApprovalMode;
  capabilityId: BrainCapabilityId;
};

/** Canonical mapper — single source for campaign mode → Brain execution semantics. */
export function resolveCampaignBrainPolicy(input: {
  campaignApprovalMode?: CampaignApprovalMode;
  capabilityId: BrainCapabilityId;
}): ResolvedCampaignBrainPolicy {
  const campaignApprovalMode = input.campaignApprovalMode ?? "approval_before_publication";
  return {
    campaignApprovalMode,
    capabilityId: input.capabilityId,
    actionClass: resolveCapabilityActionClass(input.capabilityId),
    executionMode: executionModeForCampaignMode(campaignApprovalMode),
  };
}

export function executionModeForCampaignMode(
  mode: CampaignApprovalMode
): BrainExecutionMode {
  switch (mode) {
    case "approval_before_generation":
    case "blocked_manual_only":
      return "manual";
    case "no_approval_required":
      return "fully_automatic";
    case "approval_before_publication":
    default:
      return "semi_automatic";
  }
}

export function requiresGuidedCognitiveCheckpoint(
  mode: CampaignApprovalMode,
  capabilityId: BrainCapabilityId
): boolean {
  if (mode !== "approval_before_generation" && mode !== "blocked_manual_only") {
    return false;
  }
  return (
    capabilityId === "strategy" ||
    capabilityId === "channel_planning" ||
    capabilityId === "creative_generation"
  );
}

export function requiresPublicationApproval(mode: CampaignApprovalMode): boolean {
  return mode === "approval_before_publication" || mode === "approval_before_generation";
}

export function evaluateCampaignBrainPolicy(
  input: CampaignBrainPolicyContext
): {
  decision: "allow" | "require_approval" | "block";
  reason: string;
  reasonCode: BrainPolicyReasonCode;
  willPause: boolean;
  canAutoResume: boolean;
} {
  const mode = input.campaignApprovalMode ?? "approval_before_publication";
  const actionClass = resolveCapabilityActionClass(input.capabilityId);
  const externalProposals = hasExternalActionProposals(input.actionProposals ?? []);

  if (mode === "blocked_manual_only") {
    return {
      decision: "block",
      reason: "Campaign is in manual-only mode.",
      reasonCode: "blocked_manual_only",
      willPause: true,
      canAutoResume: false,
    };
  }

  if (actionClass === "external" || input.capabilityId === "execution") {
    if (mode === "no_approval_required") {
      return {
        decision: "allow",
        reason: "Full autonomy permits external execution where capability safety allows.",
        reasonCode: "full_autonomy_external",
        willPause: false,
        canAutoResume: true,
      };
    }
    return {
      decision: "require_approval",
      reason: "External action requires customer approval.",
      reasonCode: "external_requires_approval",
      willPause: true,
      canAutoResume: true,
    };
  }

  if (requiresGuidedCognitiveCheckpoint(mode, input.capabilityId)) {
    return {
      decision: "require_approval",
      reason: "Guided mode requires review before this generated campaign work.",
      reasonCode: "guided_cognitive_checkpoint",
      willPause: true,
      canAutoResume: true,
    };
  }

  if (externalProposals) {
    return {
      decision: "require_approval",
      reason: "Output includes external action proposals requiring approval.",
      reasonCode: "external_requires_approval",
      willPause: true,
      canAutoResume: true,
    };
  }

  return {
    decision: "allow",
    reason: "Cognitive work may proceed autonomously for this campaign mode.",
    reasonCode: "cognitive_autonomous",
    willPause: false,
    canAutoResume: true,
  };
}

export function shouldPauseRunForPolicy(input: {
  policyDecision: "allow" | "require_approval" | "block";
  actionProposals: readonly BrainActionProposal[];
  capabilityId: BrainCapabilityId;
  campaignApprovalMode?: CampaignApprovalMode;
}): boolean {
  if (input.policyDecision === "block") return true;
  if (input.policyDecision === "require_approval") return true;
  if (input.policyDecision === "allow") {
    const mode = input.campaignApprovalMode ?? "approval_before_publication";
    if (mode === "no_approval_required") return false;
    return input.actionProposals.some(
      (p) =>
        p.requiresApproval &&
        classifyActionProposal(p) === "external" &&
        resolveCapabilityActionClass(input.capabilityId) === "cognitive"
    );
  }
  return false;
}
