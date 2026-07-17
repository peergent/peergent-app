const STORAGE_PREFIX = "peergent-peer-workspace:";

import type {
  AutonomyLevel,
  AvailabilityMode,
  WorkspacePreferences,
} from "./types";

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  availability: "business-hours",
  evenings: false,
  weekends: false,
  autonomy: "collaborate",
  paused: false,
};

function storageKey(peerId: string) {
  return `${STORAGE_PREFIX}${peerId}`;
}

export function loadWorkspacePreferences(
  peerId: string
): Partial<WorkspacePreferences> | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(peerId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<WorkspacePreferences>;
  } catch {
    return null;
  }
}

export function saveWorkspacePreferences(
  peerId: string,
  preferences: WorkspacePreferences
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(storageKey(peerId), JSON.stringify(preferences));
  } catch {
    // Ignore quota or private mode errors.
  }
}

export function mergeWorkspacePreferences(
  peerId: string,
  defaults: WorkspacePreferences
): WorkspacePreferences {
  const stored = loadWorkspacePreferences(peerId);
  if (!stored) {
    return defaults;
  }

  return {
    ...defaults,
    ...stored,
  };
}

export function isValidAvailability(value: string): value is AvailabilityMode {
  return value === "business-hours" || value === "extended" || value === "24-7";
}

export function isValidAutonomy(value: string): value is AutonomyLevel {
  return value === "assist" || value === "collaborate" || value === "autopilot";
}
