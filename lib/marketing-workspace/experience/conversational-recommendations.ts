import type { RecommendedAction } from "../types";
import type { ConversationalRecommendation } from "./types";

const CONVERSATIONAL: Record<
  RecommendedAction["kind"],
  (action: RecommendedAction) => ConversationalRecommendation
> = {
  "fill-gaps": (action) => ({
    id: action.id,
    peerMessage:
      "I found gaps in your business knowledge. I need more information before I can work confidently.",
    why: "Without complete products, segments, and positioning data, my recommendations may be incomplete or inaccurate.",
    actionLabel: "Complete knowledge",
    kind: action.kind,
    priority: action.priority,
  }),
  "generate-strategy": (action) => ({
    id: action.id,
    peerMessage:
      "When you're ready, generate a marketing strategy — I'll produce it from your verified business context.",
    why: "Strategy aligns audience, positioning, and campaigns before any content work begins.",
    actionLabel: "Generate strategy",
    kind: action.kind,
    priority: action.priority,
  }),
  "generate-plan": (action) => ({
    id: action.id,
    peerMessage:
      "Your strategy is on file. Trigger Create plan when you want the execution calendar.",
    why: "The plan turns strategy into a timeline, content calendar, and campaign milestones.",
    actionLabel: "Create plan",
    kind: action.kind,
    priority: action.priority,
  }),
  "create-draft": (action) => ({
    id: action.id,
    peerMessage: `"${action.planActivityReference}" is scheduled — I'll draft it when you trigger Create draft.`,
    why: action.description,
    actionLabel: "Create draft",
    kind: action.kind,
    planActivityReference: action.planActivityReference,
    priority: action.priority,
  }),
  "review-draft": (action) => ({
    id: action.id,
    peerMessage: "A draft is waiting — I haven't received your decision yet.",
    why: action.description,
    actionLabel: "Review draft",
    kind: action.kind,
    planActivityReference: action.planActivityReference,
    priority: action.priority,
  }),
};

export function toConversationalRecommendations(
  actions: RecommendedAction[]
): ConversationalRecommendation[] {
  return actions.map((action) => CONVERSATIONAL[action.kind](action));
}
