import type { PrimaryAction } from "../types";
import type { MarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";

export type PrimaryActionIntent = Omit<PrimaryAction, "label">;

/**
 * Maps workflow focus to exactly ONE primary action intent.
 * Labels are resolved separately in maya-copy.ts.
 */
export function resolveMarketingPrimaryActionIntent(
  focus: MarketingWorkflowFocus
): PrimaryActionIntent | null {
  switch (focus.kind) {
    case "generating":
      return null;

    case "knowledge_incomplete":
      return {
        kind: "fill-gaps",
        knowledgeSection: focus.knowledgeSection,
      };

    case "ready_to_publish":
      return {
        kind: "mark-published",
        draftId: focus.draftId,
        planActivityReference: focus.planActivityReference,
      };

    case "draft_approved":
      return {
        kind: "prepare-publication",
        draftId: focus.draftId,
        planActivityReference: focus.planActivityReference,
      };

    case "draft_review":
      return {
        kind: "review-draft",
        draftId: focus.draftId,
        planActivityReference: focus.planActivityReference,
      };

    case "ready_for_strategy":
      return {
        kind: "generate-strategy",
      };

    case "strategy_complete":
      return {
        kind: "generate-plan",
      };

    case "write_next":
      return {
        kind: "create-draft",
        planActivityReference: focus.planActivityReference,
      };

    case "campaign_complete":
      return {
        kind: "generate-plan",
      };

    case "monitoring":
      return null;
  }
}
