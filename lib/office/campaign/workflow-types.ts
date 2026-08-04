import type { CampaignApprovalMode } from "@/lib/campaign";

/** How Emma executes — same UI, different behaviour. */
export type CampaignExecutionMode = "manual" | "semi_automatic" | "fully_automatic";

export type CampaignWorkflowStepState = "done" | "active" | "upcoming" | "skipped";

export type CampaignWorkflowStepId =
  | "business_analyzed"
  | "website_analyzed"
  | "competitors_analyzed"
  | "strategy_determined"
  | "channels_selected"
  | "deliverables_created"
  | "waiting_for_approval"
  | "scheduled"
  | "published"
  | "optimizing";

export type CampaignEvidenceSection = {
  id: string;
  title: string;
  items: readonly string[];
};

export type CampaignWorkflowStep = {
  id: CampaignWorkflowStepId;
  label: string;
  state: CampaignWorkflowStepState;
  /** Customer-facing hint e.g. Overgeslagen, Wacht op goedkeuring */
  statusHint?: string;
  /** When done or active, step can open evidence. */
  hasEvidence: boolean;
  evidenceTitle: string;
  evidenceIntro?: string;
  evidenceSections: readonly CampaignEvidenceSection[];
  /** When true, customer must supply missing context before advancing. */
  evidenceBlocked?: boolean;
  evidenceMissingCtas?: readonly import("./evidence-readiness").EvidenceMissingCta[];
};

export type CampaignDeliverableStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type CampaignDeliverable = {
  id: string;
  draftId: string;
  label: string;
  channelLabel: string;
  status: CampaignDeliverableStatus;
  statusLabel: string;
  objective?: string;
  previewHref: string;
  detailHref: string;
  reviewable: boolean;
};

export type CampaignApprovalItem = {
  id: string;
  draftId: string;
  label: string;
  channelLabel: string;
  description?: string;
  previewHref: string;
  detailHref: string;
};

export type CampaignWorkflowViewModel = {
  executionMode: CampaignExecutionMode;
  executionModeLabel: string;
  nextStep: string;
  nextStepCta: {
    label: string;
    action:
      | "review"
      | "approve_strategy"
      | "approve_channels"
      | "approve_deliverables"
      | "schedule"
      | "publish_demo"
      | "view_published"
      | "view_analytics"
      | "open_optimization"
      | "continue"
      | "add_context"
      | "add_website"
      | "add_competitors"
      | "working"
      | "retry_strategy"
      | "view_context";
    draftId?: string;
    stepId?: CampaignWorkflowStepId;
    workingStage?: string;
    runStatus?: import("./strategy-run-types").StrategyRunStatus;
    failureMessage?: string;
    devDiagnostics?: {
      runId?: string;
      lastStatus?: string;
      provider?: string;
      failureCode?: string;
      fallbackUsed?: boolean;
      traceLastStage?: string;
      triggerKey?: string;
      actionInvocationCount?: number;
      actionDurationMs?: number;
      inFlightReused?: boolean;
      terminalState?: string;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
    };
  };
  steps: readonly CampaignWorkflowStep[];
  deliverables: readonly CampaignDeliverable[];
  approvalCenter: {
    count: number;
    items: readonly CampaignApprovalItem[];
  };
};

export function executionModeFromApprovalMode(
  mode: CampaignApprovalMode | undefined
): CampaignExecutionMode {
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
