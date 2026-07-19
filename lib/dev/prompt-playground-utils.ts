import type { PeerRow } from "@/lib/peer-display";

export type PeerWebsiteGroup = {
  website: string;
  normalizedWebsite: string;
  peers: PeerRow[];
};

export function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();
  }
}

export function displayWebsite(url: string): string {
  const normalized = normalizeWebsite(url);
  return normalized || "No website";
}

export function groupPeersByWebsite(peers: PeerRow[]): PeerWebsiteGroup[] {
  const groups = new Map<string, PeerWebsiteGroup>();

  for (const peer of peers) {
    const normalizedWebsite = normalizeWebsite(peer.website);
    const website = displayWebsite(peer.website);
    const key = normalizedWebsite || `__empty__:${peer.id}`;

    const existing = groups.get(key);
    if (existing) {
      existing.peers.push(peer);
      continue;
    }

    groups.set(key, {
      website,
      normalizedWebsite,
      peers: [peer],
    });
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      peers: [...group.peers].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.website.localeCompare(right.website));
}

export function filterPeersByQuery(peers: PeerRow[], query: string): PeerRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return peers;
  }

  return peers.filter((peer) => {
    const haystack = [
      peer.name,
      peer.role,
      peer.website,
      displayWebsite(peer.website),
      normalizeWebsite(peer.website),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function resolveDefaultPeerId(
  peers: PeerRow[],
  assessmentUrl?: string | null
): string {
  if (peers.length === 0) {
    return "";
  }

  if (assessmentUrl) {
    const assessmentWebsite = normalizeWebsite(assessmentUrl);
    const matchingPeers = peers.filter(
      (peer) => normalizeWebsite(peer.website) === assessmentWebsite
    );

    if (matchingPeers.length >= 1) {
      return matchingPeers[0].id;
    }
  }

  return peers[0]?.id ?? "";
}

export function findMatchingPeers(peers: PeerRow[], assessmentUrl?: string | null) {
  if (!assessmentUrl) {
    return [];
  }

  const assessmentWebsite = normalizeWebsite(assessmentUrl);
  return peers.filter((peer) => normalizeWebsite(peer.website) === assessmentWebsite);
}

export function formatAnalyzedAt(value?: string | null): string {
  if (!value) {
    return "Not analyzed yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
