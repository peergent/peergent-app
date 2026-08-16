/**
 * Approval gates — Project Engine workflow checkpoints.
 *
 * Ownership boundary (PX-50.22):
 * - BrainRuntime policy: capability run authorization (completed vs waiting_for_approval)
 * - Project Engine gates: guided-mode cognitive checkpoints + publication boundary only
 * - No duplicate pause for the same cognitive decision in approval_before_publication mode
 */

import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type {
  ApprovalCheckpoint,
  ApprovalCheckpointKind,
  ProjectBrainId,
  ProjectLifecycleState,
} from "./types";
import { requiresPublicationApproval } from "../policy/campaign-approval-policy";

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

const GUIDED_COGNITIVE_GATES = new Set<ApprovalCheckpointKind>([
  "strategy_review",
  "channel_review",
  "deliverable_review",
]);

export function resolveApprovalGate(
  brainId: ProjectBrainId,
  campaignApprovalMode: CampaignApprovalMode = "approval_before_publication"
): ApprovalGateDefinition | null {
  const gate = APPROVAL_GATE_DEFINITIONS.find((g) => g.afterBrain === brainId) ?? null;
  if (!gate) return null;

  if (campaignApprovalMode === "blocked_manual_only") {
    return gate;
  }

  if (campaignApprovalMode === "approval_before_generation") {
    return gate;
  }

  if (campaignApprovalMode === "no_approval_required") {
    return null;
  }

  // approval_before_publication — only publication boundary via PE
  if (GUIDED_COGNITIVE_GATES.has(gate.kind)) {
    return null;
  }

  if (gate.kind === "campaign_approval" && requiresPublicationApproval(campaignApprovalMode)) {
    return gate;
  }

  return null;
}

export function resolvePublicationConfirmGate(): ApprovalGateDefinition {
  return APPROVAL_GATE_DEFINITIONS.find((g) => g.kind === "publication_confirm")!;
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
