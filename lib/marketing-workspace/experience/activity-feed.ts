import type { MarketingUnderstanding, MarketingUnderstandingDimension } from "@/lib/marketing-intelligence";
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

export function formatGapLabel(gap: string): string {
  return gap
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** Drop resolved knowledge gaps and refresh understanding completeness in the feed. */
export function syncActivityFeedWithUnderstanding(
  feed: ActivityFeedItem[],
  understanding: MarketingUnderstanding | null
): ActivityFeedItem[] {
  const activeGaps = new Set(understanding?.gaps ?? []);

  let next = feed.filter(
    (item) =>
      item.activityType !== "gap_detected" ||
      (item.relatedObject != null &&
        activeGaps.has(item.relatedObject as MarketingUnderstandingDimension))
  );

  if (!understanding?.available) {
    return next;
  }

  const completenessLabel = `${understanding.completeness}% of marketing dimensions covered.`;
  const loadedIndex = next.findIndex((item) => item.activityType === "understanding_loaded");

  if (loadedIndex >= 0) {
    next = next.map((item, index) =>
      index === loadedIndex ? { ...item, description: completenessLabel } : item
    );
  } else {
    next = prependActivity(
      next,
      createActivity(
        "understanding_loaded",
        "Loaded marketing understanding",
        completenessLabel
      )
    );
  }

  for (const gap of understanding.gaps.slice(0, 2)) {
    if (!next.some((item) => item.activityType === "gap_detected" && item.relatedObject === gap)) {
      next = prependActivity(
        next,
        createActivity(
          "gap_detected",
          "Detected missing information",
          formatGapLabel(gap),
          { relatedObject: gap }
        )
      );
    }
  }

  return next;
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
