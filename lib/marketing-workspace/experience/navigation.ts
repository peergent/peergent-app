import type { ActivityFeedItem } from "./types";
import type { WorkSummaryItem } from "./types";

export type ArtifactSection =
  | "understanding"
  | "strategy"
  | "plan"
  | "calendar"
  | "drafts";

export function resolveActivityTarget(item: ActivityFeedItem): ArtifactSection | null {
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
      return "drafts";
    default:
      return null;
  }
}

export function resolveSummaryTarget(item: WorkSummaryItem): ArtifactSection | null {
  if (item.id === "understanding") return "understanding";
  if (item.id === "strategy") return "strategy";
  if (item.id === "plan") return "plan";
  if (item.id.startsWith("approve-") || item.id === "drafts-approved") return "drafts";
  if (item.id.startsWith("gap-")) return "understanding";
  if (item.id === "need-strategy") return "strategy";
  return null;
}
