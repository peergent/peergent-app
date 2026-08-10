/**
 * Project Brain integration — Creative + Validation Brain registration.
 * Does not modify Project Engine internals.
 */

import type { ProjectBrainRegistry } from "../project-engine/brain-contract";
import { creativeBrainContract } from "../layers/creative/creative-brain-executor";
import { validationBrainContract } from "../layers/validation/validation-brain-executor";
import { memoryBrainContract } from "../layers/memory/memory-brain-executor";

/** Default registry with production Brain implementations. */
export function createDefaultProjectBrainRegistry(): ProjectBrainRegistry {
  return {
    creative: creativeBrainContract,
    validation: validationBrainContract,
    memory: memoryBrainContract,
  };
}

export { creativeBrainContract, validationBrainContract, memoryBrainContract };
