import type { HandoffState, HandoffUrgency, HandoffPrimaryWork } from "@/lib/home/handoff-types";
import type { HomeNeedsYouItem, HomeViewModel } from "@/lib/home";

export type PrimaryActionPresentation = {
  work: HandoffPrimaryWork;
  categoryLabel: string;
  urgency: HandoffUrgency;
  ctaLabel?: string;
  peerRole?: string;
};

function urgencyFromPriority(priority: HomeNeedsYouItem["priority"]): HandoffUrgency {
  if (priority === "urgent") return "urgent";
  return "normal";
}

function primaryFromNeedsYou(top: HomeNeedsYouItem): HandoffPrimaryWork {
  const title =
    top.subtitle && top.subtitle !== top.peerName ? top.subtitle : top.title.replace(/^Review /i, "");

  return {
    id: top.id,
    title,
    peerName: top.peerName,
    peerId: top.peerId,
    completedAt: top.timestamp ?? null,
    completedAtLabel: null,
    contextLine: top.context,
    destination: top.href,
    kind: top.href.includes("/company") || top.href.includes("/knowledge") ? "context" : "draft",
  };
}

/** First actionable item for PrimaryWorkCard — never duplicated in AttentionQueue. */
export function primaryActionForHome(
  handoff: HandoffState,
  viewModel: HomeViewModel | null
): PrimaryActionPresentation | null {
  if (handoff.primaryWork) {
    return {
      work: handoff.primaryWork,
      categoryLabel: handoff.categoryLabel,
      urgency: handoff.urgency,
      peerRole: handoff.responsiblePeer?.role,
    };
  }

  const topNeed = viewModel?.needsYou[0];
  if (topNeed) {
    return {
      work: primaryFromNeedsYou(topNeed),
      categoryLabel: handoff.categoryLabel,
      urgency: urgencyFromPriority(topNeed.priority),
      peerRole: handoff.responsiblePeer?.role,
    };
  }

  const suggested = viewModel?.suggestedStart;
  if (suggested) {
    return {
      work: {
        id: "suggested-start",
        title: suggested.headline,
        peerName: handoff.responsiblePeer?.name ?? "",
        peerId: handoff.responsiblePeer?.id ?? "",
        completedAt: null,
        completedAtLabel: null,
        contextLine: suggested.detail,
        destination: suggested.href,
        kind: "workspace",
      },
      categoryLabel: handoff.categoryLabel,
      urgency: handoff.urgency,
      ctaLabel: suggested.ctaLabel,
      peerRole: handoff.responsiblePeer?.role,
    };
  }

  return null;
}

/** Remaining attention items — excludes the first actionable item. */
export function attentionItemsForHome(
  viewModel: HomeViewModel | null,
  primaryWorkId?: string | null
): HomeNeedsYouItem[] {
  if (!viewModel?.needsYou.length) return [];

  const remaining = viewModel.needsYou.slice(1);
  if (!primaryWorkId) return remaining;

  return remaining.filter((item) => item.id !== primaryWorkId);
}
