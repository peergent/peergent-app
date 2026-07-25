import type { TimelineNodeViewModel, TimelineViewModel } from "../types";
import type { MarketingTimelineSnapshot } from "@/lib/marketing-workspace/timeline-nodes";
import { timelineNodeToWorkspaceRegion } from "@/lib/marketing-workspace/experience/navigation";
import { resolveTimelineNodeLabel } from "./timeline-config";

export function buildMarketingTimelineViewModel(
  snapshot: MarketingTimelineSnapshot,
  selectedNodeId: string | null
): TimelineViewModel {
  const nodes: TimelineNodeViewModel[] = snapshot.nodes.map((node) => ({
    id: node.id,
    label: resolveTimelineNodeLabel(node),
    progress: node.progress,
    region: timelineNodeToWorkspaceRegion(node.id),
    draftId: node.draftId,
    activityTitle: node.activityTitle,
  }));

  return {
    nodes,
    currentNodeId: snapshot.currentNodeId,
    selectedNodeId,
  };
}
