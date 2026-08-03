import { getOpenAIApiKey, getOpenAIModel } from "@/lib/ai-runtime/env";
import type { BrainLlmProvider } from "./provider";
import type { BrainLlmProviderConfig, BrainLlmRequest } from "./types";
import { BrainLlmError, BrainLlmMissingKeyError } from "./errors";
import { buildLlmUsage } from "./usage";
import { isRetryableHttpStatus } from "./retry";

type OpenAIResponsesPayload = {
  model: string;
  instructions: string;
  input: string;
  temperature: number;
  max_output_tokens: number;
  text?: { format: { type: "json_object" } };
};

type OpenAIResponsesApiResponse = {
  model?: string;
  status?: string;
  output_text?: string;
  incomplete_details?: { reason?: string };
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function extractOutputText(response: OpenAIResponsesApiResponse): string {
  if (response.output_text?.trim()) return response.output_text.trim();
  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const part of item.content ?? []) {
      if ((part.type === "output_text" || part.type === "text") && part.text?.trim()) {
        chunks.push(part.text.trim());
      }
    }
  }
  return chunks.join("\n").trim();
}

export class OpenAIBrainLlmProvider implements BrainLlmProvider {
  readonly id = "openai" as const;

  constructor(private readonly config: BrainLlmProviderConfig = {}) {}

  async complete(request: BrainLlmRequest): Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }> {
    const apiKey = this.config.apiKey ?? getOpenAIApiKey();
    if (!apiKey) throw new BrainLlmMissingKeyError("openai");

    const model = request.model ?? this.config.defaultModel ?? getOpenAIModel();
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const timeoutMs = this.config.timeoutMs ?? 60_000;
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1/responses";

    const payload: OpenAIResponsesPayload = {
      model,
      instructions: request.systemPrompt,
      input: `${request.userPrompt}\n\nRespond with strict JSON matching the required schema. No markdown.`,
      temperature: request.temperature ?? 0.3,
      max_output_tokens: request.maxOutputTokens ?? 4096,
      text: { format: { type: "json_object" } },
    };

    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      const retryable = error instanceof Error && error.name === "AbortError";
      throw new BrainLlmError(
        retryable ? "timeout" : "network_error",
        retryable ? "OpenAI request timed out." : "Network failure contacting OpenAI.",
        { retryable }
      );
    } finally {
      clearTimeout(timer);
    }

    const body = (await response.json().catch(() => ({}))) as OpenAIResponsesApiResponse;

    if (!response.ok) {
      const message = body.error?.message ?? `OpenAI request failed with status ${response.status}.`;
      throw new BrainLlmError("provider_error", message, {
        retryable: isRetryableHttpStatus(response.status),
        statusCode: response.status,
      });
    }

    const rawText = extractOutputText(body);
    const usage = buildLlmUsage({
      provider: "openai",
      model: body.model ?? model,
      inputTokens: body.usage?.input_tokens ?? 0,
      outputTokens: body.usage?.output_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    });

    return { rawText, usage };
  }
}
