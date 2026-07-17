import type { PeerRow } from "@/lib/peer-display";
import { getRoleConfig } from "@/lib/peer-display";
import {
  AUTONOMY_OPTIONS,
  AVAILABILITY_OPTIONS,
  buildExperienceItems,
  getRoleWorkspaceContent,
} from "./peer-detail-mock-data";
import type {
  PeerWorkState,
  PeerWorkspaceViewModel,
  WorkspacePreferences,
} from "./types";
import { DEFAULT_WORKSPACE_PREFERENCES } from "./workspace-preferences";

function resolveWorkState(
  peer: PeerRow,
  preferences: WorkspacePreferences
): PeerWorkState {
  if (preferences.paused || peer.status !== "active") {
    return preferences.paused ? "paused" : "idle";
  }

  return "working";
}

function workStateLabel(state: PeerWorkState): string {
  switch (state) {
    case "working":
      return "Working";
    case "paused":
      return "Paused";
    case "idle":
      return "Available";
  }
}

function formatWorkingSince(createdAt?: string): string {
  if (!createdAt) {
    return "Recently joined";
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
    }).format(new Date(createdAt));
  } catch {
    return "Recently joined";
  }
}

export function buildDefaultWorkspacePreferences(
  peer: PeerRow
): WorkspacePreferences {
  return {
    ...DEFAULT_WORKSPACE_PREFERENCES,
    paused: peer.status !== "active",
  };
}

export function buildPeerWorkspaceViewModel(
  peer: PeerRow,
  preferences: WorkspacePreferences
): PeerWorkspaceViewModel {
  const roleConfig = getRoleConfig(peer.role);
  const content = getRoleWorkspaceContent(peer.role);
  const workState = resolveWorkState(peer, preferences);
  const isWorking = workState === "working";
  const workingSince = formatWorkingSince(peer.created_at);

  return {
    peerId: peer.id,
    header: {
      peerName: peer.name,
      role: roleConfig.roleLabel,
      department: content.department,
      roleDescription: content.roleDescription,
      gradient: roleConfig.gradient,
      workState,
      statusLabel: workStateLabel(workState),
    },
    currentWork: isWorking
      ? content.currentWorkActive
      : content.currentWorkIdle,
    decisionLog: content.decisionLog,
    approvals: content.approvals,
    profile: {
      expertise: content.profile.expertise,
      workingStyle: content.profile.workingStyle,
      experience: buildExperienceItems(content, workingSince),
      learning: content.profile.learning,
      reputation: content.profile.reputation,
      knowledgeHref: "/knowledge",
    },
    availabilityOptions: AVAILABILITY_OPTIONS,
    autonomyOptions: AUTONOMY_OPTIONS,
  };
}

/**
 * Future Supabase integration:
 * - currentWork: live task stream with reasoning + confidence
 * - decisionLog: peer_decisions table with explanation field
 * - learning: weekly learning summaries from memory pipeline
 * - reputation: quality/compliance aggregates
 * - expertise: knowledge graph coverage by domain
 */
