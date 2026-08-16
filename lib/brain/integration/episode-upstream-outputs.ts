/**
 * PX-53 — resolve upstream capability outputs from durable episode knowledge.
 *
 * Invariant: once a brain completes in an episode, its output is available to later
 * dependency executions — not only from in-memory project.campaignBrainOutputs.
 */

import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { mapPlanningBrainToStructuredOutput } from "../layers/planning/map-planning-brain-to-output";
import { mapStrategyBrainToStructuredOutput } from "../layers/strategy/map-strategy-brain-to-output";
import { resolveBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { ResolvedBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { ProjectEpisodeRecord } from "../project-runtime/types";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainRepositoryBundle } from "../persistence/repository-factory";
import { capabilitiesOwnedByBrain } from "./capability-brain-map";

export type EpisodeUpstreamOutputContext = {
  project: MarketingProject;
  organizationId: string;
  projectId: string;
  episode?: ProjectEpisodeRecord | null;
  repositories?: BrainRepositoryBundle;
};

function hasCompatibleVersion(
  capabilityId: BrainCapabilityId,
  output: BrainStructuredOutput
): boolean {
  return output.capabilityVersion === getBrainCapability(capabilityId).version;
}

function mergeOutput(
  target: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  capabilityId: BrainCapabilityId,
  output: BrainStructuredOutput | undefined
): void {
  if (output && hasCompatibleVersion(capabilityId, output)) {
    target[capabilityId] = output;
  }
}

function mergeResolvedGraphOutputs(
  target: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  resolved: ResolvedBrainOutputs
): void {
  if (resolved.strategyBrainGraph) {
    mergeOutput(
      target,
      "strategy",
      mapStrategyBrainToStructuredOutput(resolved.strategyBrainGraph)
    );
  }
  if (resolved.planningBrainGraph) {
    mergeOutput(
      target,
      "campaign_planning",
      mapPlanningBrainToStructuredOutput(resolved.planningBrainGraph)
    );
  }
}

function mergeEpisodeArtifactOutputs(
  target: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>,
  episode: ProjectEpisodeRecord
): void {
  const resolved = {
    ...(episode.resolvedGraphs ?? {}),
    ...resolveBrainOutputs({
      organizationId: episode.snapshot.organizationId,
      projectId: episode.snapshot.projectId,
      artifacts: episode.artifacts,
    }),
  };

  mergeResolvedGraphOutputs(target, resolved as ResolvedBrainOutputs);

  for (const brainId of episode.snapshot.completedBrains) {
    for (const capabilityId of capabilitiesOwnedByBrain(brainId)) {
      if (target[capabilityId]) continue;
      const fromGraph = outputForCompletedBrainCapability(
        capabilityId,
        resolved as ResolvedBrainOutputs
      );
      if (fromGraph) mergeOutput(target, capabilityId, fromGraph);
    }
  }
}

function outputForCompletedBrainCapability(
  capabilityId: BrainCapabilityId,
  resolved: ResolvedBrainOutputs
): BrainStructuredOutput | undefined {
  switch (capabilityId) {
    case "strategy":
      return resolved.strategyBrainGraph
        ? mapStrategyBrainToStructuredOutput(resolved.strategyBrainGraph)
        : undefined;
    case "campaign_planning":
      return resolved.planningBrainGraph
        ? mapPlanningBrainToStructuredOutput(resolved.planningBrainGraph)
        : undefined;
    default:
      return undefined;
  }
}

/** Synchronous resolution — layer repos, episode graphs, project session outputs. */
export function resolveEpisodeUpstreamOutputs(
  input: EpisodeUpstreamOutputContext
): Partial<Record<BrainCapabilityId, BrainStructuredOutput>> {
  const merged: Partial<Record<BrainCapabilityId, BrainStructuredOutput>> = {
    ...readCampaignBrainOutputs(input.project),
  };

  if (input.episode) {
    mergeEpisodeArtifactOutputs(merged, input.episode);
  }

  return merged;
}

/** Async enhancement — also loads latest compatible rows from brain_outputs persistence. */
export async function resolveEpisodeUpstreamOutputsAsync(
  input: EpisodeUpstreamOutputContext
): Promise<Partial<Record<BrainCapabilityId, BrainStructuredOutput>>> {
  const merged = resolveEpisodeUpstreamOutputs(input);
  const asyncOutputs = input.repositories?.async.outputs;
  if (!asyncOutputs) return merged;

  const capabilityIds: BrainCapabilityId[] = [
    "company_understanding",
    "brand_understanding",
    "strategy",
    "channel_planning",
    "campaign_planning",
    "creative_generation",
    "validation",
  ];

  for (const capabilityId of capabilityIds) {
    if (merged[capabilityId]) continue;
    const def = getBrainCapability(capabilityId);
    const record = await asyncOutputs.getLatestCompatible({
      organizationId: input.organizationId,
      capabilityId,
      capabilityVersion: def.version,
      campaignId: input.projectId,
      freshness: "any",
    });
    if (record?.output) {
      mergeOutput(merged, capabilityId, record.output);
    }
  }

  return merged;
}
