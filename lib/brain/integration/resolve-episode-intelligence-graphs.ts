/**
 * PX-63 — resolve canonical brain graphs from episode + bridge to legacy layer graphs
 * for Strategy capability path.
 */

import type { ResearchGraph } from "../layers/research";
import type { ReasoningGraph } from "../layers/reasoning";
import type { MarketingIntelligenceGraph } from "../layers/marketing-intelligence";
import type { ResearchBrainGraph } from "../layers/research/brain-types";
import type { ReasoningBrainGraph } from "../layers/reasoning/brain-types";
import type { MarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/brain-types";
import type { CompanyGraph } from "../layers/company/types";
import { resolveBrainOutputs } from "../project-runtime/brain-output-resolver";
import type { ProjectEpisodeRecord } from "../project-runtime/types";
import {
  bridgeMarketingIntelligenceBrainGraphToLegacy,
  bridgeReasoningBrainGraphToLegacy,
  bridgeResearchBrainGraphToLegacy,
} from "./bridge-brain-graphs-to-legacy";

export type EpisodeIntelligenceGraphBundle = {
  readonly companyGraph: CompanyGraph | null;
  readonly researchBrainGraph: ResearchBrainGraph | null;
  readonly reasoningBrainGraph: ReasoningBrainGraph | null;
  readonly marketingIntelligenceBrainGraph: MarketingIntelligenceBrainGraph | null;
  readonly researchGraph: ResearchGraph | null;
  readonly reasoningGraph: ReasoningGraph | null;
  readonly marketingIntelligenceGraph: MarketingIntelligenceGraph | null;
};

export function resolveEpisodeIntelligenceGraphs(
  episode: ProjectEpisodeRecord | null | undefined
): EpisodeIntelligenceGraphBundle {
  if (!episode) {
    return {
      companyGraph: null,
      researchBrainGraph: null,
      reasoningBrainGraph: null,
      marketingIntelligenceBrainGraph: null,
      researchGraph: null,
      reasoningGraph: null,
      marketingIntelligenceGraph: null,
    };
  }

  const resolved = resolveBrainOutputs({
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    artifacts: episode.artifacts,
    episodeResolvedGraphs: episode.resolvedGraphs,
  });

  return {
    companyGraph: resolved.companyGraph,
    researchBrainGraph: resolved.researchBrainGraph,
    reasoningBrainGraph: resolved.reasoningBrainGraph,
    marketingIntelligenceBrainGraph: resolved.marketingIntelligenceBrainGraph,
    researchGraph: resolved.researchBrainGraph
      ? bridgeResearchBrainGraphToLegacy(resolved.researchBrainGraph)
      : null,
    reasoningGraph: resolved.reasoningBrainGraph
      ? bridgeReasoningBrainGraphToLegacy(resolved.reasoningBrainGraph)
      : null,
    marketingIntelligenceGraph: resolved.marketingIntelligenceBrainGraph
      ? bridgeMarketingIntelligenceBrainGraphToLegacy(resolved.marketingIntelligenceBrainGraph)
      : null,
  };
}
