import type { ActivityFeedItem } from "./types";
import type { WorkSummaryItem } from "./types";

export type WorkspaceRegion = "understanding" | "strategy" | "plan" | "drafts";

/** @deprecated Use WorkspaceRegion — calendar removed in Sprint 11 Phase 2 */
export type ArtifactSection = WorkspaceRegion;

export function timelineNodeToWorkspaceRegion(nodeId: string): WorkspaceRegion {
  if (nodeId.startsWith("milestone:knowledge")) return "understanding";
  if (nodeId.startsWith("milestone:strategy")) return "strategy";
  if (nodeId.startsWith("milestone:plan")) return "plan";
  return "drafts";
}

export function resolveActivityTarget(item: ActivityFeedItem): WorkspaceRegion | null {
  switch (item.activityType) {
    case "understanding_loaded":
    case "gap_detected":
      return "understanding";
    case "strategy_completed":
      return "strategy";
    case "plan_completed":
      return "plan";
    case "draft_generated":
    case "waiting_approval":
    case "draft_approved":
    case "draft_rejected":
    case "publication_prepared":
    case "publication_ready":
    case "published":
      return "drafts";
    default:
      return null;
  }
}

export function resolveSummaryTarget(item: WorkSummaryItem): WorkspaceRegion | null {
  if (item.id === "understanding") return "understanding";
  if (item.id === "strategy") return "strategy";
  if (item.id === "plan") return "plan";
  if (item.id.startsWith("approve-") || item.id === "drafts-approved") return "drafts";
  if (item.id.startsWith("gap-")) return "understanding";
  if (item.id === "need-strategy") return "strategy";
  return null;
}
