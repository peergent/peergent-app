import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type CreateCompetitorInput,
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
    const competitors = await service.listCompetitors(context.organizationId);
    return NextResponse.json({ competitors });
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

  const body = await parseJsonBody<CreateCompetitorInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Competitor name is required." }, { status: 400 });
  }

  try {
    const service = createBusinessBrainService(context.supabase);
    const competitor = await service.createCompetitor(context.organizationId, {
      ...body,
      strengths: body.strengths ?? [],
      weaknesses: body.weaknesses ?? [],
      differentiators: body.differentiators ?? [],
      metadata: body.metadata ?? {},
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ competitor }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
