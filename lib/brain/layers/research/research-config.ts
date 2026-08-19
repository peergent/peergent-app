/** PX-63 — bounded research configuration (production-safe defaults). */

export type ResearchRuntimeConfig = {
  readonly enableExternalFetch: boolean;
  readonly fetchTimeoutMs: number;
  readonly maxResponseBytes: number;
  readonly maxUrlsPerRun: number;
  readonly maxSearchQueries: number;
};

export function resolveResearchRuntimeConfig(): ResearchRuntimeConfig {
  const disableExternal =
    process.env.BRAIN_RESEARCH_DISABLE_EXTERNAL === "true" ||
    process.env.NODE_ENV === "test";

  return {
    enableExternalFetch: !disableExternal,
    fetchTimeoutMs: Number(process.env.BRAIN_RESEARCH_FETCH_TIMEOUT_MS ?? 12_000),
    maxResponseBytes: Number(process.env.BRAIN_RESEARCH_MAX_RESPONSE_BYTES ?? 512_000),
    maxUrlsPerRun: Number(process.env.BRAIN_RESEARCH_MAX_URLS ?? 6),
    maxSearchQueries: Number(process.env.BRAIN_RESEARCH_MAX_SEARCH_QUERIES ?? 3),
  };
}
