import type { LLMGenerateRequest, LLMGenerateResult, LLMUsage } from "./types";
import type { LLMProvider } from "./provider";
import { LLMProviderError, MissingApiKeyError } from "./errors";
import {
  getDefaultMaxTokens,
  getDefaultTemperature,
  getOpenAIApiKey,
  getOpenAIModel,
} from "./env";

type OpenAIResponsesPayload = {
  model: string;
  instructions: string;
  input: string;
  temperature: number;
  max_output_tokens: number;
};

type OpenAIResponsesApiResponse = {
  id?: string;
  model?: string;
  status?: string;
  output_text?: string;
  incomplete_details?: { reason?: string };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
    type?: string;
  };
};

function extractOutputText(response: OpenAIResponsesApiResponse): string {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  const chunks: string[] = [];

  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;

    for (const part of item.content ?? []) {
      if (
        (part.type === "output_text" || part.type === "text") &&
        part.text?.trim()
      ) {
        chunks.push(part.text.trim());
      }
    }
  }

  return chunks.join("\n\n").trim();
}

function mapUsage(usage?: OpenAIResponsesApiResponse["usage"]): LLMUsage {
  return {
    inputTokens: usage?.input_tokens,
    outputTokens: usage?.output_tokens,
    totalTokens: usage?.total_tokens,
  };
}

function mapFinishReason(response: OpenAIResponsesApiResponse): string {
  if (response.status) {
    return response.status;
  }

  return response.incomplete_details?.reason ?? "completed";
}

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey = getOpenAIApiKey(),
    private readonly baseUrl = "https://api.openai.com/v1/responses"
  ) {}

  async generateResponse(request: LLMGenerateRequest): Promise<LLMGenerateResult> {
    if (!this.apiKey) {
      throw new MissingApiKeyError(this.name);
    }

    const startedAt = Date.now();
    const payload: OpenAIResponsesPayload = {
      model: getOpenAIModel(request.model),
      instructions: request.systemPrompt,
      input: request.taskPrompt,
      temperature: getDefaultTemperature(request.temperature),
      max_output_tokens: getDefaultMaxTokens(request.maxTokens),
    };

    let response: Response;

    try {
      response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new LLMProviderError(
        this.name,
        "Network failure while contacting OpenAI."
      );
    }

    const body = (await response.json().catch(() => ({}))) as OpenAIResponsesApiResponse;

    if (!response.ok) {
      const message =
        body.error?.message ||
        `OpenAI request failed with status ${response.status}.`;

      throw new LLMProviderError(this.name, message, response.status);
    }

    const text = extractOutputText(body);

    return {
      text,
      usage: mapUsage(body.usage),
      model: body.model ?? payload.model,
      finishReason: mapFinishReason(body),
      latencyMs: Date.now() - startedAt,
    };
  }
}

export const defaultOpenAIProvider = new OpenAIProvider();
