export type PeerPresenceId =
  | "idle"
  | "learning"
  | "thinking"
  | "strategizing"
  | "planning"
  | "creating"
  | "preparing_publication"
  | "waiting_for_approval"
  | "reviewing"
  | "completed"
  | "blocked";

export type PeerPresence = {
  id: PeerPresenceId;
  label: string;
  description: string;
  color: "slate" | "violet" | "fuchsia" | "amber" | "emerald" | "red" | "cyan";
  lastUpdated: string;
};

export type ActivityType =
  | "understanding_loaded"
  | "gap_detected"
  | "strategy_completed"
  | "plan_completed"
  | "draft_generated"
  | "waiting_approval"
  | "draft_approved"
  | "draft_rejected"
  | "publication_prepared"
  | "publication_ready"
  | "published"
  | "campaign_approved"
  | "campaign_execution_started"
  | "campaign_research_complete"
  | "campaign_reasoning_complete"
  | "campaign_marketing_intelligence_complete"
  | "campaign_strategy_complete"
  | "campaign_planning_complete"
  | "campaign_creative_complete"
  | "campaign_validation_complete"
  | "campaign_scheduling_complete"
  | "campaign_publication_started"
  | "campaign_publication_succeeded"
  | "campaign_publication_failed"
  | "campaign_publication_retried"
  | "campaign_memory_updated"
  | "campaign_execution_completed"
  | "conversation"
  | "focus_updated";

export type ActivityFeedCorrelation = {
  campaignId?: string;
  campaignRunId?: string;
  approvalId?: string;
  projectId?: string;
  organizationId?: string;
};

export type ActivityFeedItem = {
  id: string;
  timestamp: string;
  activityType: ActivityType;
  title: string;
  description: string;
  relatedObject?: string;
  confidence?: string;
  correlation?: ActivityFeedCorrelation;
};

export type ConversationRole = "user" | "peer";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
};

export type ConversationalRecommendation = {
  id: string;
  peerMessage: string;
  why: string;
  actionLabel?: string;
  kind: import("../types").RecommendedAction["kind"];
  planActivityReference?: string;
  knowledgeSection?: import("@/lib/knowledge").KnowledgeSectionId;
  priority: "high" | "medium" | "low";
};

export type ExplainabilityArtifact = "understanding" | "strategy" | "plan" | "draft";

export type ExplainabilityView = {
  artifact: ExplainabilityArtifact;
  title: string;
  reasoning: string;
  evidence: string[];
  sourceReferences: string[];
  confidence?: string;
};

export type WorkSummaryItem = {
  id: string;
  label: string;
  kind: "completed" | "waiting";
};

export type WorkSummary = {
  completedToday: WorkSummaryItem[];
  waitingOnYou: WorkSummaryItem[];
};

export type CollaborationMessage = {
  id: string;
  message: string;
  tone: "info" | "ready" | "gap" | "blocked" | "approval";
};
