import type { PeerRole } from "../types/peer";

const PEER_ROLES: PeerRole[] = [
  "Sales",
  "Marketing",
  "Support",
  "Planning",
  "Finance",
  "Custom",
];

export function toPeerRole(role: string): PeerRole {
  const match = PEER_ROLES.find(
    (candidate) => candidate.toLowerCase() === role.trim().toLowerCase()
  );

  return match ?? "Custom";
}
