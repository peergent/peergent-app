import type { PresenceMode } from "@/components/ui/PresenceIndicator";
import type {
  DataCompletenessBreakdown,
  QualitativeHealthState,
} from "@/lib/command-center/types";

export function getBrainSystemState(options: {
  loading: boolean;
  peerCount: number;
  hasWebsite: boolean;
  overallHealth: QualitativeHealthState;
}): { mode: PresenceMode; label: string; context?: string } {
  if (options.loading) {
    return { mode: "thinking", label: "Reviewing workspace" };
  }

  if (!options.peerCount && !options.hasWebsite) {
    return { mode: "waiting", label: "Waiting for first signal" };
  }

  if (options.hasWebsite && !options.peerCount) {
    return { mode: "watching", label: "Reading website" };
  }

  if (options.peerCount > 0 && options.overallHealth === "baseline-in-progress") {
    return { mode: "watching", label: "Watching workforce" };
  }

  if (options.hasWebsite && options.overallHealth === "more-data-required") {
    return { mode: "waiting", label: "Waiting for analytics" };
  }

  if (options.overallHealth === "baseline-in-progress") {
    return { mode: "thinking", label: "Understanding operations" };
  }

  return { mode: "ready", label: "Ready" };
}

export function getHealthSystemState(
  overallHealth: QualitativeHealthState
): { mode: PresenceMode; label: string } {
  if (overallHealth === "more-data-required") {
    return { mode: "waiting", label: "Waiting for more data" };
  }
  if (overallHealth === "baseline-in-progress") {
    return { mode: "watching", label: "Confidence improving" };
  }
  return { mode: "ready", label: "Preliminary read" };
}

export function buildBriefReasoning(options: {
  peerCount: number;
  hasWebsite: boolean;
  completeness: DataCompletenessBreakdown;
}): string[] {
  const reasoning: string[] = [];

  if (options.peerCount > 0) {
    reasoning.push(`${options.peerCount} peer${options.peerCount === 1 ? "" : "s"} deployed — strongest signal today.`);
  }

  if (options.hasWebsite) {
    reasoning.push("Website context on file from your peers.");
  }

  if (options.completeness.totalPercent > 0) {
    reasoning.push(`${options.completeness.totalPercent}% completeness — orient only, not precise scoring.`);
  }

  return reasoning.slice(0, 2);
}

export type MemoryEntry = {
  id: string;
  text: string;
  isDemo: boolean;
};

export function buildBriefMemory(
  activities: { id: string; title: string; description: string }[]
): MemoryEntry[] {
  if (activities.length === 0) return [];

  const latest = activities[0];
  return [
    {
      id: latest.id,
      text: latest.title,
      isDemo: true,
    },
  ];
}
