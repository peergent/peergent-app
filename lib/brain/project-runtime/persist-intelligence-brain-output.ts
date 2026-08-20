/**
 * PX-63D — awaited durable persistence for intelligence brain snapshots.
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import { upsertLayerDocument } from "../persistence/layer/supabase-sync";
import { projectScopeKey } from "../persistence/layer/scope-keys";
import { getDefaultResearchBrainRepository } from "../layers/research/research-brain-repository";
import { getDefaultReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { getDefaultMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { getDefaultStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import type { ResearchSnapshot } from "../layers/research/brain-types";
import type { ReasoningSnapshot } from "../layers/reasoning/brain-types";
import type { MarketingIntelligenceSnapshot } from "../layers/marketing-intelligence/brain-types";
import type { StrategySnapshot } from "../layers/strategy/brain-types";
import {
  assertIntelligencePersistenceContract,
  attachIntelligenceGraphToResolvedGraphs,
  INTELLIGENCE_LAYER_DOCUMENT_KIND,
  intelligenceProviderMetaFromGraph,
  type IntelligenceGraphByBrainId,
  type IntelligencePersistenceBrainId,
} from "./intelligence-persistence-contract";
import {
  appendIntelligenceLlmAuditEvent,
  auditPayloadFromProviderMeta,
} from "./intelligence-persistence-audit";
import { emitPersistenceDiagnostic } from "../persistence/layer/persistence-diagnostics";
import type { ProjectEpisodeRecord } from "./types";

type IntelligenceSnapshot =
  | ResearchSnapshot
  | ReasoningSnapshot
  | MarketingIntelligenceSnapshot
  | StrategySnapshot;

function snapshotForBrain(
  brainId: IntelligencePersistenceBrainId,
  input: { organizationId: string; projectId: string }
): IntelligenceSnapshot | null {
  const key = { organizationId: input.organizationId, projectId: input.projectId };
  switch (brainId) {
    case "research":
      return getDefaultResearchBrainRepository().getLatestSnapshot(key);
    case "reasoning":
      return getDefaultReasoningBrainRepository().getLatestSnapshot(key);
    case "marketing_intelligence":
      return getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot(key);
    case "strategy":
      return getDefaultStrategyBrainRepository().getLatestSnapshot(key);
    default:
      return null;
  }
}

export async function persistIntelligenceBrainSnapshotCritical(input: {
  brainId: IntelligencePersistenceBrainId;
  organizationId: string;
  projectId: string;
  episodeId?: string;
  correlationId: string;
  peerId?: string;
  supabase?: AppSupabaseClient | null;
  durationMs?: number;
  graphReused?: boolean;
  /** When re-persisting from episode cache without L1 repo snapshot. */
  graph?: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId];
  outputRef?: string;
}): Promise<{
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId];
  outputRef: string;
  episodeResolvedGraphs: ProjectEpisodeRecord["resolvedGraphs"];
}> {
  const snapshot =
    snapshotForBrain(input.brainId, input) ??
    (input.graph && input.outputRef
      ? ({
          id: `${input.brainId}-rehydrate`,
          organizationId: input.organizationId,
          projectId: input.projectId,
          campaignId: input.projectId,
          graph: input.graph,
          outputRef: input.outputRef,
          storedAt: new Date().toISOString(),
        } as IntelligenceSnapshot)
      : null);

  if (!snapshot?.graph) {
    throw new Error(`intelligence_snapshot_missing:${input.brainId}`);
  }

  const graph = snapshot.graph as IntelligenceGraphByBrainId[IntelligencePersistenceBrainId];
  const outputRef = snapshot.outputRef;

  assertIntelligencePersistenceContract({
    brainId: input.brainId,
    graph,
    outputRef,
    peerId: input.peerId,
  });

  const scope = projectScopeKey({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.projectId,
  });

  const documentKind = INTELLIGENCE_LAYER_DOCUMENT_KIND[input.brainId];
  const row = {
    organization_id: input.organizationId,
    brain_id: input.brainId,
    document_kind: documentKind,
    document_id: snapshot.id,
    scope_key: scope,
    project_id: input.projectId,
    campaign_id: input.projectId,
    output_ref: outputRef,
    version: "version" in snapshot && typeof snapshot.version === "number" ? snapshot.version : 1,
    schema_version: "1",
    payload: snapshot,
  };

  emitPersistenceDiagnostic({
    event: "persistence_layer_document_upsert_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    brainId: input.brainId,
    documentKind,
    operation: "intelligence_snapshot_critical",
  });

  const durable = getActiveDurablePersistence();
  if (durable?.mode === "supabase" && input.supabase) {
    await upsertLayerDocument(input.supabase, row);
  } else if (durable?.mode === "simulated") {
    const { simulatedDurableStore } = await import("../persistence/layer/simulated-durable-store");
    simulatedDurableStore.upsertDocument(row);
  } else if (input.supabase) {
    await upsertLayerDocument(input.supabase, row);
  }

  emitPersistenceDiagnostic({
    event: "persistence_layer_document_upsert_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    brainId: input.brainId,
    documentKind,
    operation: "intelligence_snapshot_critical",
  });

  const providerMeta = intelligenceProviderMetaFromGraph(input.brainId, graph);
  await appendIntelligenceLlmAuditEvent({
    supabase: input.supabase,
    correlationId: input.correlationId,
    payload: auditPayloadFromProviderMeta({
      organizationId: input.organizationId,
      projectId: input.projectId,
      episodeId: input.episodeId,
      brainId: input.brainId,
      graphRef: outputRef,
      providerMeta,
      durationMs: input.durationMs,
      graphReused: input.graphReused,
      researchEvidenceCount:
        input.brainId === "research"
          ? (graph as import("../layers/research/brain-types").ResearchBrainGraph).evidence.length
          : undefined,
    }),
  });

  return {
    graph,
    outputRef,
    episodeResolvedGraphs: attachIntelligenceGraphToResolvedGraphs({}, input.brainId, graph),
  };
}

export function mergeEpisodeIntelligenceResolvedGraphs(
  episode: ProjectEpisodeRecord,
  brainId: IntelligencePersistenceBrainId,
  graph: IntelligenceGraphByBrainId[IntelligencePersistenceBrainId]
): ProjectEpisodeRecord {
  return {
    ...episode,
    resolvedGraphs: attachIntelligenceGraphToResolvedGraphs(episode.resolvedGraphs ?? {}, brainId, graph),
  };
}
