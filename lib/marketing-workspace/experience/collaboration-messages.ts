import type { CollaborationMessage } from "./types";

export type CollaborationInput = {
  peerName: string;
  pendingDraftCount: number;
  gapCount: number;
  understandingCompleteness: number;
  hasStrategy: boolean;
  hasPlan: boolean;
  undraftedCalendarCount: number;
  generating: boolean;
};

export function deriveCollaborationMessage(
  input: CollaborationInput
): CollaborationMessage | null {
  if (input.generating) {
    return null;
  }

  if (input.pendingDraftCount > 0) {
    return {
      id: "approval-needed",
      message:
        input.pendingDraftCount === 1
          ? "I'm ready for your feedback — one draft is waiting for approval."
          : `I'm ready for your feedback — ${input.pendingDraftCount} drafts are waiting for approval.`,
      tone: "approval",
    };
  }

  if (input.gapCount > 0 && input.understandingCompleteness < 50) {
    return {
      id: "gap-found",
      message:
        "I found a gap in your positioning. I need more information before continuing confidently.",
      tone: "gap",
    };
  }

  if (input.hasStrategy && !input.hasPlan) {
    return {
      id: "plan-ready",
      message:
        "Strategy is ready. Trigger Create plan when you want me to build the execution calendar.",
      tone: "ready",
    };
  }

  if (input.hasPlan && input.undraftedCalendarCount > 0) {
    return {
      id: "draft-ready",
      message: `${input.undraftedCalendarCount} calendar ${input.undraftedCalendarCount === 1 ? "slot needs" : "slots need"} a draft — pick one in the calendar when you're ready.`,
      tone: "info",
    };
  }

  if (!input.hasStrategy && input.understandingCompleteness >= 50) {
    return {
      id: "strategy-suggest",
      message:
        "I have enough context to draft a strategy. Use Generate strategy when you want me to start.",
      tone: "ready",
    };
  }

  return null;
}
