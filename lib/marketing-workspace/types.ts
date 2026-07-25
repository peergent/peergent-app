import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { KnowledgeSectionId } from "@/lib/knowledge";
import type { PublicationPackage } from "@/lib/peer-workflow";
import type { WorkAutomation, WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { InsightRotationState } from "@/lib/peer-experience/marketing/build-insights-engine";
import type { ApprovalDeliverableOverlay } from "@/lib/peer-experience/marketing/approval/approval-overlay";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import type { ActivityFeedItem, ConversationMessage } from "./experience/types";

export type MarketingWorkspacePersistedState = {
  strategy?: MarketingStrategy;
  plan?: MarketingPlan;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
  activityFeed?: ActivityFeedItem[];
  conversation?: ConversationMessage[];
  workUnits?: WorkUnit[];
  projects?: MarketingProject[];
  responsibilities?: MarketingResponsibility[];
  automations?: WorkAutomation[];
  insightRotation?: InsightRotationState;
  metrics?: MetricSnapshot[];
  approvalOverlays?: Record<string, ApprovalDeliverableOverlay>;
  lastUpdated?: string;
};

export type MarketingWorkspacePhase =
  | "learning"
  | "strategizing"
  | "planning"
  | "creating"
  | "reviewing"
  | "publishing"
  | "ready";

export type RecommendedAction = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  kind:
    | "fill-gaps"
    | "generate-strategy"
    | "generate-plan"
    | "create-draft"
    | "review-draft"
    | "prepare-publication"
    | "mark-published";
  planActivityReference?: string;
  draftId?: string;
  knowledgeSection?: KnowledgeSectionId;
};

export type MarketingWorkspaceSnapshot = {
  understanding: MarketingUnderstanding | null;
  profileGoalsCount: number;
  profileContentCount: number;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  warnings: string[];
  phase: MarketingWorkspacePhase;
  phaseLabel: string;
  recommendedActions: RecommendedAction[];
  pendingApprovals: MarketingContentDraft[];
};
