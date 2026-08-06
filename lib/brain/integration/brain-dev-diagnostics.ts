import type { BrainRunResult } from "../runtime/run-result";

export type BrainDevDiagnostics = {
  provider: string;
  initialProvider?: string;
  finalProvider?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number | null;
  fallbackUsed: boolean;
  fallbackReason?: string;
  validationRetries: number | null;
  cacheHit: boolean;
  /** stored = session campaignBrainOutputs reuse; llm = fresh provider call */
  outputSource?: "stored" | "llm" | "deterministic";
  llmRegistered?: boolean;
  featureFlagEnabled?: boolean;
  apiKeyPresent?: boolean;
  requestStarted?: boolean;
  httpStatus?: number | null;
  failureCategory?: string;
  upstreamStrategyFound?: boolean;
  upstreamChannelsFound?: boolean;
  strategyVersionCompatible?: boolean;
  channelVersionCompatible?: boolean;
  selectedChannelCount?: number;
  businessValidationResult?: string;
  businessValidationSubreason?: string;
  approvedCanonicalChannels?: string;
  generatedCanonicalChannels?: string;
  unmatchedChannels?: string;
  validationRepairCount?: number | null;
  initialRequestDurationMs?: number | null;
  repairRequestDurationMs?: number | null;
  fallbackDurationMs?: number | null;
  timeoutOwner?: string;
  configuredTimeoutMs?: number | null;
  timeoutAttemptNumber?: number | null;
  responseHeadersReceived?: boolean;
  responseBodyStarted?: boolean;
  /** Sprint 11.1 — campaign_planning integration */
  planningSource?: "stored" | "built";
  planningCacheReused?: boolean;
  planningVersion?: string;
  planningDecisionCount?: number;
  planningDependencyCount?: number;
  planningCriticalPathLength?: number;
  planningValidationStatus?: string;
  strategyGraphVersion?: string;
  decisionEngineVersion?: string;
  brandLayerVersion?: string;
};

export type BrainDevDiagnosticsExtras = {
  fallbackReason?: string;
  validationRetries?: number;
  latencyMs?: number;
};

/** Development-only diagnostics — never render in production customer UI. */
export function extractBrainDevDiagnostics(
  result: BrainRunResult,
  extras: BrainDevDiagnosticsExtras = {}
): BrainDevDiagnostics {
  const { run } = result;
  const started = Date.parse(run.startedAt);
  const completed = run.completedAt ? Date.parse(run.completedAt) : NaN;
  const derivedLatency =
    Number.isFinite(started) && Number.isFinite(completed) ? completed - started : null;

  const initialProvider = run.usage.initialProviderId ?? run.usage.providerId ?? "deterministic";
  const finalProvider = run.usage.finalProviderId ?? run.usage.providerId ?? "deterministic";
  const explicitFallbackReason = run.usage.fallbackReason ?? extras.fallbackReason;
  const fallbackUsed = Boolean(
    explicitFallbackReason ||
      (initialProvider === "llm" && finalProvider !== "llm") ||
      (run.capabilityId === "strategy" &&
        finalProvider !== "llm" &&
        run.usage.providerId !== undefined &&
        initialProvider !== "deterministic")
  );

  return {
    provider: finalProvider,
    initialProvider,
    finalProvider,
    model: run.usage.modelId ?? "—",
    inputTokens: run.usage.inputTokens ?? 0,
    outputTokens: run.usage.outputTokens ?? 0,
    latencyMs: extras.latencyMs ?? derivedLatency,
    fallbackUsed,
    fallbackReason: explicitFallbackReason,
    failureCategory: explicitFallbackReason,
    validationRetries: extras.validationRetries ?? run.usage.validationAttempts ?? null,
    cacheHit: Boolean(run.usage.cacheHit ?? result.cacheHit),
    outputSource: (run.usage.cacheHit ?? result.cacheHit)
      ? "stored"
      : finalProvider === "llm"
        ? "llm"
        : "deterministic",
    requestStarted:
      (run.usage.cacheHit ?? result.cacheHit)
        ? false
        : run.usage.requestStarted ??
      ((run.usage.inputTokens ?? 0) > 0 ||
        (run.usage.outputTokens ?? 0) > 0 ||
        finalProvider === "llm"),
    upstreamStrategyFound: run.usage.upstreamStrategyFound,
    upstreamChannelsFound: run.usage.upstreamChannelsFound,
    strategyVersionCompatible: run.usage.strategyVersionCompatible,
    channelVersionCompatible: run.usage.channelVersionCompatible,
    selectedChannelCount: run.usage.selectedChannelCount,
    businessValidationResult:
      run.usage.businessValidationSubreason ??
      run.usage.businessValidationCategory ??
      explicitFallbackReason,
    businessValidationSubreason: run.usage.businessValidationSubreason,
    approvedCanonicalChannels: run.usage.approvedCanonicalChannels,
    generatedCanonicalChannels: run.usage.generatedCanonicalChannels,
    unmatchedChannels: run.usage.unmatchedChannels,
    validationRepairCount: run.usage.validationRepairCount ?? null,
    initialRequestDurationMs: run.usage.initialRequestDurationMs ?? null,
    repairRequestDurationMs: run.usage.repairRequestDurationMs ?? null,
    fallbackDurationMs: run.usage.fallbackDurationMs ?? null,
    timeoutOwner: run.usage.timeoutOwner,
    configuredTimeoutMs: run.usage.configuredTimeoutMs ?? null,
    timeoutAttemptNumber: run.usage.timeoutAttemptNumber ?? null,
    responseHeadersReceived: run.usage.responseHeadersReceived,
    responseBodyStarted: run.usage.responseBodyStarted,
  };
}

export function isBrainDevDiagnosticsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
