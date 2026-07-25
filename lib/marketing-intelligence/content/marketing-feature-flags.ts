/**
 * Server-side marketing feature flags (env-backed). Defaults are production-safe.
 */

/** Env: set to "true" to enable Creative Brief sections in content draft prompts. */
const ENV_MARKETING_CREATIVE_BRIEF_PROMPT = "MARKETING_CREATIVE_BRIEF_PROMPT_ENABLED";

/**
 * When false (default), marketing content generation uses the legacy prompt path only.
 */
export function isMarketingCreativeBriefPromptEnabled(
  override?: boolean
): boolean {
  if (override !== undefined) {
    return override;
  }
  return process.env[ENV_MARKETING_CREATIVE_BRIEF_PROMPT] === "true";
}

export const marketingCreativeBriefPromptEnabled = {
  envKey: ENV_MARKETING_CREATIVE_BRIEF_PROMPT,
  default: false,
} as const;
