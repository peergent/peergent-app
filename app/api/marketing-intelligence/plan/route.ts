import { NextResponse } from "next/server";
import { generateMarketingPlan } from "@/lib/marketing-intelligence/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultContextEngine } from "@/lib/context-engine";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";

type GeneratePlanBody = {
  peerId: string;
  strategy: MarketingStrategy;
  taskHint?: string;
  options?: AIRuntimeOptions;
};

const DEFAULT_TASK_HINT =
  "Transform the provided Marketing Strategy into an actionable Marketing Plan.";

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<GeneratePlanBody>(request);
  if (body instanceof NextResponse) return body;

  if (!body.peerId?.trim()) {
    return NextResponse.json({ error: "peerId is required." }, { status: 400 });
  }

  if (!body.strategy?.summary?.trim()) {
    return NextResponse.json(
      { error: "strategy with summary is required." },
      { status: 400 }
    );
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

    const result = await generateMarketingPlan({
      contextPackage,
      strategy: body.strategy,
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
      plan: result.plan,
      traceId: result.traceId,
      warnings: result.warnings,
    });
  } catch (error) {
    return handleDomainError(error);
  }
}
