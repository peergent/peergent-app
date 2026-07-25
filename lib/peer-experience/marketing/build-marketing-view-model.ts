import type { PeerViewModel } from "../types";
import type { ResolveMarketingWorkflowFocusInput } from "@/lib/marketing-workspace/workflow-focus";
import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { buildMarketingTimelineNodes } from "@/lib/marketing-workspace/timeline-nodes";
import {
  attachPrimaryActionLabel,
  buildMayaNowCopy,
  resolvePrimaryActionLabel,
} from "./maya-copy";
import { resolveMarketingPrimaryActionIntent } from "./resolve-primary-action";
import { buildMarketingTimelineViewModel } from "./build-marketing-timeline-view-model";
import {
  buildMarketingDeliverableViewModel,
  resolveSelectedTimelineNodeId,
} from "./build-marketing-deliverable-view-model";
import { buildMarketingDetailsViewModel } from "./build-marketing-details-view-model";

export type BuildMarketingViewModelInput = ResolveMarketingWorkflowFocusInput & {
  selectedTimelineNodeId: string | null;
  profileCounts: { goals: number; content: number };
  activityFeed: import("@/lib/marketing-workspace/experience").ActivityFeedItem[];
};

export function buildMarketingViewModel(
  input: BuildMarketingViewModelInput
): PeerViewModel {
  const focus = resolveMarketingWorkflowFocus(input);
  const actionIntent = resolveMarketingPrimaryActionIntent(focus);
  const label = actionIntent ? resolvePrimaryActionLabel(focus) : null;
  const primaryAction =
    actionIntent && label ? attachPrimaryActionLabel(actionIntent, label) : null;
  const nowCopy = buildMayaNowCopy(focus, primaryAction);

  const timelineSnapshot = buildMarketingTimelineNodes(input);
  const selectedNodeId = resolveSelectedTimelineNodeId(
    timelineSnapshot,
    input.selectedTimelineNodeId
  );

  const deliverable = buildMarketingDeliverableViewModel({
    ...input,
    snapshot: timelineSnapshot,
    selectedNodeId,
  });

  return {
    now: {
      ...nowCopy,
      primaryAction,
    },
    timeline: buildMarketingTimelineViewModel(timelineSnapshot, selectedNodeId),
    deliverable,
    details: buildMarketingDetailsViewModel({
      understanding: input.understanding,
      strategy: input.strategy,
      plan: input.plan,
      drafts: input.drafts,
      deliverable,
      profileCounts: input.profileCounts,
      activityFeed: input.activityFeed,
    }),
  };
}
