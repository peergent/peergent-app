import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { ActivityFeedItem, ConversationMessage } from "./experience/types";

export type MarketingWorkspacePersistedState = {
  strategy?: MarketingStrategy;
  plan?: MarketingPlan;
  drafts: MarketingContentDraft[];
  activityFeed?: ActivityFeedItem[];
  conversation?: ConversationMessage[];
  lastUpdated?: string;
};

export type MarketingWorkspacePhase =
  | "learning"
  | "strategizing"
  | "planning"
  | "creating"
  | "reviewing"
  | "ready";

export type RecommendedAction = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  kind: "fill-gaps" | "generate-strategy" | "generate-plan" | "create-draft" | "review-draft";
  planActivityReference?: string;
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
