/**
 * PX-63 — structured diagnostics for Research → Reasoning → MI → Strategy handoff.
 */

export type IntelligencePipelineDiagnosticEvent =
  | "research_started"
  | "research_provider_called"
  | "research_source_acquired"
  | "research_completed"
  | "research_fallback_used"
  | "reasoning_started"
  | "reasoning_completed"
  | "reasoning_fallback_used"
  | "marketing_intelligence_started"
  | "marketing_intelligence_completed"
  | "marketing_intelligence_fallback_used"
  | "strategy_intelligence_handoff_completed"
  | "reasoning_llm_started"
  | "reasoning_llm_completed"
  | "reasoning_llm_failed"
  | "marketing_intelligence_llm_started"
  | "marketing_intelligence_llm_completed"
  | "marketing_intelligence_llm_failed"
  | "intelligence_graph_reused"
  | "strategy_llm_started"
  | "strategy_llm_completed"
  | "strategy_llm_failed";

export type IntelligencePipelineDiagnosticPayload = {
  readonly event: IntelligencePipelineDiagnosticEvent;
  readonly organizationId: string;
  readonly projectId: string;
  readonly episodeId?: string;
  readonly brainId?: string;
  readonly provider?: string;
  readonly sourceCount?: number;
  readonly evidenceCount?: number;
  readonly graphRef?: string;
  readonly fallbackUsed?: boolean;
  readonly durationMs?: number;
  readonly fetchFailures?: number;
  readonly reason?: string;
  readonly modelId?: string;
  readonly providerMode?: string;
  readonly inputEvidenceCount?: number;
  readonly graphReused?: boolean;
};

const listeners: Array<(payload: IntelligencePipelineDiagnosticPayload) => void> = [];

export function onIntelligencePipelineDiagnostic(
  listener: (payload: IntelligencePipelineDiagnosticPayload) => void
): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function emitIntelligencePipelineDiagnostic(
  payload: IntelligencePipelineDiagnosticPayload
): void {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[intelligence-pipeline]", payload.event, {
      projectId: payload.projectId,
      episodeId: payload.episodeId,
      provider: payload.provider,
      evidenceCount: payload.evidenceCount,
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

/** Production invariant — placeholder capability output must never pass as MI/reasoning success. */
export const PLACEHOLDER_MARKET_UNDERSTANDING_VALUE =
  "Deterministic output for market_understanding";

export function containsPlaceholderMarketUnderstanding(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return value.includes(PLACEHOLDER_MARKET_UNDERSTANDING_VALUE);
}
