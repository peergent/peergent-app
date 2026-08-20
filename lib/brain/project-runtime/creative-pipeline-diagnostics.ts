/**
 * PX-64 — structured diagnostics for Creative Brain LLM execution.
 */

export type CreativePipelineDiagnosticEvent =
  | "creative_llm_started"
  | "creative_llm_completed"
  | "creative_llm_failed"
  | "creative_graph_reused"
  | "creative_validation_failed"
  | "creative_repair_attempted";

export type CreativePipelineDiagnosticPayload = {
  readonly event: CreativePipelineDiagnosticEvent;
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly brainId?: string;
  readonly provider?: string;
  readonly providerMode?: string;
  readonly modelId?: string;
  readonly evidenceCount?: number;
  readonly inputEvidenceCount?: number;
  readonly graphRef?: string;
  readonly fallbackUsed?: boolean;
  readonly durationMs?: number;
  readonly reason?: string;
  readonly graphReused?: boolean;
};

const listeners: Array<(payload: CreativePipelineDiagnosticPayload) => void> = [];

export function onCreativePipelineDiagnostic(
  listener: (payload: CreativePipelineDiagnosticPayload) => void
): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function emitCreativePipelineDiagnostic(payload: CreativePipelineDiagnosticPayload): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[creative-pipeline]", payload.event, {
      projectId: payload.projectId,
      episodeId: payload.episodeId,
      provider: payload.provider,
      modelId: payload.modelId,
      fallbackUsed: payload.fallbackUsed,
    });
  }
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch {
      // diagnostic listeners must not break pipeline
    }
  }
}
