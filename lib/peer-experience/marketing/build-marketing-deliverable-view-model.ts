import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";
import type { DeliverableDocumentType, DeliverableViewModel } from "../types";
import type { ResolveMarketingWorkflowFocusInput } from "@/lib/marketing-workspace/workflow-focus";
import {
  contentTimelineNodeId,
  milestoneTimelineNodeId,
  resolveEffectiveTimelineSelection,
  type MarketingTimelineMilestone,
  type MarketingTimelineSnapshot,
} from "@/lib/marketing-workspace/timeline-nodes";
import type { WorkspaceRegion } from "@/lib/marketing-workspace/experience/navigation";
import {
  completeContentCopy,
  emptyContentCopy,
  emptyMilestoneCopy,
  humanReviewStatusLabel,
  mutedContentCopy,
  workingContentCopy,
} from "./deliverable-copy";
import { milestoneLabel } from "./timeline-config";
import {
  formatDraftAsPublishPreview,
  formatPublicationPackagePreview,
  humanChannelLabel,
} from "./publish-preview-formatters";

export type BuildMarketingDeliverableInput = ResolveMarketingWorkflowFocusInput & {
  snapshot: MarketingTimelineSnapshot;
  selectedNodeId: string | null;
};

function activityKey(title: string): string {
  return title.trim().toLowerCase();
}

function parseMilestone(nodeId: string): MarketingTimelineMilestone | null {
  if (nodeId === milestoneTimelineNodeId("knowledge")) return "knowledge";
  if (nodeId === milestoneTimelineNodeId("strategy")) return "strategy";
  if (nodeId === milestoneTimelineNodeId("plan")) return "plan";
  return null;
}

function parseContentTitle(nodeId: string, plan: MarketingPlan | null): string | null {
  if (!nodeId.startsWith("content:")) return null;
  const key = nodeId.slice("content:".length);
  const entry = plan?.contentCalendar.find(
    (item) => activityKey(item.title) === key
  );
  return entry?.title ?? null;
}

function findDraftForActivity(
  title: string,
  drafts: MarketingContentDraft[]
): MarketingContentDraft | undefined {
  return drafts.find(
    (draft) => activityKey(draft.planActivityReference) === activityKey(title)
  );
}

function findCalendarEntry(plan: MarketingPlan | null, title: string) {
  return plan?.contentCalendar.find((entry) => activityKey(entry.title) === activityKey(title));
}

function isGeneratingActivity(
  input: BuildMarketingDeliverableInput,
  activityTitle: string
): boolean {
  if (!input.generating) return false;
  if (input.generating === "draft") {
    return activityKey(input.generatingActivity ?? "") === activityKey(activityTitle);
  }
  if (input.generating === "publication") {
    return activityKey(input.generatingActivity ?? "") === activityKey(activityTitle);
  }
  return false;
}

function buildDocumentDeliverable(
  documentType: DeliverableDocumentType,
  input: BuildMarketingDeliverableInput
): DeliverableViewModel {
  const inspectRegion: WorkspaceRegion =
    documentType === "understanding"
      ? "understanding"
      : documentType === "strategy"
        ? "strategy"
        : "plan";

  if (documentType === "understanding") {
    const understanding = input.understanding;
    if (!understanding?.available) {
      const copy = emptyMilestoneCopy("knowledge");
      return { kind: "empty", ...copy };
    }

    return {
      kind: "document",
      documentType,
      title: milestoneLabel("knowledge"),
      summary:
        understanding.brand.positioningStatement ??
        "Verified business context for your marketing.",
      metadata: [
        { label: "Completeness", value: `${understanding.completeness}%` },
        { label: "Products", value: String(understanding.products.length) },
        { label: "Segments", value: String(understanding.customerSegments.length) },
      ],
      inspectRegion,
    };
  }

  if (documentType === "strategy") {
    if (!input.strategy) {
      const copy = emptyMilestoneCopy("strategy");
      return { kind: "empty", ...copy };
    }

    return {
      kind: "document",
      documentType,
      title: milestoneLabel("strategy"),
      summary: input.strategy.summary,
      metadata: [
        { label: "Audiences", value: String(input.strategy.targetAudiences.length) },
        { label: "Content pillars", value: String(input.strategy.contentPillars.length) },
        { label: "Confidence", value: input.strategy.confidence },
      ],
      inspectRegion,
    };
  }

  if (!input.plan) {
    const copy = emptyMilestoneCopy("plan");
    return { kind: "empty", ...copy };
  }

  return {
    kind: "document",
    documentType: "plan",
    title: milestoneLabel("plan"),
    summary: input.plan.summary,
    metadata: [
      { label: "Planned pieces", value: String(input.plan.contentCalendar.length) },
      { label: "Campaigns", value: String(input.plan.campaigns.length) },
      { label: "Confidence", value: input.plan.confidence },
    ],
    inspectRegion,
  };
}

