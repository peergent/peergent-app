import { describe, expect, it } from "vitest";
import {
  canonicalCustomerPeerLabel,
  customerPeerRoleBucket,
  selectCanonicalCustomerPeers,
} from "@/lib/customer-v17/select-canonical-customer-peers";
import type { PeerRow } from "@/lib/peer-display";
import { buildV17CommandCenterAttention } from "@/lib/customer-v17/build-v17-cc-attention";

function peer(partial: Partial<PeerRow> & Pick<PeerRow, "id" | "role">): PeerRow {
  return {
    name: partial.name ?? partial.role,
    website: "",
    objective: "",
    status: partial.status ?? "active",
    ...partial,
  };
}

describe("selectCanonicalCustomerPeers", () => {
  it("returns one peer per primary role", () => {
    const rows = selectCanonicalCustomerPeers([
      peer({ id: "m1", role: "Marketing", name: "Emma" }),
      peer({ id: "m2", role: "Marketing", name: "Emma Copy" }),
      peer({ id: "s1", role: "Sales", name: "Sam" }),
      peer({ id: "x1", role: "Marketing", name: "test bot", status: "active" }),
    ]);
    expect(rows.filter((r) => customerPeerRoleBucket(r.role) === "Marketing")).toHaveLength(1);
    expect(rows.find((r) => r.role === "Marketing")?.id).toBe("m1");
  });

  it("excludes inactive and test names", () => {
    const rows = selectCanonicalCustomerPeers([
      peer({ id: "t1", role: "Marketing", name: "test peer" }),
      peer({ id: "i1", role: "Marketing", name: "Real", status: "inactive" }),
    ]);
    expect(rows).toHaveLength(0);
  });

  it("does not show duplicate Sales peers in rail selection", () => {
    const rows = selectCanonicalCustomerPeers([
      peer({ id: "s1", role: "Sales", name: "Sales Peer" }),
      peer({ id: "s2", role: "Sales", name: "Sales Assistant" }),
      peer({ id: "s3", role: "Sales Manager", name: "Closer Bot" }),
    ]);
    expect(rows.filter((r) => customerPeerRoleBucket(r.role) === "Sales")).toHaveLength(1);
    expect(rows[0]?.id).toBe("s1");
  });

  it("maps Operations into Planning bucket only once", () => {
    const rows = selectCanonicalCustomerPeers([
      peer({ id: "p1", role: "Planning", name: "Planning Peer" }),
      peer({ id: "o1", role: "Operations", name: "Ops Peer" }),
    ]);
    expect(rows.some((r) => r.id === "p1")).toBe(true);
    expect(rows.some((r) => r.id === "o1")).toBe(false);
  });

  it("uses canonical customer labels per bucket", () => {
    expect(canonicalCustomerPeerLabel("Sales", "nl")).toBe("Sales Peer");
  });
});

describe("buildV17CommandCenterAttention", () => {
  it("uses action title and campaign context without repeating peer name", () => {
    const result = buildV17CommandCenterAttention({
      items: [
        {
          id: "1",
          priority: "normal",
          title: "Review content",
          subtitle: "review test",
          context: "review test",
          peerId: "m1",
          peerName: "Marketing Peer",
          href: "/inbox/1",
        },
      ],
      locale: "nl",
      reviewCta: "Beoordelen",
      viewCta: "Bekijk",
      approveCta: "Goedkeuren",
      serviceKeyFor: () => "marketing",
    });
    expect(result.primary?.title.toLowerCase()).not.toBe("marketing peer");
    expect(result.primary?.contextLine).not.toContain("Marketing Peer · Marketing Peer");
    expect(result.primary?.contextLine).toMatch(/klaar|onderdelen/i);
  });
});
