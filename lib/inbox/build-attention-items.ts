import { knowledgeSectionHref } from "@/lib/knowledge";
import { getHomeCopy } from "@/lib/i18n";
import type { HomePeerWorkspaceSnapshot } from "@/lib/home/types";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import { resolveMarketingWorkflowFocus, type MarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { marketingWorkspaceHref } from "@/lib/home/load-home-data";
import type { InboxItem, InboxItemKind } from "./types";

function focusKind(focus: MarketingWorkflowFocus): InboxItemKind | null {
  switch (focus.kind) {
    case "draft_review":
    case "ready_to_publish":
    case "draft_approved":
    case "knowledge_incomplete":
    case "ready_for_strategy":
    case "strategy_complete":
      return focus.kind;
    default:
      return null;
  }
}

function focusToInboxItem(
  focus: MarketingWorkflowFocus,
  peerId: string,
  peerName: string,
  copy: ReturnType<typeof getHomeCopy>
): InboxItem | null {
  const kind = focusKind(focus);
  if (!kind) return null;

  switch (focus.kind) {
    case "draft_review":
      return {
        id: `${peerId}-review-${focus.draftId}`,
        kind,
        priority: "urgent",
        title: copy.needsYouItems.reviewDraft,
        subtitle: focus.title,
        context: peerName,
        peerId,
        peerName,
        href: marketingWorkspaceHref(peerId),
      };
    case "ready_to_publish":
      return {
        id: `${peerId}-publish-${focus.draftId}`,
        kind,
        priority: "urgent",
        title: copy.needsYouItems.confirmPublication,
        subtitle: focus.title,
        context: peerName,
        peerId,
        peerName,
        href: marketingWorkspaceHref(peerId),
      };
    case "draft_approved":
      return {
        id: `${peerId}-prepare-${focus.draftId}`,
        kind,
        priority: "normal",
        title: copy.needsYouItems.preparePublication,
        subtitle: focus.title,
        context: peerName,
        peerId,
        peerName,
        href: marketingWorkspaceHref(peerId),
      };
    case "knowledge_incomplete":
      return {
        id: `${peerId}-context-${focus.knowledgeSection}`,
        kind,
        priority: "normal",
        title: copy.needsYouItems.improveContext,
        subtitle: peerName,
        peerId,
        peerName,
        href: knowledgeSectionHref(focus.knowledgeSection),
      };
    case "ready_for_strategy":
      return {
        id: `${peerId}-strategy`,
        kind,
        priority: "normal",
        title: copy.needsYouItems.createStrategy,
        subtitle: peerName,
        peerId,
        peerName,
        href: marketingWorkspaceHref(peerId),
      };
    case "strategy_complete":
      return {
        id: `${peerId}-plan`,
        kind,
        priority: "normal",
        title: copy.needsYouItems.buildPlan,
        subtitle: peerName,
        peerId,
        peerName,
        href: marketingWorkspaceHref(peerId),
      };
    default:
      return null;
  }
}

export function buildAttentionItems(input: {
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  understanding: MarketingUnderstanding | null;
  locale?: import("@/lib/i18n").HomeLocale;
}): InboxItem[] {
  const copy = getHomeCopy(input.locale ?? "en");
  const items: InboxItem[] = [];

  for (const { peer, workspace } of input.marketingSnapshots) {
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding: input.understanding,
      strategy: workspace.strategy ?? null,
      plan: workspace.plan ?? null,
      drafts: workspace.drafts ?? [],
      publicationPackages: workspace.publicationPackages ?? [],
    });

    const item = focusToInboxItem(focus, peer.id, peer.name, copy);
    if (item) items.push(item);
  }

  const priorityOrder = { urgent: 0, normal: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}
