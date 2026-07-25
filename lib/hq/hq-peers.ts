import type { PeerRow } from "@/lib/peer-display";
import type { HomeTeamPulseItem } from "@/lib/home/types";

/** Desktop HQ row order from the approved HTML reference. */
export const HQ_ROLE_DISPLAY_ORDER = [
  "Sales",
  "Marketing",
  "Finance",
  "Support",
  "Planning",
  "Operations",
  "Custom",
] as const;

const HQ_SETUP_DETAIL = "Open this colleague's workspace to continue setup.";

const HQ_ROLE_ACTIVITY: Record<string, string> = {
  Sales: "Calling leads, booking meetings",
  Marketing: "Preparing campaign",
  Finance: "Monitoring cash flow",
  Support: "Resolving tickets",
  Planning: "Managing schedule",
  Operations: "Coordinating operations",
};

/** Arc offsets for the approved four-card composition (Sales/Support high, Marketing/Finance low). */
export const HQ_ARC_BY_ROLE: Record<string, "high" | "low"> = {
  Sales: "high",
  Marketing: "low",
  Finance: "low",
  Support: "high",
};

export function dedupePeersById(peers: PeerRow[]): PeerRow[] {
  const seen = new Set<string>();

  return peers.filter((peer) => {
    if (!peer.id || seen.has(peer.id)) {
      return false;
    }

    seen.add(peer.id);
    return true;
  });
}

export function hqRoleSortIndex(role: string): number {
  const index = HQ_ROLE_DISPLAY_ORDER.indexOf(role as (typeof HQ_ROLE_DISPLAY_ORDER)[number]);
  return index === -1 ? HQ_ROLE_DISPLAY_ORDER.length : index;
}

export function sortTeamPulseForHq(items: HomeTeamPulseItem[]): HomeTeamPulseItem[] {
  return [...items].sort((left, right) => {
    const roleDelta = hqRoleSortIndex(left.role) - hqRoleSortIndex(right.role);
    if (roleDelta !== 0) return roleDelta;
    return left.name.localeCompare(right.name);
  });
}

export function dedupeTeamPulseByPeerId(items: HomeTeamPulseItem[]): HomeTeamPulseItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.peerId || seen.has(item.peerId)) {
      return false;
    }

    seen.add(item.peerId);
    return true;
  });
}

export function hqArcVariantForPeer(
  role: string,
  index: number,
  total: number
): "high" | "low" {
  const byRole = HQ_ARC_BY_ROLE[role];
  if (byRole) return byRole;

  if (total <= 1) return "low";
  if (total === 2) return index === 0 ? "high" : "low";
  if (total === 3) return index === 1 ? "low" : "high";

  return index % 2 === 0 ? "high" : "low";
}

export function hqActivityDescription(role: string, detail: string): string {
  const trimmed = detail.trim();
  if (!trimmed || trimmed === HQ_SETUP_DETAIL || trimmed.includes("continue setup")) {
    return HQ_ROLE_ACTIVITY[role] ?? "Workspace ready";
  }
  return trimmed;
}

export function hqGridColumnCount(peerCount: number): number {
  if (peerCount <= 0) return 0;
  if (peerCount === 1) return 1;
  if (peerCount === 2) return 2;
  if (peerCount === 3) return 3;
  return 4;
}

export function countActiveAgents<T extends { statusKind: string }>(peers: T[]): number {
  if (peers.length === 0) return 0;
  const active = peers.filter((peer) => peer.statusKind !== "paused").length;
  return active > 0 ? active : peers.length;
}
