/**
 * Context assembly model — what the engine passes into each Brain.
 */

import type { BrainContextPackage, BrainContextSlices, BrainPriorOutput } from "./brain-contract";
import type { ProjectBrainId, ProjectEngineSnapshot } from "./types";

export type ProjectContextInput = {
  snapshot: ProjectEngineSnapshot;
  locale: "nl" | "en";
  /** From Context Engine / campaign context readiness */
  sliceAvailability: Partial<BrainContextSlices>;
  priorOutputs: readonly BrainPriorOutput[];
  now?: Date;
};

/** Assemble the context package for the next brain run. Engine-only — no brain logic. */
export function assembleBrainContext(input: ProjectContextInput): BrainContextPackage {
  const slices: BrainContextSlices = {
    business: input.sliceAvailability.business ?? false,
    brand: input.sliceAvailability.brand ?? false,
    website: input.sliceAvailability.website ?? false,
    products: input.sliceAvailability.products ?? false,
    competitors: input.sliceAvailability.competitors ?? false,
    goals: input.sliceAvailability.goals ?? false,
    campaign: input.sliceAvailability.campaign ?? true,
  };

  return {
    organizationId: input.snapshot.organizationId,
    peerId: input.snapshot.peerId,
    projectId: input.snapshot.projectId,
    episodeId: input.snapshot.episodeId,
    locale: input.locale,
    contextVersion: input.snapshot.contextVersion,
    slices,
    priorOutputs: input.priorOutputs,
    priorDecisionIds: [...input.snapshot.decisionIds],
    memoryRefs: input.priorOutputs
      .filter((o) => o.brainId === "memory")
      .map((o) => o.outputRef),
    assembledAt: (input.now ?? new Date()).toISOString(),
  };
}

/** Minimum slices required before research can start. */
export function isContextReadyForResearch(slices: BrainContextSlices): boolean {
  return slices.business && slices.campaign && (slices.website || slices.competitors);
}

/** Slices required per brain — engine validates before scheduling. */
export const BRAIN_CONTEXT_REQUIREMENTS: Readonly<
  Record<ProjectBrainId, readonly (keyof BrainContextSlices)[]>
> = {
  company: ["business", "brand", "website"],
  research: ["business", "campaign"],
  reasoning: ["business", "campaign"],
  marketing_intelligence: ["business", "competitors"],
  strategy: ["business", "goals", "campaign"],
  planning: ["campaign", "goals"],
  creative: ["brand", "campaign"],
  validation: ["campaign"],
  memory: ["business"],
  execution: ["campaign"],
  learning: ["campaign"],
};

export function contextSatisfiedForBrain(
  brainId: ProjectBrainId,
  slices: BrainContextSlices
): boolean {
  const required = BRAIN_CONTEXT_REQUIREMENTS[brainId] ?? [];
  return required.every((key) => slices[key]);
}
