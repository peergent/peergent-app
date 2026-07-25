import type {
  MarketingContentItem,
  MarketingContentPerformanceMetric,
  MarketingContentStatus,
} from "../domain/marketing-peer-types";
import { buildApprovalDeliverable } from "../approval/build-approval-deliverable";
import { getContentHref, getPerformanceHref, getProjectHref, getReviewHref } from "../navigation/marketing-peer-links";
import { humanChannelLabel } from "../publish-preview-formatters";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";
import { buildContentPerformanceSummary } from "./build-content-performance-summary";
import { findProjectIdForDraft } from "./build-marketing-project-detail-view-model";

export type MarketingContentViewModel = {
  items: MarketingContentItem[];
  emptyMessage: string;
};

function mapDraftStatus(status: string): MarketingContentStatus {
  if (status === "ready_for_review") return "ready_for_review";
  if (status === "approved") return "approved";
  if (status === "ready_to_publish") return "scheduled";
  if (status === "published") return "published";
  return "draft";
}

export function buildMarketingContentViewModel(
  input: MarketingPeerDomainInput
): MarketingContentViewModel {
  const items: MarketingContentItem[] = input.drafts.map((draft) => {
    const overlay = input.approvalOverlays?.[draft.id];
    const workUnit = input.workUnits.find((u) => u.draftId === draft.id) ?? null;
    const projectId = findProjectIdForDraft(draft.id, input);
    const project = projectId ? input.projects.find((p) => p.id === projectId) : undefined;
    const deliverable = buildApprovalDeliverable({
      draft,
      workUnit,
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
      contentType: draft.contentType,
      status: mapDraftStatus(draft.status),
      publishedAt: draft.status === "published" ? draft.generatedAt : undefined,
      scheduledAt: overlay?.publishing?.scheduledAt,
      campaign: (project?.title ?? input.campaignTitle) || undefined,
      projectId: projectId ?? undefined,
      projectTitle: project?.title,
      projectHref: projectId ? getProjectHref(input.peerId, projectId) : undefined,
      thumbnailUrl: thumb || undefined,
      performanceSummary:
        draft.status === "published"
          ? "View performance after channels sync"
          : undefined,
      href: getContentHref(input.peerId, draft.id),
      performanceHref: getPerformanceHref(input.peerId, {
        contentId: draft.id,
        channel: draft.channel ?? draft.contentType,
      }),
    };
  });

  return {
    items: items.sort(
      (a, b) =>
        new Date(b.publishedAt ?? b.scheduledAt ?? 0).getTime() -
        new Date(a.publishedAt ?? a.scheduledAt ?? 0).getTime()
    ),
    emptyMessage: `${input.peerName} hasn't created content yet. Assign work to get started.`,
  };
}

export type MarketingContentDetailViewModel = {
  item: MarketingContentItem;
  deliverable: ReturnType<typeof buildApprovalDeliverable>;
  workUnitId: string | null;
  workUnitTitle: string | null;
  workUnitHref: string | null;
  reviewHref: string;
  performanceHref: string;
  performance: {
    metrics: MarketingContentPerformanceMetric[];
    emptyMessage: string;
    hasLiveData: boolean;
  };
  createdAt: string;
};

export function buildMarketingContentDetailViewModel(
  input: MarketingPeerDomainInput & { contentId: string }
): MarketingContentDetailViewModel | null {
  const draft = input.drafts.find((d) => d.id === input.contentId);
  if (!draft) return null;

  const vm = buildMarketingContentViewModel(input);
  const item = vm.items.find((i) => i.id === input.contentId);
  if (!item) return null;

  const deliverable = buildApprovalDeliverable({
    draft,
    workUnit: input.workUnits.find((u) => u.draftId === draft.id) ?? null,
    overlay: input.approvalOverlays?.[draft.id],
    connections: input.connections,
    peerName: input.peerName,
  });

  const workUnit = input.workUnits.find((u) => u.draftId === draft.id);
  const projectId = findProjectIdForDraft(draft.id, input);
  const project = projectId ? input.projects.find((p) => p.id === projectId) : undefined;
  const performance = buildContentPerformanceSummary(
    input,
    draft.id,
    draft.status === "published"
  );

  return {
    item,
    deliverable,
    workUnitId: workUnit?.id ?? null,
    workUnitTitle: project?.title ?? workUnit?.title ?? null,
    workUnitHref: projectId
      ? getProjectHref(input.peerId, projectId)
      : workUnit
        ? getProjectHref(input.peerId)
        : null,
    reviewHref: getReviewHref(input.peerId, draft.id),
    performanceHref: getPerformanceHref(input.peerId, {
      contentId: draft.id,
      channel: draft.channel ?? draft.contentType,
    }),
    performance,
    createdAt: draft.generatedAt,
  };
}
