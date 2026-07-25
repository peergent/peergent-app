import type { MarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import type { RecommendedAction } from "@/lib/marketing-workspace";
import type { PrimaryAction } from "../types";
import { formatWriteNextActionLabel } from "./format-contextual-action-label";

/** Customer-facing labels for the single Studio primary invitation. */
export function resolvePrimaryActionLabel(focus: MarketingWorkflowFocus): string | null {
  switch (focus.kind) {
    case "generating":
    case "monitoring":
      return null;
    case "knowledge_incomplete":
      return "Fill in what's missing";
    case "ready_to_publish":
      return "Confirm it's live";
    case "draft_approved":
      return "Prepare it for the channel";
    case "draft_review":
      return "Review content";
    case "ready_for_strategy":
      return "Start my marketing strategy";
    case "strategy_complete":
      return "Build the campaign plan";
    case "write_next":
      return formatWriteNextActionLabel(focus.title, focus.scheduledWeek);
    case "campaign_complete":
      return "Plan what's next";
  }
}

export function attachPrimaryActionLabel(
  action: Omit<PrimaryAction, "label">,
  label: string
): PrimaryAction {
  return { ...action, label };
}

export type DraftReviewActionLabels = {
  approve: string;
  reject: string;
};

/** Secondary review actions in the draft detail panel — not the Now primary CTA. */
export const DRAFT_REVIEW_ACTION_LABELS: DraftReviewActionLabels = {
  approve: "Looks good",
  reject: "Send back for edits",
};

export type ArtifactPanelCopy = {
  emptyDrafts: string;
  readyToPublishHint: string;
};

/** Neutral copy for artifact panels — avoids duplicating Now-panel messaging. */
export const ARTIFACT_PANEL_COPY: ArtifactPanelCopy = {
  emptyDrafts: "No content yet.",
  readyToPublishHint: "Publication preview below.",
};

function workingLabelFor(
  state: Extract<MarketingWorkflowFocus, { kind: "generating" }>
): string {
  switch (state.activity) {
    case "understanding":
      return "Getting oriented…";
    case "strategy":
      return "Building your marketing strategy…";
    case "plan":
      return "Planning your campaign…";
    case "draft":
      return state.activityLabel
        ? `Writing "${state.activityLabel}"…`
        : "Writing your content…";
    case "publication":
      return state.activityLabel
        ? `Getting "${state.activityLabel}" ready to go live…`
        : "Getting your content ready to go live…";
  }
}

/** One human line for the presence strip — Maya's voice, not task metadata. */
export function buildMayaPresenceLine(focus: MarketingWorkflowFocus): string {
  switch (focus.kind) {
    case "generating":
      switch (focus.activity) {
        case "understanding":
          return "Getting oriented with your business.";
        case "strategy":
          return "Working on your strategy at the table.";
        case "plan":
          return "Mapping the campaign with you.";
        case "draft":
          return focus.activityLabel
            ? `Writing ${focus.activityLabel.toLowerCase()} now.`
            : "Writing at the table.";
        case "publication":
          return "Getting this ready for the channel.";
      }
    case "knowledge_incomplete":
      return "I could use a little more context before I proceed.";
    case "ready_to_publish":
      return "One step from live — I'll wait for your word.";
    case "draft_approved":
      return "This one feels ready for the next step.";
    case "draft_review":
      return "I've left something here for your eyes.";
    case "ready_for_strategy":
      return "I'm here and ready to begin.";
    case "strategy_complete":
      return "Good foundation — say when to plan the campaign.";
    case "write_next":
      return "I'm here when you're ready.";
    case "campaign_complete":
      return "We closed this chapter nicely.";
    case "monitoring":
      return "I'm here when you need me.";
  }
}

export function buildMayaNowCopy(
  focus: MarketingWorkflowFocus,
  primaryAction: PrimaryAction | null
): Omit<import("../types").NowViewModel, "primaryAction"> {
  const presenceLine = buildMayaPresenceLine(focus);

  switch (focus.kind) {
    case "generating":
      return {
        presence: "working",
        presenceLine,
        workingLabel: workingLabelFor(focus),
        headline:
          focus.activity === "understanding"
            ? "I'm getting to know your business."
            : focus.activity === "strategy"
              ? "I'm putting together your marketing strategy."
              : focus.activity === "plan"
                ? "I'm planning your next marketing activities."
                : focus.activity === "draft"
                  ? focus.activityLabel
                    ? `I'm writing "${focus.activityLabel}".`
                    : "I'm writing your content."
                  : focus.activityLabel
                    ? `I'm getting "${focus.activityLabel}" ready to go live.`
                    : "I'm getting your content ready to go live.",
        detail:
          focus.activity === "draft"
            ? "This usually takes about a minute."
            : undefined,
      };

    case "knowledge_incomplete":
      return {
        presence: "waiting",
        presenceLine,
        headline: "I noticed we're missing some business information.",
        detail: "Add a few details so I can work confidently on your marketing.",
      };

    case "ready_to_publish":
      return {
        presence: "waiting",
        presenceLine,
        headline: "Everything is ready to go live.",
        detail: `Copy the preview for "${focus.title}", post it to the channel, then confirm here when it's live.`,
      };

    case "draft_approved":
      return {
        presence: "live",
        presenceLine,
        headline: `"${focus.title}" looks good.`,
        detail: "I'll format it for the right channel — nothing goes live until you confirm.",
      };

    case "draft_review":
      return {
        presence: "waiting",
        presenceLine,
        headline: `I've finished "${focus.title}".`,
        detail: "I'm waiting for your feedback.",
      };

    case "ready_for_strategy":
      return {
        presence: "live",
        presenceLine,
        headline: "I'm ready to build your marketing strategy.",
        detail: "I have enough context about your business to get started.",
      };

    case "strategy_complete":
      return {
        presence: "live",
        presenceLine,
        headline: "Your marketing strategy is ready.",
        detail: "Next I'll turn it into a campaign plan with specific content to create.",
      };

    case "write_next": {
      const week =
        focus.scheduledWeek != null ? ` — week ${focus.scheduledWeek}` : "";
      return {
        presence: "live",
        presenceLine,
        headline: `Next up: "${focus.title}"${week}.`,
        detail: "I can start writing whenever you're ready.",
      };
    }

    case "campaign_complete":
      return {
        presence: "live",
        presenceLine,
        headline: "This campaign cycle is complete.",
        detail: "All planned pieces are live. Ready to plan what's next?",
      };

    case "monitoring":
      return {
        presence: "live",
        presenceLine,
        headline: primaryAction
          ? "I'm keeping an eye on your campaign."
          : "I'm here when you need me.",
        detail: primaryAction ? undefined : "Open the sections below to review our work so far.",
      };
  }
}
