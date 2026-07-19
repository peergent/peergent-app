import type { PromptPackage } from "@/lib/prompt-builder";
import type { AIResponse, AIRuntimeOptions } from "@/lib/ai-runtime";

export async function requestAIResponse(
  promptPackage: PromptPackage,
  options?: AIRuntimeOptions
): Promise<AIResponse> {
  const response = await fetch("/api/dev/generate-ai-response", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ promptPackage, options }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    response?: AIResponse;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Failed to generate AI response.");
  }

  if (!payload.response) {
    throw new Error("AI response payload was missing from the server.");
  }

  return payload.response;
}
