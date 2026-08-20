/**
 * PX-63D — durable intelligence LLM audit events (no prompts or customer content).
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { IntelligenceProviderMetadata } from "../llm/intelligence-provider-metadata";
import type { IntelligencePersistenceBrainId } from "./intelligence-persistence-contract";
import { appendProjectEvent } from "../persistence/layer/supabase-sync";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import { emitIntelligencePipelineDiagnostic } from "./intelligence-pipeline-diagnostics";

export type IntelligenceLlmAuditPayload = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly brainId: IntelligencePersistenceBrainId;
  readonly providerMode: string;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly fallbackUsed: boolean;
  readonly graphRef: string;
  readonly durationMs?: number;
  readonly inputEvidenceCount?: number;
  readonly graphReused?: boolean;
};

export function buildIntelligenceLlmAuditMetadata(
  payload: IntelligenceLlmAuditPayload
): Record<string, unknown> {
  return {
    event: "intelligence_llm_execution",
    organizationId: payload.organizationId,
    projectId: payload.projectId,
    episodeId: payload.episodeId ?? null,
    brainId: payload.brainId,
    providerMode: payload.providerMode,
    providerId: payload.providerId ?? null,
    modelId: payload.modelId ?? null,
    fallbackUsed: payload.fallbackUsed,
    graphRef: payload.graphRef,
    durationMs: payload.durationMs ?? null,
    inputEvidenceCount: payload.inputEvidenceCount ?? null,
    graphReused: payload.graphReused ?? false,
    timestamp: new Date().toISOString(),
  };
}

export async function appendIntelligenceLlmAuditEvent(input: {
  supabase?: AppSupabaseClient | null;
  correlationId: string;
  payload: IntelligenceLlmAuditPayload;
}): Promise<void> {
  const metadata = buildIntelligenceLlmAuditMetadata(input.payload);

  emitIntelligencePipelineDiagnostic({
    event:
      input.payload.brainId === "research"
        ? "research_completed"
        : input.payload.brainId === "reasoning"
          ? "reasoning_llm_completed"
          : input.payload.brainId === "marketing_intelligence"
            ? "marketing_intelligence_llm_completed"
            : "strategy_llm_completed",
    organizationId: input.payload.organizationId,
    projectId: input.payload.projectId,
    episodeId: input.payload.episodeId,
    brainId: input.payload.brainId,
    provider: input.payload.providerId,
    providerMode: input.payload.providerMode,
    modelId: input.payload.modelId,
    graphRef: input.payload.graphRef,
    fallbackUsed: input.payload.fallbackUsed,
    durationMs: input.payload.durationMs,
    inputEvidenceCount: input.payload.inputEvidenceCount,
    graphReused: input.payload.graphReused,
  });

  const durable = getActiveDurablePersistence();
  const event = {
    eventId: `intel-audit-${input.payload.brainId}-${input.payload.graphRef.replace(/[:/]/g, "-")}`,
    projectId: input.payload.projectId,
    organizationId: input.payload.organizationId,
    brainId: input.payload.brainId,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId,
    type: "intelligence_llm_execution",
    outputRef: input.payload.graphRef,
    customerSafeSummary: `${input.payload.brainId} intelligence executed (${input.payload.providerMode})`,
    metadata,
  };

  if (durable) {
    await durable.appendEventTelemetry(event);
    return;
  }

  if (input.supabase) {
    await appendProjectEvent(input.supabase, event);
  }
}

export function auditPayloadFromProviderMeta(input: {
  organizationId: string;
  projectId: string;
  episodeId?: string;
  brainId: IntelligencePersistenceBrainId;
  graphRef: string;
  providerMeta: IntelligenceProviderMetadata | null;
  durationMs?: number;
  graphReused?: boolean;
  researchEvidenceCount?: number;
}): IntelligenceLlmAuditPayload {
  const meta = input.providerMeta;
  return {
    organizationId: input.organizationId,
    projectId: input.projectId,
    episodeId: input.episodeId,
    brainId: input.brainId,
    providerMode: meta?.providerMode ?? "unknown",
    providerId: meta?.providerId,
    modelId: meta?.modelId,
    fallbackUsed: meta?.fallbackUsed ?? true,
    graphRef: input.graphRef,
    durationMs: input.durationMs,
    inputEvidenceCount: meta?.inputEvidenceCount ?? input.researchEvidenceCount,
    graphReused: input.graphReused,
  };
}
