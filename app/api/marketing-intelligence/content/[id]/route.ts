import { NextResponse } from "next/server";
import {
  createMarketingIntelligenceService,
  type UpdateMarketingContentInput,
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
  const body = await parseJsonBody<UpdateMarketingContentInput>(request);
  if (body instanceof NextResponse) return body;

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const contentItem = await service.updateContent(context.organizationId, id, body);
    return NextResponse.json({ contentItem });
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
    await service.deleteContent(context.organizationId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}
