/**
 * Project Brain integration — Creative + Validation Brain registration.
 * Does not modify Project Engine internals.
 */

import type { ProjectBrainRegistry } from "../project-engine/brain-contract";
import { creativeBrainContract } from "../layers/creative/creative-brain-executor";
import { validationBrainContract } from "../layers/validation/validation-brain-executor";
import { memoryBrainContract } from "../layers/memory/memory-brain-executor";
import { executionBrainContract } from "../layers/execution/execution-brain-executor";
import { companyBrainContract } from "../layers/company/company-brain-executor";
import { researchBrainContract } from "../layers/research/research-brain-executor";
import { reasoningBrainContract } from "../layers/reasoning/reasoning-brain-executor";

/** Default registry with production Brain implementations. */
export function createDefaultProjectBrainRegistry(): ProjectBrainRegistry {
  return {
    company: companyBrainContract,
    research: researchBrainContract,
    reasoning: reasoningBrainContract,
    creative: creativeBrainContract,
    validation: validationBrainContract,
    memory: memoryBrainContract,
    execution: executionBrainContract,
  };
}

export {
  companyBrainContract,
  researchBrainContract,
  reasoningBrainContract,
  creativeBrainContract,
  validationBrainContract,
  memoryBrainContract,
  executionBrainContract,
};
