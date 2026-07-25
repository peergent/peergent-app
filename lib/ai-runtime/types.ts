export type LLMUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type LLMGenerateRequest = {
  systemPrompt: string;
  taskPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
};

export type LLMGenerateResult = {
  text: string;
  usage: LLMUsage;
  model: string;
  finishReason: string;
  latencyMs: number;
};

export type ValidatedResponseMetadata = {
  model?: string;
  finishReason?: string;
  latencyMs?: number;
  usage?: LLMUsage;
  originalLength?: number;
  trimmedLength?: number;
};

export type ValidatedResponse = {
  success: boolean;
  text: string;
  warnings: string[];
  metadata: ValidatedResponseMetadata;
};

export type AIResponseMetadata = {
  provider: string;
  model: string;
  finishReason: string;
  latencyMs: number;
  usage: LLMUsage;
  generatedAt: string;
  promptTraceId?: string;
  peerRole?: string;
};

export type AIResponse = {
  text: string;
  providerResult: LLMGenerateResult;
  validated: ValidatedResponse;
  metadata: AIResponseMetadata;
};

export type AIRuntimeOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Overrides default response normalization (e.g. higher limit for structured JSON outputs). */
  responseValidation?: ResponseValidationOptions;
};

export type ResponseValidationOptions = {
  maxLength?: number;
};

export const DEFAULT_AI_TEMPERATURE = 0.4;
export const DEFAULT_AI_MAX_TOKENS = 1200;
export const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
