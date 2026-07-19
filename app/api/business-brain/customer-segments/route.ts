import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type CreateCustomerSegmentInput,
} from "@/lib/business-brain";
import {
  BusinessBrainEntityNotFoundError,
  BusinessBrainNotFoundError,
} from "@/lib/business-brain/services";
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
    const service = createBusinessBrainService(context.supabase);
    const customerSegments = await service.listCustomerSegments(context.organizationId);
    return NextResponse.json({ customerSegments });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}

export async function POST(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<CreateCustomerSegmentInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Customer segment name is required." }, { status: 400 });
  }

  try {
    const service = createBusinessBrainService(context.supabase);
    const customerSegment = await service.createCustomerSegment(context.organizationId, {
      ...body,
      segments: body.segments ?? [],
      painPoints: body.painPoints ?? [],
      buyingTriggers: body.buyingTriggers ?? [],
      metadata: body.metadata ?? {},
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ customerSegment }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
