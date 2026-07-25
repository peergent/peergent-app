import type { MarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";

/** Emma workspace header status — concrete, never vague. */
export function buildEmmaPresenceLine(focus: MarketingWorkflowFocus): string {
  switch (focus.kind) {
    case "generating":
      switch (focus.activity) {
        case "understanding":
          return "Getting oriented with your business";
        case "strategy":
          return "Building your marketing strategy";
        case "plan":
          return "Planning your campaign";
        case "draft":
          return focus.activityLabel
            ? `Creating your ${focus.activityLabel.toLowerCase()}`
            : "Creating content";
        case "publication":
          return focus.activityLabel
            ? `Publishing to ${focus.activityLabel.toLowerCase()}`
            : "Publishing your content";
      }
    case "knowledge_incomplete":
      return "Getting oriented with your business";
    case "draft_review":
      return "One item is waiting for approval";
    case "draft_approved":
      return "Preparing approved content for publication";
    case "ready_to_publish":
      return "Ready to publish — waiting for your confirmation";
    case "write_next":
      return focus.title
        ? `Ready to create "${focus.title}"`
        : "Ready for the next piece of content";
    case "ready_for_strategy":
      return "Ready to start your marketing strategy";
    case "strategy_complete":
      return "Strategy complete — ready to plan the campaign";
    case "campaign_complete":
      return "Monitoring campaign performance";
    case "monitoring":
      return "Monitoring campaign performance";
  }
}
