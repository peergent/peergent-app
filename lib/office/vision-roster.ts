/**
 * Vision v13 peer roster — sidebar chips for Iedereen + Peers.
 *
 * Marketing is the only fully functional peer in this phase. Sales and Support
 * appear for navigation preparation and status indicators only.
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
