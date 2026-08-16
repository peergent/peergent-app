/**
 * PX-53 — canonical completed-dependency reuse contract.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { ProjectEpisodeRecord } from "../project-runtime/types";
import { emitOrchestrationDiagnostic } from "../project-runtime/orchestration-diagnostics";
import { primaryBrainForCapability } from "./capability-brain-map";

export type DependencyResolutionKind =
  | "reused_completed_output"
  | "executed_fresh"
  | "invalidated_reexecute"
  | "unavailable";

export type DependencyResolutionPlan = {
  action: "reuse" | "execute";
  resolution: DependencyResolutionKind;
  output?: BrainStructuredOutput;
};

function hasFreshOutput(
  capabilityId: BrainCapabilityId,
  output: BrainStructuredOutput | undefined
): output is BrainStructuredOutput {
  if (!output) return false;
  return output.capabilityVersion === getBrainCapability(capabilityId).version;
}

function isEpisodeBrainComplete(
  episode: ProjectEpisodeRecord | null | undefined,
  capabilityId: BrainCapabilityId
): boolean {
  if (!episode) return false;
  const brainId = primaryBrainForCapability(capabilityId);
  if (!brainId) return false;
  return episode.snapshot.completedBrains.includes(brainId);
}

export function resolveCompletedDependency(input: {
  dependencyId: BrainCapabilityId;
  consumerCapabilityId: BrainCapabilityId;
  consumerBrainId?: string | null;
  episode?: ProjectEpisodeRecord | null;
  upstreamOutputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  contextVersion: number;
}): DependencyResolutionPlan {
  const stored = input.upstreamOutputs[input.dependencyId];
  const brainComplete = isEpisodeBrainComplete(input.episode, input.dependencyId);

  if (hasFreshOutput(input.dependencyId, stored)) {
    return {
      action: "reuse",
      resolution: brainComplete ? "reused_completed_output" : "reused_completed_output",
      output: stored,
    };
  }

  if (brainComplete) {
    return {
      action: "execute",
      resolution: "invalidated_reexecute",
    };
  }

  return {
    action: "execute",
    resolution: "unavailable",
  };
}

export function emitBrainDependencyResolved(input: {
  organizationId: string;
  projectId: string;
  episodeId?: string;
  consumerBrain?: string | null;
  dependencyBrain: BrainCapabilityId;
  consumerCapability: BrainCapabilityId;
  resolution: DependencyResolutionKind;
  contextVersion: number;
  outputRefPresent: boolean;
}): void {
  emitOrchestrationDiagnostic({
    event: "brain_dependency_resolved",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    brainId: input.consumerBrain as import("../project-engine/types").ProjectBrainId | undefined,
    reason: input.resolution,
    contextVersion: input.contextVersion,
    outputRefPresent: input.outputRefPresent,
    dependencyCapabilityId: input.dependencyBrain,
    consumerCapabilityId: input.consumerCapability,
  });
}
