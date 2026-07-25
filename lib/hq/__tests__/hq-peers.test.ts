import { describe, expect, it } from "vitest";
import {
  countActiveAgents,
  dedupePeersById,
  dedupeTeamPulseByPeerId,
  hqGridColumnCount,
  sortTeamPulseForHq,
} from "@/lib/hq/hq-peers";
import type { PeerRow } from "@/lib/peer-display";
import type { HomeTeamPulseItem } from "@/lib/home/types";

function peer(id: string, role: string): PeerRow {
  return {
    id,
    name: `${role} ${id}`,
    role,
    status: "active",
    organization_id: "org",
    created_at: "",
    updated_at: "",
    website: null,
    description: null,
    avatar_url: null,
  } as PeerRow;
}

function pulse(peerId: string, role: string): HomeTeamPulseItem {
  return {
    peerId,
    name: `${role} ${peerId}`,
    role,
    statusKind: "idle",
    statusLabel: "Idle",
    detail: "Working",
    href: `/peers/${peerId}`,
  };
}

describe("hq-peers", () => {
  it("dedupes peer rows by id and ignores empty ids", () => {
    const unique = dedupePeersById([
      peer("a", "Sales"),
      peer("a", "Sales"),
      peer("", "Marketing"),
      peer("b", "Marketing"),
    ]);

    expect(unique).toHaveLength(2);
    expect(unique.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("sorts team pulse into HQ role order", () => {
    const sorted = sortTeamPulseForHq([
      pulse("m", "Marketing"),
      pulse("s", "Support"),
      pulse("sa", "Sales"),
      pulse("f", "Finance"),
    ]);

    expect(sorted.map((item) => item.role)).toEqual([
      "Sales",
      "Marketing",
      "Finance",
      "Support",
    ]);
  });

  it("dedupes team pulse by peer id", () => {
    const unique = dedupeTeamPulseByPeerId([
      pulse("same", "Marketing"),
      pulse("same", "Marketing"),
      pulse("other", "Sales"),
    ]);

    expect(unique).toHaveLength(2);
  });

  it("maps grid columns for 1-4+ peers", () => {
    expect(hqGridColumnCount(0)).toBe(0);
    expect(hqGridColumnCount(1)).toBe(1);
    expect(hqGridColumnCount(2)).toBe(2);
    expect(hqGridColumnCount(3)).toBe(3);
    expect(hqGridColumnCount(4)).toBe(4);
    expect(hqGridColumnCount(6)).toBe(4);
  });

  it("counts active agents from the visible collection", () => {
    expect(
      countActiveAgents([
        { statusKind: "working" },
        { statusKind: "paused" },
        { statusKind: "idle" },
      ])
    ).toBe(2);
  });
});
