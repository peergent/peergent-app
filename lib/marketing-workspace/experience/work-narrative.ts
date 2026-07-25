import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import type { MarketingUnderstandingDimension } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";
import { gapToKnowledgeSection, knowledgeSectionHref } from "@/lib/knowledge";
import type { RecommendedAction } from "../types";
import {
  buildMarketingActivityLifecycleMap,
  findNextMarketingPlanActivity,
  isPlanExecutionComplete,
} from "../activity-lifecycle";
import { toConversationalRecommendations } from "./conversational-recommendations";
import { deriveCurrentFocus, type CurrentFocus } from "./current-focus";
import { derivePeerPresence } from "./presence";
import type { PeerPresence } from "./types";

export type NeedFromUser = {
  id: string;
  label: string;
  href?: string;
};

export type WorkNarrative = {
  focus: CurrentFocus;
  presence: PeerPresence;
  primaryRecommendation: ReturnType<typeof toConversationalRecommendations>[number] | null;
  needsFromYou: NeedFromUser[];
  progressCompleted: string[];
};

function formatGapLabel(gap: MarketingUnderstandingDimension): string {
  return gap
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function buildWorkNarrative(input: {
  generating: "understanding" | "strategy" | "plan" | "draft" | "publication" | null;
  generatingActivity?: string | null;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
  recommendedActions: RecommendedAction[];
  apiWarnings: string[];
}): WorkNarrative {
  const publicationPackages = input.publicationPackages ?? [];
  const lifecycleMap = buildMarketingActivityLifecycleMap({
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages,
    generating: Boolean(input.generating),
    generatingActivity: input.generatingActivity,
  });

  const pendingDrafts = input.drafts.filter(
    (draft) => draft.status === "draft" || draft.status === "ready_for_review"
  );
  const readyToPublishDrafts = input.drafts.filter(
    (draft) => draft.status === "ready_to_publish"
  );
  const approvedDrafts = input.drafts.filter((draft) => draft.status === "approved");
  const nextActivity = findNextMarketingPlanActivity(input.plan, lifecycleMap);
  const planComplete = isPlanExecutionComplete(input.plan, lifecycleMap);

  const undraftedCount =
    input.plan?.contentCalendar.filter(
      (entry) =>
        isDraftablePlanActivity(entry) &&
        !input.drafts.some(
          (draft) =>
            draft.planActivityReference.trim().toLowerCase() ===
            entry.title.trim().toLowerCase()
        )
    ).length ?? 0;

  const focus = deriveCurrentFocus({
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    pendingDraftTitle: pendingDrafts[0]?.title,
    nextScheduledActivityTitle: nextActivity?.title,
    nextScheduledActivityWeek: input.plan?.contentCalendar.find(
      (entry) => entry.title === nextActivity?.title
    )?.scheduledWeek,
    readyToPublishDraftTitle: readyToPublishDrafts[0]?.title,
    approvedDraftTitle:
      readyToPublishDrafts.length === 0 ? approvedDrafts[0]?.title : undefined,
    undraftedActivityCount: pendingDrafts.length === 0 ? undraftedCount : 0,
    planComplete,
  });

  const presence = derivePeerPresence({
    generating: input.generating,
    understandingAvailable: input.understanding?.available ?? false,
    understandingCompleteness: input.understanding?.completeness ?? 0,
    hasStrategy: Boolean(input.strategy),
    hasPlan: Boolean(input.plan),
    pendingDraftCount: pendingDrafts.length,
    readyToPublishCount: readyToPublishDrafts.length,
    approvedAwaitingPrepCount: approvedDrafts.length,
    hasPublishedDrafts: input.drafts.some((draft) => draft.status === "published"),
    planComplete,
    gapCount: input.understanding?.gaps.length ?? 0,
  });

  const conversational = toConversationalRecommendations(input.recommendedActions);
  const primaryRecommendation = conversational[0] ?? null;

  const needsFromYou: NeedFromUser[] = [];

  for (const draft of pendingDrafts) {
    needsFromYou.push({
      id: `review-${draft.id}`,
      label: `Review and approve "${draft.title}"`,
    });
  }

  for (const draft of readyToPublishDrafts) {
    needsFromYou.push({
      id: `publish-${draft.id}`,
      label: `Confirm publication for "${draft.title}"`,
    });
  }

  for (const draft of approvedDrafts) {
    needsFromYou.push({
      id: `prepare-${draft.id}`,
      label: `Prepare "${draft.title}" for publication`,
    });
  }

  for (const gap of input.understanding?.gaps ?? []) {
    const label = formatGapLabel(gap);
    needsFromYou.push({
      id: `gap-${gap}`,
      label: `Add ${label.toLowerCase()} in Knowledge`,
      href: knowledgeSectionHref(gapToKnowledgeSection(gap)),
    });
  }

  if (!input.strategy && input.understanding?.available) {
    needsFromYou.push({
      id: "generate-strategy",
      label: "Confirm strategy direction — generate a strategy to continue",
    });
  }

  if (
    nextActivity &&
    pendingDrafts.length === 0 &&
    readyToPublishDrafts.length === 0 &&
    approvedDrafts.length === 0 &&
    !input.generating
  ) {
    const lifecycle = lifecycleMap.get(nextActivity.title.trim().toLowerCase());
    if (lifecycle === "not_started") {
      needsFromYou.push({
        id: `draft-${nextActivity.title}`,
        label: `Draft next activity: "${nextActivity.title}"`,
      });
    }
  }

  for (const warning of input.apiWarnings.slice(0, 2)) {
    if (!needsFromYou.some((need) => warning.includes(need.label.slice(0, 20)))) {
      needsFromYou.push({ id: `warning-${warning.slice(0, 24)}`, label: warning });
    }
  }

  const progressCompleted: string[] = [];
  if (input.understanding?.available && input.understanding.completeness >= 40) {
    progressCompleted.push("Marketing understanding reviewed");
  }
  if (input.strategy) progressCompleted.push("Marketing strategy");
  if (input.plan) progressCompleted.push("Execution plan");
  const approvedCount = input.drafts.filter((draft) => draft.status === "approved").length;
  if (approvedCount > 0) {
    progressCompleted.push(
      approvedCount === 1 ? "1 draft approved" : `${approvedCount} drafts approved`
    );
  }
  const readyCount = readyToPublishDrafts.length;
  if (readyCount > 0) {
    progressCompleted.push(
      readyCount === 1
        ? "1 draft ready to publish"
        : `${readyCount} drafts ready to publish`
    );
  }
  const publishedCount = input.drafts.filter((draft) => draft.status === "published").length;
  if (publishedCount > 0) {
    progressCompleted.push(
      publishedCount === 1 ? "1 item published" : `${publishedCount} items published`
    );
  }
  if (planComplete) {
    progressCompleted.push("Execution plan cycle complete");
  }

  return {
    focus,
    presence,
    primaryRecommendation,
    needsFromYou: needsFromYou
      .filter((need, index, list) => list.findIndex((item) => item.id === need.id) === index)
      .slice(0, 5),
    progressCompleted,
  };
}
