import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";
import {
  buildMarketingActivityLifecycleMap,
  getActivityLifecycleForTitle,
} from "./activity-lifecycle";
import {
  resolveMarketingWorkflowFocus,
  type GeneratingActivity,
  type MarketingWorkflowFocus,
  type ResolveMarketingWorkflowFocusInput,
} from "./workflow-focus";

export type TimelineNodeProgress = "completed" | "current" | "upcoming" | "muted";

export type MarketingTimelineMilestone = "knowledge" | "strategy" | "plan";

export type MarketingTimelineNodeKind = "milestone" | "content";

export type MarketingTimelineNodeData = {
  id: string;
  kind: MarketingTimelineNodeKind;
  milestone?: MarketingTimelineMilestone;
  activityTitle?: string;
  progress: TimelineNodeProgress;
  draftId?: string;
  draftable: boolean;
};

export type MarketingTimelineSnapshot = {
  nodes: MarketingTimelineNodeData[];
  currentNodeId: string | null;
};

function activityKey(title: string): string {
  return title.trim().toLowerCase();
}

export function milestoneTimelineNodeId(milestone: MarketingTimelineMilestone): string {
  return `milestone:${milestone}`;
}

export function contentTimelineNodeId(title: string): string {
  return `content:${activityKey(title)}`;
}

function isKnowledgeComplete(understanding: MarketingUnderstanding | null): boolean {
  return Boolean(understanding?.available && understanding.completeness >= 50);
}

function isContentComplete(
  title: string,
  lifecycleMap: Map<string, import("@/lib/peer-workflow").ActivityLifecycleState>
): boolean {
  const state = getActivityLifecycleForTitle(title, lifecycleMap);
  return state === "published" || state === "completed";
}

export function resolveCurrentTimelineNodeId(
  focus: MarketingWorkflowFocus,
  plan: MarketingPlan | null
): string | null {
  switch (focus.kind) {
    case "generating":
      return resolveGeneratingTimelineNodeId(focus.activity, focus.activityLabel, plan);
    case "knowledge_incomplete":
      return milestoneTimelineNodeId("knowledge");
    case "ready_for_strategy":
      return milestoneTimelineNodeId("strategy");
    case "strategy_complete":
      return milestoneTimelineNodeId("plan");
    case "write_next":
    case "draft_review":
    case "draft_approved":
    case "ready_to_publish":
      return contentTimelineNodeId(focus.planActivityReference);
    case "campaign_complete": {
      const lastDraftable = plan?.contentCalendar.filter(isDraftablePlanActivity).at(-1);
      return lastDraftable ? contentTimelineNodeId(lastDraftable.title) : milestoneTimelineNodeId("plan");
    }
    case "monitoring": {
      const firstDraftable = plan?.contentCalendar.find(isDraftablePlanActivity);
      return firstDraftable ? contentTimelineNodeId(firstDraftable.title) : milestoneTimelineNodeId("plan");
    }
  }
}

function resolveGeneratingTimelineNodeId(
  activity: GeneratingActivity,
  activityLabel: string | undefined,
  plan: MarketingPlan | null
): string | null {
  switch (activity) {
    case "understanding":
      return milestoneTimelineNodeId("knowledge");
    case "strategy":
      return milestoneTimelineNodeId("strategy");
    case "plan":
      return milestoneTimelineNodeId("plan");
    case "draft":
    case "publication": {
      const title = activityLabel ?? findFirstDraftableTitle(plan);
      return title ? contentTimelineNodeId(title) : milestoneTimelineNodeId("plan");
    }
  }
}

function findFirstDraftableTitle(plan: MarketingPlan | null): string | undefined {
  return plan?.contentCalendar.find(isDraftablePlanActivity)?.title;
}

function milestoneCompleted(
  milestone: MarketingTimelineMilestone,
  input: {
    understanding: MarketingUnderstanding | null;
    strategy: MarketingStrategy | null;
    plan: MarketingPlan | null;
  }
): boolean {
  switch (milestone) {
    case "knowledge":
      return isKnowledgeComplete(input.understanding);
    case "strategy":
      return Boolean(input.strategy);
    case "plan":
      return Boolean(input.plan);
  }
}

function resolveNodeProgress(
  node: Omit<MarketingTimelineNodeData, "progress">,
  currentNodeId: string | null,
  input: {
    understanding: MarketingUnderstanding | null;
    strategy: MarketingStrategy | null;
    plan: MarketingPlan | null;
    lifecycleMap: Map<string, import("@/lib/peer-workflow").ActivityLifecycleState>;
  }
): TimelineNodeProgress {
  if (node.id === currentNodeId) {
    return "current";
  }

  if (node.kind === "milestone" && node.milestone) {
    return milestoneCompleted(node.milestone, input) ? "completed" : "upcoming";
  }

  if (!node.draftable) {
    return "muted";
  }

  if (node.activityTitle && isContentComplete(node.activityTitle, input.lifecycleMap)) {
    return "completed";
  }

  return "upcoming";
}

export function buildMarketingTimelineNodes(
  input: ResolveMarketingWorkflowFocusInput
): MarketingTimelineSnapshot {
  const lifecycleMap = buildMarketingActivityLifecycleMap({
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages ?? [],
    generating: Boolean(input.generating),
    generatingActivity: input.generatingActivity,
  });

  const focus = resolveMarketingWorkflowFocus(input);
  const currentNodeId = resolveCurrentTimelineNodeId(focus, input.plan);

  const nodeSeeds: Omit<MarketingTimelineNodeData, "progress">[] = [
    {
      id: milestoneTimelineNodeId("knowledge"),
      kind: "milestone",
      milestone: "knowledge",
      draftable: true,
    },
    {
      id: milestoneTimelineNodeId("strategy"),
      kind: "milestone",
      milestone: "strategy",
      draftable: true,
    },
    {
      id: milestoneTimelineNodeId("plan"),
      kind: "milestone",
      milestone: "plan",
      draftable: true,
    },
  ];

  for (const entry of input.plan?.contentCalendar ?? []) {
    const draftable = isDraftablePlanActivity(entry);
    const draft = input.drafts.find(
      (item) => activityKey(item.planActivityReference) === activityKey(entry.title)
    );
    nodeSeeds.push({
      id: contentTimelineNodeId(entry.title),
      kind: "content",
      activityTitle: entry.title,
      draftId: draft?.id,
      draftable,
    });
  }

  const progressInput = {
    understanding: input.understanding,
    strategy: input.strategy,
    plan: input.plan,
    lifecycleMap,
  };

  const nodes = nodeSeeds.map((seed) => ({
    ...seed,
    progress: resolveNodeProgress(seed, currentNodeId, progressInput),
  }));

  return { nodes, currentNodeId };
}

export function resolveEffectiveTimelineSelection(
  snapshot: MarketingTimelineSnapshot,
  selectedTimelineNodeId: string | null
): string | null {
  const validIds = new Set(snapshot.nodes.map((node) => node.id));
  const preferred = selectedTimelineNodeId ?? snapshot.currentNodeId;
  if (preferred && validIds.has(preferred)) {
    return preferred;
  }
  return snapshot.currentNodeId;
}

export function findDraftIdForTimelineNode(
  nodeId: string,
  drafts: MarketingContentDraft[]
): string | undefined {
  if (!nodeId.startsWith("content:")) return undefined;
  const key = nodeId.slice("content:".length);
  return drafts.find((draft) => activityKey(draft.planActivityReference) === key)?.id;
}
