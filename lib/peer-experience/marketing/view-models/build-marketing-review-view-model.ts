import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import {
  buildApprovalDeliverable,
  resolveApprovalConnectionState,
} from "../approval/build-approval-deliverable";
import type {
  ApprovalDeliverable,
  ApprovalConnectionState,
} from "../approval/types";
import type { MarketingReviewFilter, MarketingReviewQueueItem } from "../domain/marketing-peer-types";
import { getReviewHref } from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type MarketingReviewViewModel = {
  filter: MarketingReviewFilter;
  queue: MarketingReviewQueueItem[];
  selectedDraftId: string | null;
  selectedDeliverable: ApprovalDeliverable | null;
  selectedConnection: ApprovalConnectionState | null;
  emptyMessage: string;
};

function mapDraftToReviewStatus(draft: MarketingContentDraft): MarketingReviewFilter {
  switch (draft.status) {
    case "ready_for_review":
    case "draft":
      return "needs_review";
    case "rejected":
      return "changes_requested";
    case "approved":
      return "approved";
    case "ready_to_publish":
      return "scheduled";
    case "published":
      return "published";
    default:
      return "needs_review";
  }
}

function draftsForFilter(
  drafts: MarketingContentDraft[],
  filter: MarketingReviewFilter
): MarketingContentDraft[] {
  return drafts.filter((d) => mapDraftToReviewStatus(d) === filter);
}

export function buildMarketingReviewViewModel(
  input: MarketingPeerDomainInput & {
    filter?: MarketingReviewFilter;
    selectedDraftId?: string | null;
  }
): MarketingReviewViewModel {
  const filter = input.filter ?? "needs_review";
  const filtered = draftsForFilter(input.drafts, filter);

  const queue: MarketingReviewQueueItem[] = filtered.map((draft) => {
    const overlay = input.approvalOverlays?.[draft.id];
    const deliverable = buildApprovalDeliverable({
      draft,
      workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
      overlay,
      connections: input.connections,
      peerName: input.peerName,
    });
    const thumb = deliverable.media[0]?.thumbnailUrl ?? deliverable.media[0]?.url;
    return {
      id: draft.id,
      draftId: draft.id,
      title: draft.title,
      channel: humanChannelLabel(draft),
      status: mapDraftToReviewStatus(draft),
      scheduledAt: overlay?.publishing?.scheduledAt,
      thumbnailUrl: thumb || undefined,
    };
  });

  const selectedDraftId =
    input.selectedDraftId && queue.some((q) => q.draftId === input.selectedDraftId)
      ? input.selectedDraftId
      : queue[0]?.draftId ?? null;

  let selectedDeliverable: ApprovalDeliverable | null = null;
  let selectedConnection: ApprovalConnectionState | null = null;

  if (selectedDraftId) {
    const draft = input.drafts.find((d) => d.id === selectedDraftId);
    if (draft) {
      selectedDeliverable = buildApprovalDeliverable({
        draft,
        workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
        overlay: input.approvalOverlays?.[draft.id],
        connections: input.connections,
        peerName: input.peerName,
      });
      selectedConnection = resolveApprovalConnectionState(selectedDeliverable.account);
    }
  }

  return {
    filter,
    queue,
    selectedDraftId,
    selectedDeliverable,
    selectedConnection,
    emptyMessage:
      filter === "needs_review"
        ? `${input.peerName} doesn't need your approval right now.`
        : `No items in ${filter.replace("_", " ")}.`,
  };
}

export function reviewFilters(): Array<{ id: MarketingReviewFilter; label: string }> {
  return [
    { id: "needs_review", label: "Needs review" },
    { id: "changes_requested", label: "Changes requested" },
    { id: "approved", label: "Approved" },
    { id: "scheduled", label: "Scheduled" },
    { id: "published", label: "Published history" },
  ];
}

export function reviewHrefWithFilter(
  peerId: string,
  filter: MarketingReviewFilter,
  deliverableId?: string
): string {
  return getReviewHref(peerId, deliverableId, filter);
}
