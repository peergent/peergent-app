import type { PeerRow } from "@/lib/peer-display";
import { HQ_ROLE_DISPLAY_ORDER } from "@/lib/hq/hq-peers";

/** One visible Peer per bucket, in rail order (matches v17 prototype). */
export const CUSTOMER_PEER_RAIL_ORDER = [
  "Marketing",
  "Sales",
  "Support",
  "Planning",
  "Finance",
] as const;

export type CustomerPeerRoleBucket = (typeof CUSTOMER_PEER_RAIL_ORDER)[number];

/** @deprecated Use CUSTOMER_PEER_RAIL_ORDER */
export const CUSTOMER_PEER_ROLES = CUSTOMER_PEER_RAIL_ORDER;

const TEST_NAME_PATTERN = /^(test|demo|sample|copy of|duplicate|dev|staging|sandbox)\b/i;

function isExcludedPeer(peer: PeerRow): boolean {
  if (!peer.id?.trim()) return true;
  if (peer.status === "inactive") return true;
  const name = peer.name?.trim() ?? "";
  if (!name) return true;
  if (TEST_NAME_PATTERN.test(name)) return true;
  if (/^emma\s*(\d+|copy|test)/i.test(name)) return true;
  return false;
}

export function customerPeerRoleBucket(role: string): CustomerPeerRoleBucket | "Custom" {
  const r = role.trim();
  if (HQ_ROLE_DISPLAY_ORDER.includes(r as (typeof HQ_ROLE_DISPLAY_ORDER)[number])) {
    if (r === "Operations") return "Planning";
    return r as CustomerPeerRoleBucket;
  }
  if (/marketing/i.test(r)) return "Marketing";
  if (/sales/i.test(r)) return "Sales";
  if (/support/i.test(r)) return "Support";
  if (/plan|operations|ops/i.test(r)) return "Planning";
  if (/finance/i.test(r)) return "Finance";
  return "Custom";
}

export function canonicalCustomerPeerLabel(
  bucket: CustomerPeerRoleBucket,
  locale: "nl" | "en" = "nl"
): string {
  const nl: Record<CustomerPeerRoleBucket, string> = {
    Marketing: "Marketing Peer",
    Sales: "Sales Peer",
    Support: "Support Peer",
    Planning: "Planning Peer",
    Finance: "Finance Peer",
  };
  const en: Record<CustomerPeerRoleBucket, string> = {
    Marketing: "Marketing Peer",
    Sales: "Sales Peer",
    Support: "Support Peer",
    Planning: "Planning Peer",
    Finance: "Finance Peer",
  };
  return (locale === "nl" ? nl : en)[bucket];
}

function peerRank(peer: PeerRow, bucket: CustomerPeerRoleBucket): number {
  let rank = 0;
  if (peer.status === "active") rank += 1000;
  const canonical = canonicalCustomerPeerLabel(bucket, "en");
  if (new RegExp(`^${canonical.replace(/\s+/g, "\\s+")}$`, "i").test(peer.name.trim())) {
    rank += 500;
  } else if (new RegExp(`^${bucket}\\s*peer`, "i").test(peer.name.trim())) {
    rank += 400;
  }
  const created = peer.created_at ? Date.parse(peer.created_at) : 0;
  rank += Math.min(50, Math.floor(created / 1_000_000_000_000));
  return rank;
}

/**
 * Select one canonical customer-visible Peer per primary role.
 */
export function selectCanonicalCustomerPeers(peers: PeerRow[]): PeerRow[] {
  const eligible = peers.filter((p) => !isExcludedPeer(p));
  const byRole = new Map<CustomerPeerRoleBucket, PeerRow[]>();

  for (const peer of eligible) {
    const bucket = customerPeerRoleBucket(peer.role);
    if (bucket === "Custom") continue;
    const list = byRole.get(bucket) ?? [];
    list.push(peer);
    byRole.set(bucket, list);
  }

  const picked: PeerRow[] = [];
  for (const role of CUSTOMER_PEER_RAIL_ORDER) {
    const candidates = byRole.get(role);
    if (!candidates?.length) continue;
    candidates.sort((a, b) => {
      const rankDelta = peerRank(b, role) - peerRank(a, role);
      if (rankDelta !== 0) return rankDelta;
      return a.id.localeCompare(b.id);
    });
    picked.push(candidates[0]!);
  }

  const seenIds = new Set<string>();
  const seenBuckets = new Set<CustomerPeerRoleBucket>();
  return picked.filter((peer) => {
    if (seenIds.has(peer.id)) return false;
    const bucket = customerPeerRoleBucket(peer.role);
    if (bucket === "Custom" || seenBuckets.has(bucket)) return false;
    seenIds.add(peer.id);
    seenBuckets.add(bucket);
    return true;
  });
}

export function dedupePeersById(peers: PeerRow[]): PeerRow[] {
  const seen = new Set<string>();
  return peers.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
