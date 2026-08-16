import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import type { CampaignWorkflowStepId } from "./workflow-types";
import type {
  CampaignContextReadiness,
  CompetitorDecision,
  WebsiteDecision,
} from "./campaign-context-readiness";
import type { StrategyRunStatus } from "./strategy-run-types";

export type ResearchStepState =
  | "waiting_for_context"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "skipped";

export type CampaignPrimaryActionKind =
  | "add_context"
  | "add_website"
  | "add_competitors"
  | "review_strategy"
  | "review_channels"
  | "review_deliverables"
  | "review_campaign"
  | "schedule"
  | "publish"
  | "view_results"
  | "continue"
  | "strategy_working"
  | "retry_strategy"
  | "view_context"
  | "view_schedule";

export type CampaignPrimaryAction = {
  kind: CampaignPrimaryActionKind;
  label: string;
  stepId?: CampaignWorkflowStepId;
  draftId?: string;
  strategyRunStatus?: StrategyRunStatus;
  strategyRunStageLabel?: string;
  failureMessageSafe?: string;
};

export type CampaignOrchestrationPhase =
  | "collect_context"
  | "emma_working"
  | "awaiting_customer";

export type CampaignOrchestrationState = {
  contextVersion: number;
  readiness: CampaignContextReadiness;
  phase: CampaignOrchestrationPhase;
  researchSteps: {
    companyUnderstanding: ResearchStepState;
    websiteUnderstanding: ResearchStepState;
    competitorUnderstanding: ResearchStepState;
  };
  strategyBlocked: boolean;
  strategyOutputReady: boolean;
  strategyApproved: boolean;
  channelsApproved: boolean;
  deliverablesUnlocked: boolean;
  activeCustomerStepId: CampaignWorkflowStepId | null;
  primaryAction: CampaignPrimaryAction;
  strategyRunStatus?: StrategyRunStatus;
  invalidatedCapabilities: readonly BrainCapabilityId[];
  websiteDecision: WebsiteDecision;
  competitorDecision: CompetitorDecision;
};

export const INFORMATIONAL_WORKFLOW_STEPS: readonly CampaignWorkflowStepId[] = [
  "business_analyzed",
  "website_analyzed",
  "competitors_analyzed",
];

export function isInformationalWorkflowStep(stepId: CampaignWorkflowStepId): boolean {
  return INFORMATIONAL_WORKFLOW_STEPS.includes(stepId);
}
