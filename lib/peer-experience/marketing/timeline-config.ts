import type {
  MarketingTimelineMilestone,
  MarketingTimelineNodeData,
} from "@/lib/marketing-workspace/timeline-nodes";

const MILESTONE_LABELS: Record<MarketingTimelineMilestone, string> = {
  knowledge: "Business context",
  strategy: "Strategy",
  plan: "Campaign plan",
};

export function milestoneLabel(milestone: MarketingTimelineMilestone): string {
  return MILESTONE_LABELS[milestone];
}

export function contentActivityLabel(title: string): string {
  return title;
}

export function resolveTimelineNodeLabel(node: MarketingTimelineNodeData): string {
  if (node.kind === "milestone" && node.milestone) {
    return milestoneLabel(node.milestone);
  }

  if (node.activityTitle) {
    return contentActivityLabel(node.activityTitle);
  }

  return "Content";
}
