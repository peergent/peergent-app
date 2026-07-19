import { NextResponse } from "next/server";
import { AIRuntime, defaultAIRuntime, execute, resolveProvider } from "@/lib/ai-runtime";
import { toDeveloperErrorMessage } from "@/lib/ai-runtime/errors";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultContextEngine } from "@/lib/context-engine";
import { buildPrompt } from "@/lib/prompt-builder";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";

type AIExecuteBody = {
  peerId: string;
  message: string;
  options?: AIRuntimeOptions & { provider?: string };
};

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<AIExecuteBody>(request);
  if (body instanceof NextResponse) return body;

  if (!body.peerId?.trim()) {
    return NextResponse.json({ error: "peerId is required." }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  try {
    const contextPackage = await defaultContextEngine.buildContext(
      {
        organizationId: context.organizationId,
        peerId: body.peerId.trim(),
        userId: context.userId,
        taskHint: body.message.trim(),
      },
      { supabase: context.supabase }
    );

    const promptPackage = buildPrompt(contextPackage, {
      taskHint: body.message.trim(),
    });

    const { provider: providerId, ...runtimeOptions } = body.options ?? {};
    const runtime = providerId
      ? new AIRuntime({ provider: resolveProvider(providerId) })
      : defaultAIRuntime;

    const aiResponse = await runtime.execute(promptPackage, runtimeOptions);

    if (!aiResponse.validated.success) {
      return NextResponse.json(
        {
          error: aiResponse.validated.warnings.join(" ") || "Invalid AI response.",
          traceId: contextPackage.traceId,
          response: aiResponse,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: aiResponse.text,
      traceId: contextPackage.traceId,
      warnings: contextPackage.meta.warnings,
      metadata: aiResponse.metadata,
    });
  } catch (error) {
    const message = toDeveloperErrorMessage(error);
    if (message.includes("Anthropic provider is not configured")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return handleDomainError(error);
  }
}
