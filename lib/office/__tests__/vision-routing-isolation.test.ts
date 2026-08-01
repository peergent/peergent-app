import { describe, expect, it } from "vitest";
import {
  buildLiveVisionRoster,
  DEMO_VISION_ROSTER,
} from "@/lib/office/vision-roster";
import { officeHref } from "@/lib/office/links";
import type { PeerRow } from "@/lib/peer-display";

function peer(id: string, role: string): PeerRow {
  return {
    id,
    name: "Emma",
    role,
    status: "active",
    avatarUrl: null,
    department: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("Vision roster routing", () => {
  it("demo home Marketing click routes to /office/demo", () => {
    const marketing = DEMO_VISION_ROSTER.find((entry) => entry.role === "Marketing");
    expect(marketing?.href).toBe("/office/demo");
  });

  it("live home Marketing click routes to /office/[realPeerId]", () => {
    const livePeers = [peer("peer-marketing-42", "Marketing Manager")];
    const roster = buildLiveVisionRoster(livePeers);
    const marketing = roster.find((entry) => entry.role === "Marketing");
    expect(marketing?.href).toBe(officeHref("peer-marketing-42", "desk"));
    expect(marketing?.href).not.toContain("/office/demo");
  });

  it("no live roster href contains /office/demo", () => {
    const livePeers = [
      peer("peer-a", "Marketing Lead"),
      peer("peer-b", "Sales Representative"),
      peer("peer-c", "Customer Support"),
    ];
    const roster = buildLiveVisionRoster(livePeers);
    for (const entry of roster) {
      expect(entry.href).not.toContain("/office/demo");
      expect(entry.id).not.toBe("demo");
    }
  });

  it("omits demo peer id from live roster even when present in peer list", () => {
    const roster = buildLiveVisionRoster([
      peer("demo", "Marketing"),
      peer("real-peer", "Marketing"),
    ]);
    expect(roster.some((entry) => entry.id === "demo")).toBe(false);
    expect(roster.some((entry) => entry.id === "real-peer")).toBe(true);
  });
});
