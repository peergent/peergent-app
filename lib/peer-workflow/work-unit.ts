import type { PeerWorkflowPeerRole } from "./types";
import type { WorkLifecycleEvent, WorkLifecycleStage } from "./work-lifecycle";

export type WorkDeliverableKind =
  | "instagram"
  | "linkedin"
  | "newsletter"
  | "blog"
  | "landing_page"
  | "meta_ad"
  | "google_ad"
  | "email"
  | "generic";

export type WorkAutomationRecurrence =
  | "once"
  | "weekly"
  | "monthly"
  | "custom"
  | "trigger";

export type WorkAutomationTrigger =
  | "blog_published"
  | "product_launch"
  | "traffic_drop"
  | "custom";

export type WorkUnitArtifactKind = "draft" | "image" | "caption" | "publication_package";

export type WorkUnitArtifact = {
  id: string;
  kind: WorkUnitArtifactKind;
  label: string;
  refId: string;
};

export type WorkUnitEvent = {
  id: string;
  at: string;
  event: WorkLifecycleEvent;
  fromStage: WorkLifecycleStage | null;
  toStage: WorkLifecycleStage;
  note: string;
};

/** Universal work item — one lifecycle for Marketing, Sales, Support, etc. */
export type WorkUnit = {
  id: string;
  peerId: string;
  /** Customer-facing MarketingProject that owns this execution unit. */
  projectId?: string | null;
  role: PeerWorkflowPeerRole;
  title: string;
  status: WorkLifecycleStage;
  deliverableKind: WorkDeliverableKind;
  channel: string;
  objective: string | null;
  audience: string | null;
  needsVisual: boolean;
  recurrence: WorkAutomationRecurrence;
  automationTrigger: WorkAutomationTrigger | null;
  draftId: string | null;
  planActivityReference: string | null;
  rawRequest: string;
  startedAt: string;
  updatedAt: string;
  estimatedCompletionAt: string | null;
  artifacts: WorkUnitArtifact[];
  eventLog: WorkUnitEvent[];
  paused: boolean;
  cancelled: boolean;
};

export type WorkAutomation = {
  id: string;
  peerId: string;
  workUnitId: string;
  recurrence: WorkAutomationRecurrence;
  trigger: WorkAutomationTrigger | null;
  triggerLabel: string | null;
  createdAt: string;
  active: boolean;
};

export type CreateWorkUnitInput = {
  peerId: string;
  role: PeerWorkflowPeerRole;
  title: string;
  deliverableKind: WorkDeliverableKind;
  channel: string;
  objective: string | null;
  audience: string | null;
  needsVisual: boolean;
  recurrence: WorkAutomationRecurrence;
  automationTrigger?: WorkAutomationTrigger | null;
  triggerLabel?: string | null;
  rawRequest: string;
  planActivityReference?: string | null;
  projectId?: string | null;
};
