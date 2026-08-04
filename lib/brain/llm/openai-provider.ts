import { getOpenAIApiKey, getOpenAIModel } from "@/lib/ai-runtime/env";
import type { BrainLlmProvider } from "./provider";
import type { BrainLlmProviderConfig, BrainLlmRequest } from "./types";
import { BrainLlmError, BrainLlmMissingKeyError, BrainLlmTimeoutError } from "./errors";
import { buildLlmUsage } from "./usage";
import { isRetryableHttpStatus } from "./retry";

type OpenAIResponsesPayload = {
  model: string;
  instructions: string;
  input: string;
  temperature: number;
  max_output_tokens: number;
  text?: {
    format:
      | { type: "json_object" }
      | {
          type: "json_schema";
          name: string;
          strict: boolean;
          schema: Record<string, unknown>;
        };
  };
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

  async complete(
    request: BrainLlmRequest,
    options?: { attemptNumber?: number }
  ): Promise<{ rawText: string; usage: ReturnType<typeof buildLlmUsage> }> {
    const apiKey = this.config.apiKey ?? getOpenAIApiKey();
    if (!apiKey) throw new BrainLlmMissingKeyError("openai");

    const model = request.model ?? this.config.defaultModel ?? getOpenAIModel();
    const fetchImpl = this.config.fetchImpl ?? fetch;
    const timeoutMs = request.timeoutMs ?? this.config.timeoutMs ?? 60_000;
    const attemptNumber = options?.attemptNumber ?? 1;
    const baseUrl = this.config.baseUrl ?? "https://api.openai.com/v1/responses";

    const usesStrictSchema = Boolean(request.jsonSchema && Object.keys(request.jsonSchema).length > 0);

    const payload: OpenAIResponsesPayload = {
      model,
      instructions: request.systemPrompt,
      input: usesStrictSchema
        ? request.userPrompt
        : `${request.userPrompt}\n\nRespond with strict JSON matching the required schema. No markdown.`,
      temperature: request.temperature ?? 0.3,
      max_output_tokens: request.maxOutputTokens ?? 4096,
      text: usesStrictSchema
        ? {
            format: {
              type: "json_schema",
              name: `${request.capabilityId}_output`,
              strict: true,
              schema: request.jsonSchema,
            },
          }
        : { format: { type: "json_object" } },
    };

    const requestStartedAt = new Date().toISOString();
    const startedAt = Date.now();
    const controller = new AbortController();
    let responseHeadersReceived = false;
    let responseBodyStarted = false;
    let httpStatus: number | undefined;

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
      responseHeadersReceived = true;
      httpStatus = response.status;
    } catch (error) {
      clearTimeout(timer);
      const aborted = error instanceof Error && error.name === "AbortError";
      if (aborted) {
        throw new BrainLlmTimeoutError("OpenAI request timed out.", {
          timeoutOwner: "openai_provider_abort_controller",
          configuredTimeoutMs: timeoutMs,
          attemptNumber,
          requestStartedAt,
          requestAbortedAt: new Date().toISOString(),
          responseHeadersReceived,
          responseBodyStarted,
          httpStatus,
        });
      }
      throw new BrainLlmError("network_error", "Network failure contacting OpenAI.", { retryable: true });
    } finally {
      clearTimeout(timer);
    }

    responseBodyStarted = true;
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
