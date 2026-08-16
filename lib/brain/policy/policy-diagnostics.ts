import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { ApprovalCheckpointKind } from "../project-engine/types";
import type { BrainActionClass } from "./action-class";
import type { BrainPolicyReasonCode } from "./campaign-approval-policy";
import type { BrainExecutionMode } from "./approval-policy";
import type { BrainApprovalRequirement } from "../capabilities/registry";

export type BrainPolicyDecisionDiagnostic = {
  organizationId: string;
  campaignId?: string;
  capabilityId: BrainCapabilityId;
  actionClass: BrainActionClass;
  campaignApprovalMode: CampaignApprovalMode;
  executionMode: BrainExecutionMode;
  capabilityApprovalRequirement: BrainApprovalRequirement;
  policyDecision: string;
  policyReasonCode: BrainPolicyReasonCode;
  projectCheckpointKind?: ApprovalCheckpointKind | null;
  willPause: boolean;
  canAutoResume: boolean;
};

export function emitBrainPolicyDecisionDiagnostic(
  diagnostic: BrainPolicyDecisionDiagnostic
): void {
  if (process.env.NODE_ENV === "production" && !process.env.BRAIN_POLICY_DIAGNOSTICS) {
    return;
  }
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      domain: "brain_policy",
      event: "brain_policy_decision",
      organizationId: diagnostic.organizationId,
      campaignId: diagnostic.campaignId ?? null,
      capabilityId: diagnostic.capabilityId,
      actionClass: diagnostic.actionClass,
      campaignApprovalMode: diagnostic.campaignApprovalMode,
      executionMode: diagnostic.executionMode,
      capabilityApprovalRequirement: diagnostic.capabilityApprovalRequirement,
      policyDecision: diagnostic.policyDecision,
      policyReasonCode: diagnostic.policyReasonCode,
      projectCheckpointKind: diagnostic.projectCheckpointKind ?? null,
      willPause: diagnostic.willPause,
      canAutoResume: diagnostic.canAutoResume,
    })
  );
}
