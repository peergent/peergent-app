import type { PeerPresence, PeerPresenceId } from "./types";

const PRESENCE_CONFIG: Record<
  PeerPresenceId,
  Omit<PeerPresence, "id" | "lastUpdated">
> = {
  idle: {
    label: "Idle",
    description: "Monitoring the execution plan for the next recommended action.",
    color: "slate",
  },
  learning: {
    label: "Learning",
    description: "Reviewing your business context and marketing understanding.",
    color: "cyan",
  },
  thinking: {
    label: "Thinking",
    description: "Processing information before the next step.",
    color: "violet",
  },
  strategizing: {
    label: "Strategizing",
    description: "Developing marketing strategy from verified business knowledge.",
    color: "fuchsia",
  },
  planning: {
    label: "Planning",
    description: "Building an execution plan from the approved strategy.",
    color: "violet",
  },
  creating: {
    label: "Creating",
    description: "Drafting content for a planned calendar activity.",
    color: "fuchsia",
  },
  preparing_publication: {
    label: "Preparing publication",
    description: "Packaging approved content for its target channel.",
    color: "violet",
  },
  waiting_for_approval: {
    label: "Waiting for approval",
    description: "A draft is ready — I need your decision before continuing.",
    color: "amber",
  },
  reviewing: {
    label: "Reviewing",
    description: "Preparing work for your review.",
    color: "amber",
  },
  completed: {
    label: "Completed",
    description: "Recent work is done — see the summary below for what's next.",
    color: "emerald",
  },
  blocked: {
    label: "Blocked",
    description: "I need more business information before I can continue confidently.",
    color: "red",
  },
};

export function buildPeerPresence(
  id: PeerPresenceId,
  lastUpdated = new Date().toISOString()
): PeerPresence {
  const config = PRESENCE_CONFIG[id];
  return { id, ...config, lastUpdated };
}

export type PresenceInput = {
  generating: "understanding" | "strategy" | "plan" | "draft" | "publication" | null;
  understandingAvailable: boolean;
  understandingCompleteness: number;
  hasStrategy: boolean;
  hasPlan: boolean;
  pendingDraftCount: number;
  readyToPublishCount: number;
  approvedAwaitingPrepCount: number;
  hasPublishedDrafts: boolean;
  planComplete: boolean;
  gapCount: number;
};

export function derivePeerPresence(input: PresenceInput): PeerPresence {
  const now = new Date().toISOString();

  if (input.generating === "understanding") {
    return buildPeerPresence("learning", now);
  }
  if (input.generating === "strategy") {
    return buildPeerPresence("strategizing", now);
  }
  if (input.generating === "plan") {
    return buildPeerPresence("planning", now);
  }
  if (input.generating === "draft") {
    return buildPeerPresence("creating", now);
  }
  if (input.generating === "publication") {
    return buildPeerPresence("preparing_publication", now);
  }

  if (input.pendingDraftCount > 0) {
    return buildPeerPresence("waiting_for_approval", now);
  }

  if (input.readyToPublishCount > 0) {
    return buildPeerPresence("reviewing", now);
  }

  if (input.gapCount > 0 && input.understandingCompleteness < 40) {
    return buildPeerPresence("blocked", now);
  }

  if (!input.understandingAvailable) {
    return buildPeerPresence("learning", now);
  }

  if (input.planComplete) {
    return buildPeerPresence("completed", now);
  }

  if (!input.hasStrategy || !input.hasPlan) {
    return buildPeerPresence("idle", now);
  }

  if (input.approvedAwaitingPrepCount > 0) {
    return buildPeerPresence("preparing_publication", now);
  }

  if (input.hasPublishedDrafts && input.pendingDraftCount === 0) {
    return buildPeerPresence("completed", now);
  }

  return buildPeerPresence("idle", now);
}
