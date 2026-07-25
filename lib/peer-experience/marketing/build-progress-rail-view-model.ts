import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { GeneratingActivity } from "@/lib/marketing-workspace/workflow-focus";
import { STUDIO_COPY } from "@/lib/i18n/studio-copy";
import type { DeliverableViewModel, TimelineViewModel } from "../types";

export type ProgressRailChapterId =
  | "understanding"
  | "strategy"
  | "plan"
  | "draft"
  | "publish"
  | "live";

export type ProgressRailChapterState = "completed" | "current" | "upcoming";

export type ProgressRailChapter = {
  id: ProgressRailChapterId;
  label: string;
  state: ProgressRailChapterState;
  /** Maps to timeline node id when chapter is selectable. */
  timelineNodeId?: string;
};

export type ProgressRailViewModel = {
  chapters: ProgressRailChapter[];
  currentChapterId: ProgressRailChapterId;
};

const CHAPTER_ORDER: ProgressRailChapterId[] = [
  "understanding",
  "strategy",
  "plan",
  "draft",
  "publish",
  "live",
];

const CHAPTER_LABELS: Record<ProgressRailChapterId, string> = {
  understanding: STUDIO_COPY.progressRail.understanding,
  strategy: STUDIO_COPY.progressRail.strategy,
  plan: STUDIO_COPY.progressRail.plan,
  draft: STUDIO_COPY.progressRail.draft,
  publish: STUDIO_COPY.progressRail.publish,
  live: STUDIO_COPY.progressRail.live,
};

export type BuildProgressRailInput = {
  understanding: MarketingUnderstanding | null;
  timeline: TimelineViewModel;
  deliverable: DeliverableViewModel;
  generating: GeneratingActivity | null;
};

function isUnderstandingComplete(understanding: MarketingUnderstanding | null): boolean {
  return Boolean(understanding?.available && understanding.completeness >= 50);
}

function resolveCurrentChapterId(input: BuildProgressRailInput): ProgressRailChapterId {
  const { understanding, timeline, deliverable, generating } = input;

  if (generating === "understanding") return "understanding";
  if (!isUnderstandingComplete(understanding)) return "understanding";

  if (generating === "strategy") return "strategy";
  if (generating === "plan") return "plan";
  if (generating === "draft") return "draft";
  if (generating === "publication") return "publish";

  switch (deliverable.kind) {
    case "empty":
      if (!isUnderstandingComplete(understanding)) return "understanding";
      break;
    case "document":
      if (deliverable.documentType === "understanding") return "understanding";
      if (deliverable.documentType === "strategy") return "strategy";
      if (deliverable.documentType === "plan") return "plan";
      break;
    case "content":
      return deliverable.reviewable ? "draft" : "draft";
    case "publish-preview":
      return "publish";
    case "complete":
      return "live";
  }

  const currentNodeId = timeline.currentNodeId;
  if (currentNodeId?.startsWith("milestone:knowledge")) return "understanding";
  if (currentNodeId?.startsWith("milestone:strategy")) return "strategy";
  if (currentNodeId?.startsWith("milestone:plan")) return "plan";
  if (currentNodeId?.startsWith("content:")) return "draft";

  if (isUnderstandingComplete(understanding)) {
    const hasStrategy = timeline.nodes.some(
      (node) => node.id === "milestone:strategy" && node.progress === "completed"
    );
    const hasPlan = timeline.nodes.some(
      (node) => node.id === "milestone:plan" && node.progress === "completed"
    );
    if (!hasStrategy) return "strategy";
    if (!hasPlan) return "plan";
  }

  return "draft";
}

function timelineNodeForChapter(
  chapterId: ProgressRailChapterId,
  timeline: TimelineViewModel
): string | undefined {
  switch (chapterId) {
    case "understanding":
      return "milestone:knowledge";
    case "strategy":
      return "milestone:strategy";
    case "plan":
      return "milestone:plan";
    case "draft": {
      const contentNode =
        timeline.nodes.find((node) => node.id.startsWith("content:") && node.progress === "current") ??
        timeline.nodes.find((node) => node.id.startsWith("content:"));
      return contentNode?.id;
    }
    case "publish":
    case "live":
      return undefined;
  }
}

export function buildProgressRailViewModel(input: BuildProgressRailInput): ProgressRailViewModel {
  const currentChapterId = resolveCurrentChapterId(input);
  const currentIndex = CHAPTER_ORDER.indexOf(currentChapterId);

  const chapters: ProgressRailChapter[] = CHAPTER_ORDER.map((id, index) => {
    let state: ProgressRailChapterState = "upcoming";
    if (index < currentIndex) state = "completed";
    else if (index === currentIndex) state = "current";

    return {
      id,
      label: CHAPTER_LABELS[id],
      state,
      timelineNodeId: timelineNodeForChapter(id, input.timeline),
    };
  });

  return { chapters, currentChapterId };
}

export function progressRailChapterToTimelineNodeId(
  chapterId: ProgressRailChapterId,
  timeline: TimelineViewModel
): string | null {
  return timelineNodeForChapter(chapterId, timeline) ?? null;
}
