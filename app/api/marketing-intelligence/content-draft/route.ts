import { NextResponse } from "next/server";
import { generateMarketingContentDraft } from "@/lib/marketing-intelligence/content";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultContextEngine } from "@/lib/context-engine";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";

type GenerateContentDraftBody = {
  peerId: string;
  plan: MarketingPlan;
  planActivityReference: string;
  taskHint?: string;
  options?: AIRuntimeOptions;
};

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<GenerateContentDraftBody>(request);
  if (body instanceof NextResponse) return body;

  if (!body.peerId?.trim()) {
    return NextResponse.json({ error: "peerId is required." }, { status: 400 });
  }

  if (!body.plan?.summary?.trim()) {
    return NextResponse.json({ error: "plan with summary is required." }, { status: 400 });
  }

  if (!body.planActivityReference?.trim()) {
    return NextResponse.json(
      { error: "planActivityReference is required — select a content-calendar activity." },
      { status: 400 }
    );
  }

  try {
    const contextPackage = await defaultContextEngine.buildContext(
      {
        organizationId: context.organizationId,
        peerId: body.peerId.trim(),
        userId: context.userId,
        taskHint:
          body.taskHint?.trim() ??
          `Create draft content for plan activity "${body.planActivityReference.trim()}".`,
      },
      { supabase: context.supabase }
    );

    const result = await generateMarketingContentDraft({
      contextPackage,
      plan: body.plan,
      planActivityReference: body.planActivityReference.trim(),
      taskHint: body.taskHint?.trim(),
      runtimeOptions: body.options,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          traceId: result.traceId,
          warnings: result.warnings,
        },
        {
          status: result.error.includes("Marketing peer")
            ? 400
            : result.error.includes("not found") || result.error.includes("Unsupported")
              ? 400
              : 422,
        }
      );
    }

    return NextResponse.json({
      draft: result.draft,
      traceId: result.traceId,
      warnings: result.warnings,
    });
  } catch (error) {
    return handleDomainError(error);
  }
}
