import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type CreateKnowledgeSourceInput,
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
    const knowledgeSources = await service.listKnowledgeSources(context.organizationId);
    return NextResponse.json({ knowledgeSources });
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

  const body = await parseJsonBody<CreateKnowledgeSourceInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.title?.trim() || !body.sourceType) {
    return NextResponse.json(
      { error: "Knowledge source title and sourceType are required." },
      { status: 400 }
    );
  }

  try {
    const service = createBusinessBrainService(context.supabase);
    const knowledgeSource = await service.createKnowledgeSource(context.organizationId, {
      ...body,
      metadata: body.metadata ?? {},
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ knowledgeSource }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
