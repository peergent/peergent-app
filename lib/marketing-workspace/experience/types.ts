export type PeerPresenceId =
  | "idle"
  | "learning"
  | "thinking"
  | "strategizing"
  | "planning"
  | "creating"
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
  | "conversation"
  | "focus_updated";

export type ActivityFeedItem = {
  id: string;
  timestamp: string;
  activityType: ActivityType;
  title: string;
  description: string;
  relatedObject?: string;
  confidence?: string;
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
