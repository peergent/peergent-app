import type { ActorScope } from "./organization";
import type { OrganizationScope } from "./organization";
import type { PeerScope } from "./peer";

export type ContextScope = {
  organization: OrganizationScope;
  peer: PeerScope;
  actor: ActorScope;
  sessionId: string;
  requestedAt: string;
};
