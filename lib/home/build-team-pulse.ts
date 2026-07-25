import { gapToKnowledgeSection, knowledgeSectionHref } from "@/lib/knowledge";
import { getHomeCopy } from "@/lib/i18n";
import { resolvePrimaryActionLabel } from "@/lib/peer-experience";
import type { PeerRow } from "@/lib/peer-display";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import {
  resolveMarketingWorkflowFocus,
  type MarketingWorkflowFocus,
} from "@/lib/marketing-workspace/workflow-focus";
import type { HomePeerWorkspaceSnapshot, HomeTeamPulseItem } from "./types";
import { marketingWorkspaceHref, peerWorkspaceHref } from "./load-home-data";

function focusToTeamPulse(
  focus: MarketingWorkflowFocus,
  peerId: string,
  name: string,
  role: string,
  copy: ReturnType<typeof getHomeCopy>
): HomeTeamPulseItem {
  const href = marketingWorkspaceHref(peerId);

  switch (focus.kind) {
    case "generating":
      return {
        peerId,
        name,
        role,
        statusKind: "working",
        statusLabel: copy.teamStatus.working,
        detail: focus.activityLabel ?? copy.teamStatus.working,
        href,
      };
    case "draft_review":
    case "ready_to_publish":
    case "draft_approved":
      return {
        peerId,
        name,
        role,
        statusKind: "waiting",
        statusLabel: copy.teamStatus.waitingForYou,
        detail:
          focus.kind === "draft_review"
            ? `"${focus.title}" ready for review`
            : focus.title,
        href,
      };
    case "knowledge_incomplete":
      return {
        peerId,
        name,
        role,
        statusKind: "blocked",
        statusLabel: copy.needsYouItems.improveContext,
        detail: copy.contextNotLoadedBody,
        href: knowledgeSectionHref(focus.knowledgeSection),
      };
    case "campaign_complete":
      return {
        peerId,
        name,
        role,
        statusKind: "idle",
        statusLabel: copy.teamStatus.campaignComplete,
        detail: copy.teamStatus.campaignComplete,
        href,
      };
    case "monitoring":
      return {
        peerId,
        name,
        role,
        statusKind: "idle",
        statusLabel: copy.teamStatus.monitoring,
        detail: copy.teamStatus.monitoring,
        href,
      };
    default:
      return {
        peerId,
        name,
        role,
        statusKind: "idle",
        statusLabel: copy.teamStatus.idle,
        detail: resolvePrimaryActionLabel(focus) ?? copy.teamStatus.idle,
        href,
      };
  }
}

function nonMarketingPulse(peer: PeerRow, copy: ReturnType<typeof getHomeCopy>): HomeTeamPulseItem {
  const statusKind = peer.status === "paused" ? "paused" : "idle";
  return {
    peerId: peer.id,
    name: peer.name,
    role: peer.role,
    statusKind,
    statusLabel: statusKind === "paused" ? copy.teamStatus.paused : copy.teamStatus.idle,
    detail:
      peer.role === "Marketing"
        ? copy.teamStatus.idle
        : "Open this colleague's workspace to continue setup.",
    href: peerWorkspaceHref(peer),
  };
}

export function buildTeamPulseItems(input: {
  peers: PeerRow[];
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  understanding: MarketingUnderstanding | null;
  locale?: import("@/lib/i18n").HomeLocale;
}): HomeTeamPulseItem[] {
  const copy = getHomeCopy(input.locale ?? "en");
  const marketingIds = new Set(input.marketingSnapshots.map((snapshot) => snapshot.peer.id));

  return input.peers.map((peer) => {
    if (!marketingIds.has(peer.id)) {
      return nonMarketingPulse(peer, copy);
    }

    const snapshot = input.marketingSnapshots.find((entry) => entry.peer.id === peer.id)!;
    const focus = resolveMarketingWorkflowFocus({
      generating: null,
      understanding: input.understanding,
      strategy: snapshot.workspace.strategy ?? null,
      plan: snapshot.workspace.plan ?? null,
      drafts: snapshot.workspace.drafts ?? [],
      publicationPackages: snapshot.workspace.publicationPackages ?? [],
    });

    return focusToTeamPulse(focus, peer.id, peer.name, peer.role, copy);
  });
}
