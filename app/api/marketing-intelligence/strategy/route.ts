import { NextResponse } from "next/server";
import { generateMarketingStrategy } from "@/lib/marketing-intelligence/strategy";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultContextEngine } from "@/lib/context-engine";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";

type GenerateStrategyBody = {
  peerId: string;
  taskHint?: string;
  options?: AIRuntimeOptions;
};

const DEFAULT_TASK_HINT =
  "Develop a comprehensive marketing strategy based on the verified Marketing Understanding.";

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<GenerateStrategyBody>(request);
  if (body instanceof NextResponse) return body;

  if (!body.peerId?.trim()) {
    return NextResponse.json({ error: "peerId is required." }, { status: 400 });
  }

  try {
    const taskHint = body.taskHint?.trim() || DEFAULT_TASK_HINT;

    const contextPackage = await defaultContextEngine.buildContext(
      {
        organizationId: context.organizationId,
        peerId: body.peerId.trim(),
        userId: context.userId,
        taskHint,
      },
      { supabase: context.supabase }
    );

    const result = await generateMarketingStrategy({
      contextPackage,
      taskHint,
      runtimeOptions: body.options,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          traceId: result.traceId,
          warnings: result.warnings,
        },
        { status: result.error.includes("Marketing peer") ? 400 : 422 }
      );
    }

    return NextResponse.json({
      strategy: result.strategy,
      traceId: result.traceId,
      warnings: result.warnings,
    });
  } catch (error) {
    return handleDomainError(error);
  }
}
