import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { KnowledgeSectionId } from "@/lib/knowledge";
import { gapToKnowledgeSection } from "@/lib/knowledge";
import type { PublicationPackage } from "@/lib/peer-workflow";
import {
  buildMarketingActivityLifecycleMap,
  findNextMarketingPlanActivity,
  isPlanExecutionComplete,
} from "./activity-lifecycle";

export type GeneratingActivity =
  | "understanding"
  | "strategy"
  | "plan"
  | "draft"
  | "publication";

export type MarketingWorkflowFocus =
  | { kind: "generating"; activity: GeneratingActivity; activityLabel?: string }
  | { kind: "knowledge_incomplete"; knowledgeSection: KnowledgeSectionId }
  | { kind: "ready_to_publish"; draftId: string; title: string; planActivityReference: string }
  | { kind: "draft_approved"; draftId: string; title: string; planActivityReference: string }
  | { kind: "draft_review"; draftId: string; title: string; planActivityReference: string }
  | { kind: "ready_for_strategy" }
  | { kind: "strategy_complete" }
  | { kind: "write_next"; planActivityReference: string; title: string; scheduledWeek?: number }
  | { kind: "campaign_complete" }
  | { kind: "monitoring" };

export type ResolveMarketingWorkflowFocusInput = {
  generating: GeneratingActivity | null;
  generatingActivity?: string | null;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
};

/**
 * Canonical workflow priority — shared by recommendations and peer presentation.
 */
export function resolveMarketingWorkflowFocus(
  input: ResolveMarketingWorkflowFocusInput
): MarketingWorkflowFocus {
  if (input.generating) {
    return {
      kind: "generating",
      activity: input.generating,
      activityLabel: input.generatingActivity ?? undefined,
    };
  }

  const lifecycleMap = buildMarketingActivityLifecycleMap({
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages: input.publicationPackages ?? [],
  });

  if (!input.understanding?.available || input.understanding.completeness < 50) {
    const firstGap = input.understanding?.gaps[0];
    return {
      kind: "knowledge_incomplete",
      knowledgeSection: firstGap ? gapToKnowledgeSection(firstGap) : "company-dna",
    };
  }

  const readyToPublish = input.drafts.find((draft) => draft.status === "ready_to_publish");
  if (readyToPublish) {
    return {
      kind: "ready_to_publish",
      draftId: readyToPublish.id,
      title: readyToPublish.title,
      planActivityReference: readyToPublish.planActivityReference,
    };
  }

  const approved = input.drafts.find((draft) => draft.status === "approved");
  if (approved) {
    return {
      kind: "draft_approved",
      draftId: approved.id,
      title: approved.title,
      planActivityReference: approved.planActivityReference,
    };
  }

  const pendingReview = input.drafts.find(
    (draft) => draft.status === "draft" || draft.status === "ready_for_review"
  );
  if (pendingReview) {
    return {
      kind: "draft_review",
      draftId: pendingReview.id,
      title: pendingReview.title,
      planActivityReference: pendingReview.planActivityReference,
    };
  }

  if (!input.strategy) {
    return { kind: "ready_for_strategy" };
  }

  if (!input.plan) {
    return { kind: "strategy_complete" };
  }

  if (isPlanExecutionComplete(input.plan, lifecycleMap)) {
    return { kind: "campaign_complete" };
  }

  const nextActivity = findNextMarketingPlanActivity(input.plan, lifecycleMap);
  if (nextActivity) {
    const calendarEntry = input.plan.contentCalendar.find(
      (entry) => entry.title === nextActivity.title
    );
    return {
      kind: "write_next",
      planActivityReference: nextActivity.title,
      title: nextActivity.title,
      scheduledWeek: calendarEntry?.scheduledWeek,
    };
  }

  return { kind: "monitoring" };
}
