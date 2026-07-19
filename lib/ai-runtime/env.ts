import {
  DEFAULT_AI_MAX_TOKENS,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_OPENAI_MODEL,
} from "./types";

export function getOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function getOpenAIModel(override?: string): string {
  return override?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export function getDefaultTemperature(override?: number): number {
  return override ?? DEFAULT_AI_TEMPERATURE;
}

export function getDefaultMaxTokens(override?: number): number {
  return override ?? DEFAULT_AI_MAX_TOKENS;
}

export function shouldLogPrompts(): boolean {
  return process.env.NODE_ENV === "development";
}
