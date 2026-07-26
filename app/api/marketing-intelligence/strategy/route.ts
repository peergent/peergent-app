import { NextResponse } from "next/server";
import { generateMarketingStrategy } from "@/lib/marketing-intelligence/strategy";
import { generateMarketingCreativeBrief } from "@/lib/marketing-intelligence/creative-brief-generation";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { AIRuntimeOptions } from "@/lib/ai-runtime";
import { defaultContextEngine } from "@/lib/context-engine";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";
import { buildMarketingDecisionSourceForCampaign } from "@/lib/peer-experience/marketing/runtime/build-marketing-decision-source-for-campaign";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

type GenerateStrategyBody = {
  peerId: string;
  taskHint?: string;
  options?: AIRuntimeOptions;
  artifact?: "strategy" | "creative_brief";
  strategy?: MarketingStrategy;
  campaignProject?: {
    id: string;
    title: string;
    goal: string;
  };
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

    if (body.artifact === "creative_brief") {
      if (!body.strategy?.summary?.trim()) {
        return NextResponse.json(
          { error: "Campaign strategy is required before creative direction." },
          { status: 400 }
        );
      }

      const campaignProject: MarketingProject = body.campaignProject?.id
        ? {
            ...createMarketingCampaignProject({
              peerId: body.peerId.trim(),
              ownerLabel: "Campaign",
              name: body.campaignProject.title,
              goalLabel: body.campaignProject.goal,
              description: body.strategy.summary,
              primaryGoalId: "brand_awareness",
            }),
            id: body.campaignProject.id,
            title: body.campaignProject.title,
            goal: body.campaignProject.goal,
          }
        : createMarketingCampaignProject({
            peerId: body.peerId.trim(),
            ownerLabel: "Campaign",
            name: body.strategy.summary.slice(0, 80) || "Campaign",
            goalLabel: "Creative direction",
            description: body.strategy.summary,
            primaryGoalId: "brand_awareness",
          });

      const decision = assembleMarketingDecision(
        buildMarketingDecisionSourceForCampaign({
          contextPackage,
          project: campaignProject,
          strategy: body.strategy,
          plan: null,
          responsibilities: [],
        })
      );

      const result = await generateMarketingCreativeBrief({
        contextPackage,
        strategy: body.strategy,
        decision,
        project: campaignProject,
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
        brief: result.brief,
        traceId: result.traceId,
        warnings: result.warnings,
      });
    }

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
