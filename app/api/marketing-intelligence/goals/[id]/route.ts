import { NextResponse } from "next/server";
import {
  createMarketingIntelligenceService,
  type UpdateMarketingGoalInput,
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

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const { id } = await params;
  const body = await parseJsonBody<UpdateMarketingGoalInput>(request);
  if (body instanceof NextResponse) return body;

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const goal = await service.updateGoal(context.organizationId, id, body);
    return NextResponse.json({ goal });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const { id } = await params;

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    await service.deleteGoal(context.organizationId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}
