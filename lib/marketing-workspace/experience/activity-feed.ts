import type { ActivityFeedItem, ActivityType } from "./types";

export function createActivity(
  activityType: ActivityType,
  title: string,
  description: string,
  options?: { relatedObject?: string; confidence?: string; timestamp?: string }
): ActivityFeedItem {
  return {
    id: `${activityType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: options?.timestamp ?? new Date().toISOString(),
    activityType,
    title,
    description,
    relatedObject: options?.relatedObject,
    confidence: options?.confidence,
  };
}

export function formatActivityTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function prependActivity(
  feed: ActivityFeedItem[],
  item: ActivityFeedItem,
  maxItems = 50
): ActivityFeedItem[] {
  return [item, ...feed.filter((f) => f.id !== item.id)].slice(0, maxItems);
}

export function seedActivityFeedFromState(input: {
  understandingLoaded: boolean;
  gaps: string[];
  strategySummary?: string;
  planSummary?: string;
  drafts: { title: string; status: string; confidence: string }[];
}): ActivityFeedItem[] {
  const items: ActivityFeedItem[] = [];

  if (input.understandingLoaded) {
    items.push(
      createActivity(
        "understanding_loaded",
        "Loaded marketing understanding",
        "Reviewed Company DNA, Business Brain, and marketing profile."
      )
    );
  }

  for (const gap of input.gaps.slice(0, 3)) {
    items.push(
      createActivity(
        "gap_detected",
        "Detected missing information",
        gap.replace(/^Missing: /, ""),
        { relatedObject: gap }
      )
    );
  }

  if (input.strategySummary) {
    items.push(
      createActivity(
        "strategy_completed",
        "Completed marketing strategy",
        input.strategySummary.slice(0, 120)
      )
    );
  }

  if (input.planSummary) {
    items.push(
      createActivity(
        "plan_completed",
        "Created marketing plan",
        input.planSummary.slice(0, 120)
      )
    );
  }

  for (const draft of input.drafts) {
    if (draft.status === "draft" || draft.status === "ready_for_review") {
      items.push(
        createActivity(
          "waiting_approval",
          "Waiting for approval",
          `"${draft.title}" is ready for your review.`,
          { relatedObject: draft.title, confidence: draft.confidence }
        )
      );
    } else if (draft.status === "approved") {
      items.push(
        createActivity(
          "draft_approved",
          "Draft approved",
          `"${draft.title}" was approved.`,
          { relatedObject: draft.title }
        )
      );
    } else {
      items.push(
        createActivity(
          "draft_generated",
          `Generated ${draft.title}`,
          "Content draft created from the marketing plan.",
          { relatedObject: draft.title, confidence: draft.confidence }
        )
      );
    }
  }

  return items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
