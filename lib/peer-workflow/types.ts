/** Lifecycle states for a planned peer activity (reusable across Marketing, Sales, etc.). */
export type ActivityLifecycleState =
  | "not_started"
  | "drafting"
  | "waiting_for_review"
  | "approved"
  | "ready_to_publish"
  | "published"
  | "completed";

export type PeerWorkflowPeerRole = "Marketing" | "Sales" | "Support" | "Finance" | "HR";

/** Minimal activity reference for lifecycle derivation. */
export type WorkflowActivityRef = {
  id: string;
  title: string;
  scheduledOrder?: number;
};

/** Artifact produced by a peer that may enter the publication pipeline. */
export type WorkflowArtifactRef = {
  id: string;
  activityReference: string;
  status: string;
  title: string;
};

export type WorkflowPublicationRef = {
  activityReference: string;
  status: "ready" | "published";
};

export type DeriveActivityLifecycleInput = {
  activity: WorkflowActivityRef;
  artifact?: WorkflowArtifactRef;
  publication?: WorkflowPublicationRef;
  isDrafting?: boolean;
};

export const ACTIVITY_LIFECYCLE_LABELS: Record<ActivityLifecycleState, string> = {
  not_started: "Not started",
  drafting: "Drafting",
  waiting_for_review: "Waiting for review",
  approved: "Approved",
  ready_to_publish: "Ready to publish",
  published: "Published",
  completed: "Completed",
};
