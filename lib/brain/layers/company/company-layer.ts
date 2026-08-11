import { buildCompanyGraph } from "./build-company-graph";
import { buildCompanyOutput } from "./company-output";
import type { CompanyRepository } from "./company-repository";
import { appendHistoryEntry, getDefaultCompanyRepository } from "./company-repository";
import { validateCompanyGraph } from "./company-validator";
import type { CompanyBrainInput, CompanyBrainOutput, CompanyGraphSnapshot } from "./types";

export type CompanyLayerResult = CompanyBrainOutput & {
  validation: ReturnType<typeof validateCompanyGraph>;
};

/**
 * Company Brain Layer — assembles canonical organizational knowledge.
 * Never generates campaigns, validates, executes, or learns.
 */
export class CompanyLayer {
  constructor(private readonly repository: CompanyRepository = getDefaultCompanyRepository()) {}

  buildGraph(input: CompanyBrainInput): CompanyLayerResult {
    const prior = this.repository.getLatest(input.organizationId);
    const graph = buildCompanyGraph(input, prior?.graph.versionMeta.version);
    const validation = validateCompanyGraph(graph);
    const outputRef = `company:${input.organizationId}:v${graph.versionMeta.version}:${graph.updatedAt}`;

    const snapshot: CompanyGraphSnapshot = {
      id: `csnap-${graph.versionMeta.version}-${graph.updatedAt}`,
      organizationId: input.organizationId,
      version: graph.versionMeta.version,
      graph,
      outputRef,
      storedAt: new Date().toISOString(),
    };

    const output = buildCompanyOutput({
      graph,
      snapshot,
      outputRef,
      locale: input.locale,
    });

    return { ...output, validation };
  }

  produceAndStore(input: CompanyBrainInput): CompanyLayerResult {
    const result = this.buildGraph(input);
    const priorHistory = this.repository.getHistory(input.organizationId);

    const history = appendHistoryEntry(priorHistory, {
      version: result.graph.versionMeta.version,
      snapshotId: result.snapshot.id,
      createdAt: result.graph.createdAt,
      author: result.graph.versionMeta.author,
      changeReason: result.graph.versionMeta.changeReason,
    });

    this.repository.store({
      organizationId: input.organizationId,
      graph: result.graph,
      snapshot: result.snapshot,
      outputRef: result.outputRef,
      storedAt: result.snapshot.storedAt,
      history,
    });

    return result;
  }

  getLatestGraph(organizationId: string) {
    return this.repository.getLatest(organizationId)?.graph ?? null;
  }
}

export function createCompanyLayer(repository?: CompanyRepository): CompanyLayer {
  return new CompanyLayer(repository);
}

export function collectCompanyGraph(input: CompanyBrainInput) {
  return buildCompanyGraph(input);
}
