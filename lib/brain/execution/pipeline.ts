import type { BrainActionProposal } from "../evidence/structured-output";
import type { BrainPolicyResult } from "../policy/approval-policy";

/** Execution pipeline contract — reasoning → proposal → policy → approval → execution → audit. */
export type BrainExecutionPhase =
  | "reasoning"
  | "proposal"
  | "policy"
  | "approval"
  | "execution"
  | "audit";

export type BrainExecutionPipelineState = {
  phase: BrainExecutionPhase;
  proposals: readonly BrainActionProposal[];
  policyResults: readonly BrainPolicyResult[];
  approvedProposalIds: readonly string[];
  auditRecordIds: readonly string[];
};

export function createExecutionPipelineState(): BrainExecutionPipelineState {
  return {
    phase: "reasoning",
    proposals: [],
    policyResults: [],
    approvedProposalIds: [],
    auditRecordIds: [],
  };
}
