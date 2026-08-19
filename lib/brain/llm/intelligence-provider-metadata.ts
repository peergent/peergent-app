/** PX-63B — provider metadata for intelligence brain graphs. */

export type IntelligenceProviderMode = "live_llm" | "deterministic_fallback" | "unavailable";

export type IntelligenceClaimClassification = "OBSERVED" | "DERIVED" | "HISTORICAL" | "UNKNOWN";

export type IntelligenceProviderMetadata = {
  readonly providerMode: IntelligenceProviderMode;
  readonly fallbackUsed: boolean;
  readonly providerId?: string;
  readonly modelId?: string;
  readonly generatedAt: string;
  readonly inputEvidenceCount?: number;
  readonly failureReason?: string;
  readonly graphReused?: boolean;
};

export function emptyIntelligenceProviderMetadata(
  mode: IntelligenceProviderMode,
  overrides?: Partial<IntelligenceProviderMetadata>
): IntelligenceProviderMetadata {
  return {
    providerMode: mode,
    fallbackUsed: mode === "deterministic_fallback",
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}
