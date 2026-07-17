import type { BuildContextRequest, ContextScope } from "../types";
import { MissingScopeError } from "../core/errors";

export function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}`;
}

export function resolveScope(request: BuildContextRequest): ContextScope {
  const { organizationId, peerId, userId } = request;

  if (!organizationId.trim() || !peerId.trim() || !userId.trim()) {
    throw new MissingScopeError("organizationId, peerId, and userId are required.");
  }

  return {
    organization: {
      organizationId,
      organizationName: "Organization",
      slug: "organization",
    },
    peer: {
      peerId,
      role: "Custom",
      name: "Peer",
      objective: request.taskHint?.trim() || "Awaiting objective",
      website: "",
      status: "active",
    },
    actor: {
      userId,
      membershipRole: request.membershipRole ?? "member",
    },
    sessionId: createSessionId(),
    requestedAt: new Date().toISOString(),
  };
}

export function validateScope(scope: ContextScope) {
  if (!scope.organization.organizationId || !scope.peer.peerId || !scope.actor.userId) {
    throw new MissingScopeError("Context scope is incomplete.");
  }
}
