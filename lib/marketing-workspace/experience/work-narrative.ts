import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { RecommendedAction } from "../types";
import { toConversationalRecommendations } from "./conversational-recommendations";
import { deriveCurrentFocus, type CurrentFocus } from "./current-focus";
import { derivePeerPresence } from "./presence";
import type { PeerPresence } from "./types";

export type WorkNarrative = {
  focus: CurrentFocus;
  presence: PeerPresence;
  primaryRecommendation: ReturnType<typeof toConversationalRecommendations>[number] | null;
  needsFromYou: string[];
  progressCompleted: string[];
};

export function buildWorkNarrative(input: {
  generating: "understanding" | "strategy" | "plan" | "draft" | null;
  generatingActivity?: string | null;
  understanding: MarketingUnderstanding | null;
  strategy: MarketingStrategy | null;
  plan: MarketingPlan | null;
  drafts: MarketingContentDraft[];
  recommendedActions: RecommendedAction[];
  apiWarnings: string[];
}): WorkNarrative {
  const pendingDrafts = input.drafts.filter(
    (d) => d.status === "draft" || d.status === "ready_for_review"
  );

  const focus = deriveCurrentFocus({
    generating: input.generating,
    generatingActivity: input.generatingActivity,
    pendingDraftTitle: pendingDrafts[0]?.title,
  });

  const presence = derivePeerPresence({
    generating: input.generating,
    understandingAvailable: input.understanding?.available ?? false,
    understandingCompleteness: input.understanding?.completeness ?? 0,
    hasStrategy: Boolean(input.strategy),
    hasPlan: Boolean(input.plan),
    pendingDraftCount: pendingDrafts.length,
    hasApprovedDrafts: input.drafts.some((d) => d.status === "approved"),
    gapCount: input.understanding?.gaps.length ?? 0,
  });

  const conversational = toConversationalRecommendations(input.recommendedActions);
  const primaryRecommendation = conversational[0] ?? null;

  const needsFromYou: string[] = [];

  for (const draft of pendingDrafts) {
    needsFromYou.push(`Review and approve "${draft.title}"`);
  }

  for (const gap of input.understanding?.gaps ?? []) {
    const label = gap
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
    needsFromYou.push(`Add ${label.toLowerCase()} in Knowledge`);
  }

  if (!input.strategy && input.understanding?.available) {
    needsFromYou.push("Confirm strategy direction — generate a strategy to continue");
  }

  if (input.plan && input.plan.contentCalendar.length > 0) {
    const undrafted = input.plan.contentCalendar.filter(
      (entry) =>
        !input.drafts.some(
          (d) =>
            d.planActivityReference.trim().toLowerCase() === entry.title.trim().toLowerCase()
        )
    );
    if (undrafted.length > 0 && pendingDrafts.length === 0 && !input.generating) {
      needsFromYou.push(`Choose a calendar slot to draft (e.g. "${undrafted[0].title}")`);
    }
  }

  // Only surface API warnings not already covered by gaps
  for (const warning of input.apiWarnings.slice(0, 2)) {
    if (!needsFromYou.some((n) => warning.includes(n.slice(0, 20)))) {
      needsFromYou.push(warning);
    }
  }

  const progressCompleted: string[] = [];
  if (input.understanding?.available && input.understanding.completeness >= 40) {
    progressCompleted.push("Marketing understanding reviewed");
  }
  if (input.strategy) progressCompleted.push("Marketing strategy");
  if (input.plan) progressCompleted.push("Execution plan");
  const approvedCount = input.drafts.filter((d) => d.status === "approved").length;
  if (approvedCount > 0) {
    progressCompleted.push(
      approvedCount === 1 ? "1 draft approved" : `${approvedCount} drafts approved`
    );
  }

  return {
    focus,
    presence,
    primaryRecommendation,
    needsFromYou: [...new Set(needsFromYou)].slice(0, 5),
    progressCompleted,
  };
}
