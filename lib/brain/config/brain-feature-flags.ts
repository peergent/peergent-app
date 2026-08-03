/** Brain feature flags — production-safe defaults (off unless explicitly enabled). */

export function isBrainUseOpenAIEnabled(override?: boolean): boolean {
  if (override !== undefined) return override;
  return process.env.BRAIN_USE_OPENAI === "true";
}

export const BRAIN_FEATURE_FLAGS = {
  useOpenAI: {
    envKey: "BRAIN_USE_OPENAI",
    defaultEnabled: false,
    description: "Route strategy capability through OpenAI via Brain LLM layer.",
  },
} as const;
