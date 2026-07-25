import type { RecommendedAction } from "../types";
import type { ConversationalRecommendation } from "./types";

/**
 * @deprecated Superseded by lib/peer-experience/marketing/maya-copy.ts (Sprint 11).
 * Maps engine recommendations to display fields without duplicating Maya voice copy.
 */
export function toConversationalRecommendations(
  actions: RecommendedAction[]
): ConversationalRecommendation[] {
  return actions.map((action) => ({
    id: action.id,
    peerMessage: action.description,
    why: action.description,
    actionLabel: action.title,
    kind: action.kind,
    priority: action.priority,
    knowledgeSection: action.knowledgeSection,
    planActivityReference: action.planActivityReference,
  }));
}