function buildContentDeliverable(
  draft: MarketingContentDraft,
  publicationPackage?: PublicationPackage
): DeliverableViewModel {
  const channel = humanChannelLabel(draft);

  if (draft.status === "published") {
    return {
      kind: "complete",
      draftId: draft.id,
      title: draft.title,
      channel,
      message: completeContentCopy(draft.title, channel).message,
      completedAt: publicationPackage?.publishedAt,
    };
  }

  if (draft.status === "approved" || draft.status === "ready_to_publish") {
    const preview = publicationPackage
      ? formatPublicationPackagePreview(publicationPackage)
      : formatDraftAsPublishPreview(draft);

    return {
      kind: "publish-preview",
      draftId: draft.id,
      title: draft.title,
      channel,
      previewTitle: preview.title,
      previewBody: preview.body,
      copyText: preview.copyText,
    };
  }

  const reviewable = draft.status === "draft" || draft.status === "ready_for_review";

  return {
    kind: "content",
    draftId: draft.id,
    title: draft.title,
    channel,
    body: draft.body,
    reviewStatusLabel: humanReviewStatusLabel(draft.status),
    reviewable,
    targetAudience: draft.targetAudience,
    callToAction: draft.callToAction,
    rationale: draft.rationale?.why,
  };
}

function buildContentNodeDeliverable(
  activityTitle: string,
  input: BuildMarketingDeliverableInput
): DeliverableViewModel {
  const entry = findCalendarEntry(input.plan, activityTitle);
  const draft = findDraftForActivity(activityTitle, input.drafts);
  const publicationPackage = draft
    ? input.publicationPackages?.find((pkg) => pkg.draftId === draft.id)
    : undefined;

  if (draft) {
    return buildContentDeliverable(draft, publicationPackage);
  }

  if (entry && !isDraftablePlanActivity(entry)) {
    return { kind: "empty", ...mutedContentCopy(activityTitle) };
  }

  if (isGeneratingActivity(input, activityTitle)) {
    const copy = workingContentCopy(activityTitle);
    return { kind: "empty", ...copy, working: true };
  }

  return { kind: "empty", ...emptyContentCopy(activityTitle) };
}

export function buildMarketingDeliverableViewModel(
  input: BuildMarketingDeliverableInput
): DeliverableViewModel {
  const selectedNodeId = resolveEffectiveTimelineSelection(
    input.snapshot,
    input.selectedNodeId
  );

  if (!selectedNodeId) {
    return {
      kind: "empty",
      title: "Campaign",
      message: "Select a step on the timeline to see what we're working on.",
    };
  }

  const milestone = parseMilestone(selectedNodeId);
  if (milestone) {
    const documentType: DeliverableDocumentType =
      milestone === "knowledge"
        ? "understanding"
        : milestone === "strategy"
          ? "strategy"
          : "plan";
    return buildDocumentDeliverable(documentType, input);
  }

  const activityTitle = parseContentTitle(selectedNodeId, input.plan);
  if (!activityTitle) {
    return {
      kind: "empty",
      title: "Content",
      message: "This item is no longer in the campaign plan.",
      detail: "Select another step on the timeline.",
    };
  }

  return buildContentNodeDeliverable(activityTitle, input);
}

export function resolveSelectedTimelineNodeId(
  snapshot: MarketingTimelineSnapshot,
  selectedTimelineNodeId: string | null
): string | null {
  return resolveEffectiveTimelineSelection(snapshot, selectedTimelineNodeId);
}
