import { produceCreativeBrainGraph } from "./produce-creative-brain-graph";
import type { CreativeBrainInput } from "./build-creative-graph";
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
 * PX-64 — production uses LLM-generated channel-ready assets.
 */
export class CreativeLayer {
  constructor(private readonly repository: CreativeRepository = getDefaultCreativeRepository()) {}

  listModuleSpecs() {
    return CREATIVE_MODULE_SPECS;
  }

  async buildGraph(input: CreativeBrainInput): Promise<CreativeLayerResult> {
    const graph = await produceCreativeBrainGraph(input);
    const validation = validateCreativeGraph(graph);
    const structuredOutput = mapCreativeGraphToBrainOutput({
      graph,
      campaignContext: input.campaignContext,
      locale: input.locale,
    });
    const outputRef = `creative:${input.organizationId}:${input.projectId}:${graph.createdAt}`;
    return { graph, validation, structuredOutput, outputRef };
  }

  async produceAndStore(input: CreativeBrainInput): Promise<CreativeLayerResult> {
    const result = await this.buildGraph(input);
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

export async function collectCreativeGraph(input: CreativeBrainInput): Promise<CreativeGraph> {
  return produceCreativeBrainGraph(input);
}
