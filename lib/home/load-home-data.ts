import type { PeerRow } from "@/lib/peer-display";
import type { MarketingWorkspacePersistedState } from "@/lib/marketing-workspace/types";
import { loadMarketingWorkspaceState } from "@/lib/marketing-workspace/storage";
import { officeHref } from "@/lib/office/links";
import type { HomePeerWorkspaceSnapshot } from "./types";

export function marketingWorkspaceHref(peerId: string): string {
  return officeHref(peerId, "work");
}

export function peerWorkspaceHref(peer: PeerRow): string {
  return peer.role === "Marketing"
    ? marketingWorkspaceHref(peer.id)
    : `/peers/${peer.id}`;
}

export function loadMarketingPeerSnapshots(peers: PeerRow[]): HomePeerWorkspaceSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  return peers
    .filter((peer) => peer.role === "Marketing")
    .map((peer) => ({
      peer,
      workspace: loadMarketingWorkspaceState(peer.id),
    }));
}

export const HOME_LAST_VISIT_KEY = "peergent-home-last-visit";

export function readLastHomeVisit(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(HOME_LAST_VISIT_KEY);
  } catch {
    return null;
  }
}

export function writeLastHomeVisit(iso: string = new Date().toISOString()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HOME_LAST_VISIT_KEY, iso);
  } catch {
    // ignore quota errors
  }
}

export function companyNameFromPeers(peers: PeerRow[]): string {
  const website = peers.find((peer) => peer.website?.trim())?.website;
  if (!website) return "your company";

  try {
    const normalized = website.startsWith("http") ? website : `https://${website}`;
    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    const segment = hostname.split(".")[0];
    if (!segment) return "your company";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  } catch {
    return "your company";
  }
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function snapshotHasPersistedWork(workspace: MarketingWorkspacePersistedState): boolean {
  return Boolean(
    workspace.strategy ||
      workspace.plan ||
      (workspace.drafts?.length ?? 0) > 0 ||
      (workspace.activityFeed?.length ?? 0) > 0
  );
}
