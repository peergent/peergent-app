import { describe, expect, it } from "vitest";
import { buildTeamWorkspaceViewModel } from "../team-presenter";
import { TEAM_FEATURED_PEER_LIMIT, TEAM_PEERS_VIEW_ALL_HREF } from "../types";
import type { PeerRow } from "@/lib/peer-display";

function makePeer(index: number, role = "Sales"): PeerRow {
  return {
    id: `peer-${index}`,
    name: `Peer ${index}`,
    role,
    status: "active",
    website: "https://example.com",
    objective: "Assist the team",
    organization_id: "org-1",
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("TEAM_PEERS_VIEW_ALL_HREF", () => {
  it("points to the peers route", () => {
    expect(TEAM_PEERS_VIEW_ALL_HREF).toBe("/team?view=all");
    expect(TEAM_PEERS_VIEW_ALL_HREF.startsWith("/team")).toBe(true);
  });
});

describe("buildTeamWorkspaceViewModel workforce summary", () => {
  it("links View all AI Peers to the peers route", () => {
    const peers = Array.from({ length: TEAM_FEATURED_PEER_LIMIT + 1 }, (_, i) =>
      makePeer(i + 1)
    );

    const model = buildTeamWorkspaceViewModel(peers);

    expect(model.workforceSummary?.workforceHref).toBe(TEAM_PEERS_VIEW_ALL_HREF);
    expect(model.workforceSummary?.workforceHref.startsWith("/team")).toBe(true);
    expect(model.featuredPeers).toHaveLength(TEAM_FEATURED_PEER_LIMIT);
  });

  it("shows every peer when view=all is active", () => {
    const peers = Array.from({ length: TEAM_FEATURED_PEER_LIMIT + 2 }, (_, i) =>
      makePeer(i + 1)
    );

    const model = buildTeamWorkspaceViewModel(peers, { showAllPeers: true });

    expect(model.featuredPeers).toHaveLength(peers.length);
    expect(model.workforceSummary).toBeNull();
  });
});
