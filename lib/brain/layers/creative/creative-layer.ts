import { buildCreativeGraph, type CreativeBrainInput } from "./build-creative-graph";
import type { CreativeRepository } from "./creative-repository";
import { getDefaultCreativeRepository } from "./creative-repository";
import { mapCreativeGraphToBrainOutput } from "./map-creative-graph-to-output";
import { validateCreativeGraph } from "./creative-validator";
import { CREATIVE_MODULE_SPECS } from "./modules/specs";
import type { CreativeBrainOutput, CreativeGraph } from "./types";

export type CreativeLayerResult = {
  graph: CreativeGraph;
  validation: ReturnType<typeof validateCreativeGraph>;
  structuredOutput: CreativeBrainOutput["structuredOutput"];
  outputRef: string;
};

/**
 * Creative Brain Layer — transforms business understanding into structured creative direction.
 * Does NOT publish, execute, or optimize.
 */
export class CreativeLayer {
  constructor(private readonly repository: CreativeRepository = getDefaultCreativeRepository()) {}

  listModuleSpecs() {
    return CREATIVE_MODULE_SPECS;
  }

  buildGraph(input: CreativeBrainInput): CreativeLayerResult {
    const graph = buildCreativeGraph(input);
    const validation = validateCreativeGraph(graph);
    const structuredOutput = mapCreativeGraphToBrainOutput({
      graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
    });
    const outputRef = `creative:${input.organizationId}:${input.projectId}:${graph.createdAt}`;
    return { graph, validation, structuredOutput, outputRef };
  }

  produceAndStore(input: CreativeBrainInput): CreativeLayerResult {
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

  getLatestGraph(input: { organizationId: string; campaignId?: string }): CreativeGraph | null {
    return this.repository.getLatest(input)?.graph ?? null;
  }
}

export function createCreativeLayer(repository?: CreativeRepository): CreativeLayer {
  return new CreativeLayer(repository);
}

export function collectCreativeGraph(input: CreativeBrainInput): CreativeGraph {
  return buildCreativeGraph(input);
}
