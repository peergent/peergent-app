import type { PeerRow } from "@/lib/peer-display";
import {
  customerPeerRoleBucket,
  type CustomerPeerRoleBucket,
} from "@/lib/customer-v17/select-canonical-customer-peers";
import { officeHref } from "./links";
import { DEMO_PEER_ID } from "./demo/demo-company";

/**
 * Vision v13 peer roster — sidebar chips for Iedereen + Peers.
 *
 * Marketing is the only fully functional peer in this phase. Sales and Support
 * appear when a real peer exists for that bucket — never routed to demo.
 */

export type VisionRosterPeer = {
  id: string;
  name: string;
  role: "Marketing" | "Sales" | "Support";
  /** working | waiting | calm */
  state: "working" | "waiting" | "calm";
  /** Orange flag when the peer needs the customer */
  needsYou?: boolean;
  href: string;
};

export const DEMO_VISION_ROSTER: readonly VisionRosterPeer[] = [
  {
    id: "demo",
    name: "Marketing",
    role: "Marketing",
    state: "working",
    href: "/office/demo",
  },
  {
    id: "sales-demo",
    name: "Sales",
    role: "Sales",
    state: "waiting",
    needsYou: true,
    href: "/office/demo",
  },
  {
    id: "support-demo",
    name: "Support",
    role: "Support",
    state: "calm",
    href: "/office/demo",
  },
] as const;

const LIVE_ROSTER_BUCKETS: readonly {
  role: VisionRosterPeer["role"];
  bucket: CustomerPeerRoleBucket;
}[] = [
  { role: "Marketing", bucket: "Marketing" },
  { role: "Sales", bucket: "Sales" },
  { role: "Support", bucket: "Support" },
];

/**
 * Builds the live Home/Office sidebar roster from canonical organization peers.
 * Omits buckets with no peer. Never links to `/office/demo`.
 */
export function buildLiveVisionRoster(peers: readonly PeerRow[]): VisionRosterPeer[] {
  return LIVE_ROSTER_BUCKETS.flatMap(({ role, bucket }) => {
    const peer = peers.find(
      (row) =>
        customerPeerRoleBucket(row.role) === bucket && row.id !== DEMO_PEER_ID
    );
    if (!peer?.id) return [];

    const state: VisionRosterPeer["state"] =
      peer.status === "active" ? "working" : "calm";

    return [
      {
        id: peer.id,
        name: role,
        role,
        state,
        href: officeHref(peer.id, "desk"),
      },
    ];
  });
}

export function peerAccentCssVar(role: string): string {
  switch (role) {
    case "Sales":
      return "var(--pg-v13-sales)";
    case "Support":
      return "var(--pg-v13-support)";
    default:
      return "var(--pg-v13-marketing)";
  }
}
