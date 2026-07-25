import type { MarketingTimelineMilestone } from "@/lib/marketing-workspace/timeline-nodes";

export function emptyMilestoneCopy(milestone: MarketingTimelineMilestone): {
  title: string;
  message: string;
  detail?: string;
} {
  switch (milestone) {
    case "knowledge":
      return {
        title: "Business context",
        message: "I use your business profile to shape every recommendation.",
        detail: "Add products, positioning, and audience details in Knowledge when you're ready.",
      };
    case "strategy":
      return {
        title: "Marketing strategy",
        message: "Your strategy will live here once we create it together.",
        detail: "Say when you'd like me to build it from your business context.",
      };
    case "plan":
      return {
        title: "Campaign plan",
        message: "I'll map out specific content and timing once the strategy is in place.",
        detail: "Say when you're ready to turn strategy into a plan.",
      };
  }
}

export function emptyContentCopy(activityTitle: string): {
  title: string;
  message: string;
  detail?: string;
} {
  return {
    title: activityTitle,
    message: "This piece hasn't been written yet.",
    detail: "When you're ready, I'll draft it here at the table.",
  };
}

export function workingContentCopy(activityTitle: string): {
  title: string;
  message: string;
} {
  return {
    title: activityTitle,
    message: `I'm writing "${activityTitle}" now — this usually takes about a minute.`,
  };
}

export function mutedContentCopy(activityTitle: string): {
  title: string;
  message: string;
  detail?: string;
} {
  return {
    title: activityTitle,
    message: "This slot isn't available for drafting yet.",
    detail: "Regenerate the campaign plan to replace it with a supported format.",
  };
}

export function completeContentCopy(title: string, channel: string): {
  message: string;
} {
  return {
    message: `Your ${channel.toLowerCase()} piece "${title}" is live.`,
  };
}

export function humanReviewStatusLabel(status: string): string {
  switch (status) {
    case "draft":
    case "ready_for_review":
      return "Awaiting your review";
    case "rejected":
      return "Needs your feedback";
    case "approved":
      return "Approved";
    case "ready_to_publish":
      return "Ready to go live";
    case "published":
      return "Published";
    default:
      return "In progress";
  }
}
