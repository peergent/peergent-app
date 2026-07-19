import { NextResponse } from "next/server";
import {
  createMarketingIntelligenceService,
  type CreateMarketingContentInput,
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
    const contentItems = await service.listContent(context.organizationId);
    return NextResponse.json({ contentItems });
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

  const body = await parseJsonBody<CreateMarketingContentInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Content title is required." }, { status: 400 });
  }

  try {
    const service = createMarketingIntelligenceService(context.supabase);
    const contentItem = await service.createContent(context.organizationId, {
      ...body,
      contentType: body.contentType ?? "other",
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ contentItem }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      MarketingProfileNotFoundError,
      MarketingEntityNotFoundError,
    ]);
  }
}
