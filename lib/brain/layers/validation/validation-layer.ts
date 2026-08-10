import { buildValidationGraph } from "./build-validation-graph";
import type { ValidationBrainInput, ValidationBrainOutput, ValidationGraph } from "./types";
import type { ValidationRepository } from "./validation-repository";
import { getDefaultValidationRepository } from "./validation-repository";
import { mapValidationGraphToBrainOutput } from "./map-validation-graph-to-output";
import { validateValidationGraph } from "./validation-validator";
import { VALIDATION_MODULE_SPECS } from "./modules/specs";

export type ValidationLayerResult = {
  graph: ValidationGraph;
  validation: ReturnType<typeof validateValidationGraph>;
  structuredOutput: ValidationBrainOutput["structuredOutput"];
  outputRef: string;
};

/**
 * Validation Brain Layer — evaluates Creative Brain output for publication readiness.
 * Does NOT create, rewrite, or publish.
 */
export class ValidationLayer {
  constructor(private readonly repository: ValidationRepository = getDefaultValidationRepository()) {}

  listModuleSpecs() {
    return VALIDATION_MODULE_SPECS;
  }

  buildGraph(input: ValidationBrainInput): ValidationLayerResult {
    const graph = buildValidationGraph(input);
    const validation = validateValidationGraph(graph);
    const structuredOutput = mapValidationGraphToBrainOutput({
      graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
    });
    const outputRef = `validation:${input.organizationId}:${input.projectId}:${graph.createdAt}`;
    return { graph, validation, structuredOutput, outputRef };
  }

  produceAndStore(input: ValidationBrainInput): ValidationLayerResult {
    const result = this.buildGraph(input);
    this.repository.store({
      key: {
        organizationId: input.organizationId,
        campaignId: input.projectId,
        episodeId: input.episodeId,
        correlationId: input.correlationId,
      },
      graph: result.graph,
      outputRef: result.outputRef,
      storedAt: new Date().toISOString(),
    });
    return result;
  }

  getLatestGraph(input: { organizationId: string; campaignId?: string }): ValidationGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createValidationLayer(repository?: ValidationRepository): ValidationLayer {
  return new ValidationLayer(repository);
}

export function collectValidationGraph(input: ValidationBrainInput): ValidationGraph {
  return buildValidationGraph(input);
}
