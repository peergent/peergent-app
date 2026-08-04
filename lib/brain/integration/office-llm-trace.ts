import "server-only";

import type { BrainLlmFailureCategory } from "../llm/failure-categories";

export type OfficeLlmTraceMark =
  | "OFFICE_ACTION_ENTER"
  | "SERVER_ENV_RESOLVED"
  | "PROVIDERS_CREATED"
  | "PROVIDER_SELECTED"
  | "LLM_EXECUTE_ENTER"
  | "PROMPT_BUILT"
  | "OPENAI_FETCH_STARTED"
  | "OPENAI_FETCH_COMPLETED"
  | "RESPONSE_PARSED"
  | "VALIDATION_COMPLETED"
  | "FALLBACK_STARTED"
  | "FALLBACK_COMPLETED"
  | "ACTION_RETURNED";

export function markOfficeLlmTrace(
  mark: OfficeLlmTraceMark,
  detail?: Record<string, string | number | boolean | null | undefined>
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[office-llm-trace]", mark, detail ?? null);
}

export function markOfficeLlmFallback(
  category: BrainLlmFailureCategory,
  detail?: Record<string, string | number | boolean | null | undefined>
): void {
  markOfficeLlmTrace("FALLBACK_STARTED", { category, ...detail });
  markOfficeLlmTrace("FALLBACK_COMPLETED", { category, ...detail });
}
