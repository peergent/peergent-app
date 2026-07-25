import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";
import { gapToKnowledgeSection } from "@/lib/knowledge";
import {
  buildMarketingActivityLifecycleMap,
  findNextMarketingPlanActivity,
} from "./activity-lifecycle";
import type {
  MarketingWorkspacePhase,
  RecommendedAction,
} from "./types";

function activityKey(title: string): string {
  return title.trim().toLowerCase();
}

export function deriveWorkspacePhase(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
  isGenerating: boolean;
}): { phase: MarketingWorkspacePhase; label: string } {
  if (input.isGenerating) {
    return { phase: "learning", label: "Working…" };
  }

  const pendingReview = input.drafts.some(
    (draft) => draft.status === "draft" || draft.status === "ready_for_review"
  );

  if (pendingReview) {
    return { phase: "reviewing", label: "Draft ready for your review" };
  }

  const readyToPublish = input.drafts.some((draft) => draft.status === "ready_to_publish");
  const approvedAwaitingPrep = input.drafts.some((draft) => draft.status === "approved");

  if (readyToPublish || approvedAwaitingPrep) {
    return { phase: "publishing", label: "Preparing content for publication" };
  }

  if (input.drafts.some((draft) => draft.status === "published")) {
    return { phase: "ready", label: "Published content on file" };
  }

  if (input.drafts.length > 0) {
    return { phase: "creating", label: "Creating content from plan" };
  }

  if (input.plan?.contentCalendar.length) {
    return { phase: "creating", label: "Ready to draft content" };
  }

  if (input.plan) {
    return { phase: "planning", label: "Plan in place — build content calendar" };
  }

  if (input.strategy) {
    return { phase: "planning", label: "Strategy ready — create execution plan" };
  }

  if (input.understanding?.available) {
    return { phase: "strategizing", label: "Understanding the business" };
  }

  return { phase: "learning", label: "Building marketing understanding" };
}

export function buildRecommendedActions(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  publicationPackages?: PublicationPackage[];
}): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const publicationPackages = input.publicationPackages ?? [];
  const lifecycleMap = buildMarketingActivityLifecycleMap({
    plan: input.plan,
    drafts: input.drafts,
    publicationPackages,
  });

  if (!input.understanding?.available || input.understanding.completeness < 50) {
    const firstGap = input.understanding?.gaps[0];
    actions.push({
      id: "fill-gaps",
      title: "Complete business knowledge",
      description:
        "Add products, segments, and brand positioning so the Marketing Peer can work accurately.",
      priority: "high",
      kind: "fill-gaps",
      knowledgeSection: firstGap ? gapToKnowledgeSection(firstGap) : "company-dna",
    });
  }

  if (!input.strategy) {
    actions.push({
      id: "generate-strategy",
      title: "Generate marketing strategy",
      description:
        "Turn marketing understanding into a structured strategy with audience and positioning recommendations.",
      priority: input.understanding?.available ? "high" : "medium",
      kind: "generate-strategy",
    });
  }

  if (input.strategy && !input.plan) {
    actions.push({
      id: "generate-plan",
      title: "Create marketing plan",
      description:
        "Transform the approved strategy into a timeline, content calendar, and campaign plan.",
      priority: "high",
      kind: "generate-plan",
    });
  }

  for (const draft of input.drafts.filter((item) => item.status === "ready_to_publish")) {
    actions.push({
      id: `publish-${draft.id}`,
      title: `Publish: ${draft.title}`,
      description:
        "Publication package is ready. Confirm when you have published it to the channel.",
      priority: "high",
      kind: "mark-published",
      planActivityReference: draft.planActivityReference,
      draftId: draft.id,
    });
  }

  for (const draft of input.drafts.filter((item) => item.status === "approved")) {
    actions.push({
      id: `prepare-${draft.id}`,
      title: `Prepare publication: ${draft.title}`,
      description:
        "I'll package this approved draft for the target channel — nothing goes live until you confirm.",
      priority: "high",
      kind: "prepare-publication",
      planActivityReference: draft.planActivityReference,
      draftId: draft.id,
    });
  }

  for (const draft of input.drafts.filter(
    (item) => item.status === "draft" || item.status === "ready_for_review"
  )) {
    actions.push({
      id: `review-${draft.id}`,
      title: `Review: ${draft.title}`,
      description: draft.rationale.why,
      priority: "high",
      kind: "review-draft",
      planActivityReference: draft.planActivityReference,
      draftId: draft.id,
    });
  }

  if (input.plan) {
    const nextActivity = findNextMarketingPlanActivity(input.plan, lifecycleMap);
    if (nextActivity) {
      const key = activityKey(nextActivity.title);
      const lifecycle = lifecycleMap.get(key);
      if (lifecycle === "not_started") {
        actions.push({
          id: `draft-${nextActivity.title}`,
          title: `Next up: ${nextActivity.title}`,
          description: "This is the next scheduled calendar activity without a draft.",
          priority: "medium",
          kind: "create-draft",
          planActivityReference: nextActivity.title,
        });
      }
    }

    for (const entry of input.plan.contentCalendar) {
      const hasDraft = input.drafts.some(
        (draft) => activityKey(draft.planActivityReference) === activityKey(entry.title)
      );
      if (!hasDraft && isDraftablePlanActivity(entry)) {
        actions.push({
          id: `draft-${entry.title}`,
          title: `Draft: ${entry.title}`,
          description: `Create ${entry.contentType} content for week ${entry.scheduledWeek}${entry.channel ? ` on ${entry.channel}` : ""}.`,
          priority: "medium",
          kind: "create-draft",
          planActivityReference: entry.title,
        });
      }
    }
  }

  const seen = new Set<string>();
  return actions
    .filter((action) => {
      if (seen.has(action.id)) return false;
      seen.add(action.id);
      return true;
    })
    .slice(0, 6);
}

export function collectWorkspaceWarnings(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  apiWarnings: string[];
}): string[] {
  const warnings = new Set<string>(input.apiWarnings);

  if (input.understanding?.sparse) {
    warnings.add(
      `Marketing understanding is ${input.understanding.completeness}% complete — some recommendations may be limited.`
    );
  }

  for (const gap of input.understanding?.gaps ?? []) {
    warnings.add(`Missing: ${gap}`);
  }

  for (const gap of input.strategy?.knowledgeGaps ?? []) {
    warnings.add(`Strategy gap: ${gap}`);
  }

  for (const gap of input.plan?.knowledgeGaps ?? []) {
    warnings.add(`Plan gap: ${gap}`);
  }

  for (const draft of input.drafts) {
    for (const warning of draft.warnings) {
      warnings.add(warning);
    }
  }

  return [...warnings];
}
