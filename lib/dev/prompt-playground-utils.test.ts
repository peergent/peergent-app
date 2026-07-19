import { describe, expect, it } from "vitest";
import type { PeerRow } from "@/lib/peer-display";
import {
  filterPeersByQuery,
  groupPeersByWebsite,
  normalizeWebsite,
  resolveDefaultPeerId,
} from "./prompt-playground-utils";

const PEERS: PeerRow[] = [
  {
    id: "1",
    name: "Alex",
    role: "Sales",
    website: "https://www.acme.com",
    objective: "",
    status: "active",
  },
  {
    id: "2",
    name: "Morgan",
    role: "Marketing",
    website: "acme.com",
    objective: "",
    status: "active",
  },
  {
    id: "3",
    name: "Sam",
    role: "Support",
    website: "https://beta.io",
    objective: "",
    status: "active",
  },
];

describe("prompt playground utils", () => {
  it("groups peers by normalized website", () => {
    const groups = groupPeersByWebsite(PEERS);
    expect(groups).toHaveLength(2);
    expect(groups[0].peers).toHaveLength(2);
  });

  it("filters peers by website or name", () => {
    expect(filterPeersByQuery(PEERS, "marketing")).toHaveLength(1);
    expect(filterPeersByQuery(PEERS, "beta")).toHaveLength(1);
  });

  it("defaults to the peer matching the latest assessment website", () => {
    expect(resolveDefaultPeerId(PEERS, "https://acme.com/about")).toBe("1");
    expect(normalizeWebsite("https://www.acme.com")).toBe("acme.com");
  });

  it("auto-selects the only matching peer", () => {
    expect(resolveDefaultPeerId(PEERS, "https://beta.io")).toBe("3");
  });
});
