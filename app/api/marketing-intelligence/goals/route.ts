import { NextResponse } from "next/server";
import {
  createMarketingIntelligenceService,
  type CreateMarketingGoalInput,
} from "@/lib/marketing-intelligence";
import {
  MarketingEntityNotFoundError,
  MarketingProfileNotFoundError,
} from "@/lib/marketing-intelligence/services";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
  parseJsonBody,
} from "@/lib/intelligence/api/org-context";

export async function GET() {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const goals = await service.listGoals(context.organizationId);
    return NextResponse.json({ goals });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<CreateMarketingGoalInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Goal title is required." }, { status: 400 });
  }

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const goal = await service.createGoal(context.organizationId, {
      ...body,
      priority: body.priority ?? 0,
      status: body.status ?? "active",
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}
