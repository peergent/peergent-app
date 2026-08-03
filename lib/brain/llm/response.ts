import { BrainLlmParseError } from "./errors";

export function parseJsonResponse(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new BrainLlmParseError("Empty LLM response.");
  }

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    throw new BrainLlmParseError("LLM response is not valid JSON.");
  }
}
