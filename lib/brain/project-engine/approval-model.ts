/**
 * Approval gates — engine pauses; Brains never bypass customer approval.
 */

import type {
  ApprovalCheckpoint,
  ApprovalCheckpointKind,
  ProjectBrainId,
  ProjectLifecycleState,
} from "./types";

export type ApprovalGateDefinition = {
  kind: ApprovalCheckpointKind;
  afterBrain: ProjectBrainId | null;
  atState: ProjectLifecycleState;
  unblocksState: ProjectLifecycleState;
  customerSummaryEn: string;
  customerSummaryNl: string;
};

export const APPROVAL_GATE_DEFINITIONS: readonly ApprovalGateDefinition[] = [
  {
    kind: "strategy_review",
    afterBrain: "strategy",
    atState: "strategizing",
    unblocksState: "planning",
    customerSummaryEn: "Review Emma's strategy before planning begins.",
    customerSummaryNl: "Review Emma's strategie voordat planning start.",
  },
  {
    kind: "channel_review",
    afterBrain: "planning",
    atState: "planning",
    unblocksState: "generating",
    customerSummaryEn: "Confirm channel selection and budget allocation.",
    customerSummaryNl: "Bevestig kanaalkeuze en budgetverdeling.",
  },
  {
    kind: "deliverable_review",
    afterBrain: "creative",
    atState: "generating",
    unblocksState: "validating",
    customerSummaryEn: "Review deliverables before validation.",
    customerSummaryNl: "Review deliverables voordat validatie start.",
  },
  {
    kind: "campaign_approval",
    afterBrain: "validation",
    atState: "validating",
    unblocksState: "ready_to_publish",
    customerSummaryEn: "Approve the full campaign package for publication.",
    customerSummaryNl: "Keur het volledige campagnepakket goed voor publicatie.",
  },
  {
    kind: "publication_confirm",
    afterBrain: null,
    atState: "ready_to_publish",
    unblocksState: "publishing",
    customerSummaryEn: "Confirm publication schedule and channels.",
    customerSummaryNl: "Bevestig publicatieschema en kanalen.",
  },
];

export function resolveApprovalGate(brainId: ProjectBrainId): ApprovalGateDefinition | null {
  return APPROVAL_GATE_DEFINITIONS.find((g) => g.afterBrain === brainId) ?? null;
}

export function createApprovalCheckpoint(
  gate: ApprovalGateDefinition,
  nl: boolean,
  now: Date
): ApprovalCheckpoint {
  return {
    id: `approval-${gate.kind}-${now.getTime()}`,
    kind: gate.kind,
    requiredAt: gate.atState,
    satisfied: false,
    satisfiedAt: null,
    unblocksState: gate.unblocksState,
    customerSummary: nl ? gate.customerSummaryNl : gate.customerSummaryEn,
  };
}

export function satisfyApprovalCheckpoint(
  checkpoint: ApprovalCheckpoint,
  now: Date
): ApprovalCheckpoint {
  return {
    ...checkpoint,
    satisfied: true,
    satisfiedAt: now.toISOString(),
  };
}
