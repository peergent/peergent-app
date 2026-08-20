/**
 * PX-64 — durable Creative LLM audit events (no prompts or customer content).
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { IntelligenceProviderMetadata } from "../llm/intelligence-provider-metadata";
import { appendProjectEvent } from "../persistence/layer/supabase-sync";
import { getActiveDurablePersistence } from "../persistence/layer/active-durable-persistence";
import { emitCreativePipelineDiagnostic } from "./creative-pipeline-diagnostics";

export type CreativeLlmAuditPayload = {
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly graphRef: string;
  readonly providerMeta: IntelligenceProviderMetadata | null;
  readonly durationMs?: number;
  readonly graphReused?: boolean;
};

export function buildCreativeLlmAuditMetadata(payload: CreativeLlmAuditPayload): Record<string, unknown> {
  const meta = payload.providerMeta;
  return {
    event: payload.graphReused ? "creative_graph_reused" : "creative_llm_execution",
    organizationId: payload.organizationId,
    projectId: payload.projectId,
    episodeId: payload.episodeId ?? null,
    brainId: "creative",
    providerMode: meta?.providerMode ?? (payload.graphReused ? "reused" : "unknown"),
    providerId: meta?.providerId ?? null,
    modelId: meta?.modelId ?? null,
    fallbackUsed: meta?.fallbackUsed ?? payload.graphReused ?? false,
    graphRef: payload.graphRef,
    durationMs: payload.durationMs ?? null,
    inputEvidenceCount: meta?.inputEvidenceCount ?? null,
    graphReused: payload.graphReused ?? false,
    timestamp: new Date().toISOString(),
  };
}

export async function appendCreativeLlmAuditEvent(input: {
  supabase?: AppSupabaseClient | null;
  correlationId: string;
  payload: CreativeLlmAuditPayload;
}): Promise<void> {
  const metadata = buildCreativeLlmAuditMetadata(input.payload);
  const meta = input.payload.providerMeta;

  emitCreativePipelineDiagnostic({
    event: input.payload.graphReused ? "creative_graph_reused" : "creative_llm_completed",
    organizationId: input.payload.organizationId,
    projectId: input.payload.projectId,
    episodeId: input.payload.episodeId,
    brainId: "creative",
    provider: meta?.providerId,
    providerMode: meta?.providerMode,
    modelId: meta?.modelId,
    graphRef: input.payload.graphRef,
    fallbackUsed: meta?.fallbackUsed,
    durationMs: input.payload.durationMs,
    inputEvidenceCount: meta?.inputEvidenceCount,
    graphReused: input.payload.graphReused,
  });

  const durable = getActiveDurablePersistence();
  const event = {
    eventId: `creative-audit-${input.payload.graphRef.replace(/[:/]/g, "-")}`,
    projectId: input.payload.projectId,
    organizationId: input.payload.organizationId,
    brainId: "creative" as const,
    timestamp: new Date().toISOString(),
    correlationId: input.correlationId,
    type: input.payload.graphReused ? "creative_graph_reused" : "creative_llm_execution",
    outputRef: input.payload.graphRef,
    customerSafeSummary: input.payload.graphReused
      ? "Creative graph reused from durable storage"
      : `Creative executed (${meta?.providerMode ?? "unknown"})`,
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
