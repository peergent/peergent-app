import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { gapToKnowledgeSection } from "@/lib/knowledge";
import type {
  MarketingWorkspacePhase,
  RecommendedAction,
} from "./types";

export function deriveWorkspacePhase(input: {
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  isGenerating: boolean;
}): { phase: MarketingWorkspacePhase; label: string } {
  if (input.isGenerating) {
    return { phase: "learning", label: "Working…" };
  }

  const pendingReview = input.drafts.some((d) => d.status === "draft");

  if (pendingReview) {
    return { phase: "reviewing", label: "Draft ready for your review" };
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
}): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

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

  if (input.plan) {
    for (const entry of input.plan.contentCalendar) {
      const hasDraft = input.drafts.some(
        (d) =>
          d.planActivityReference.trim().toLowerCase() ===
          entry.title.trim().toLowerCase()
      );
      if (!hasDraft) {
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

  for (const draft of input.drafts.filter((d) => d.status === "draft")) {
    actions.push({
      id: `review-${draft.id}`,
      title: `Review: ${draft.title}`,
      description: draft.rationale.why,
      priority: "high",
      kind: "review-draft",
      planActivityReference: draft.planActivityReference,
    });
  }

  return actions.slice(0, 6);
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
    for (const w of draft.warnings) {
      warnings.add(w);
    }
  }

  return [...warnings];
}
