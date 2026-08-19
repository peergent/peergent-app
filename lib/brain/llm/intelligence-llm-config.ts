/** PX-63B — bounded LLM config for intelligence brains. */

export type IntelligenceLlmConfig = {
  readonly maxEvidenceItems: number;
  readonly maxExcerptChars: number;
  readonly maxOutputTokens: number;
  readonly timeoutMs: number;
  readonly maxRepairAttempts: number;
};

export function resolveIntelligenceLlmConfig(): IntelligenceLlmConfig {
  return {
    maxEvidenceItems: Number(process.env.BRAIN_INTELLIGENCE_MAX_EVIDENCE ?? 16),
    maxExcerptChars: Number(process.env.BRAIN_INTELLIGENCE_MAX_EXCERPT_CHARS ?? 320),
    maxOutputTokens: Number(process.env.BRAIN_INTELLIGENCE_MAX_OUTPUT_TOKENS ?? 4096),
    timeoutMs: Number(process.env.BRAIN_INTELLIGENCE_TIMEOUT_MS ?? 45_000),
    maxRepairAttempts: Number(process.env.BRAIN_INTELLIGENCE_MAX_REPAIR_ATTEMPTS ?? 1),
  };
}
