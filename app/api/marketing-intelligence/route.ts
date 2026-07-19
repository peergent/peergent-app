import { NextResponse } from "next/server";
import {
  createMarketingIntelligenceService,
  type UpdateMarketingProfileInput,
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
    const profile = await service.getAggregate(context.organizationId);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}

export async function PATCH(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<UpdateMarketingProfileInput>(request);
  if (body instanceof NextResponse) return body;

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const profile = await service.updateProfile(context.organizationId, body);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}
