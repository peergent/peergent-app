import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type CreateFactInput,
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
    const facts = await service.listFacts(context.organizationId);
    return NextResponse.json({ facts });
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

  const body = await parseJsonBody<CreateFactInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.subject?.trim() || !body.predicate?.trim() || !body.value?.trim()) {
    return NextResponse.json(
      { error: "Fact subject, predicate, and value are required." },
      { status: 400 }
    );
  }

  try {
    const service = createBusinessBrainService(context.supabase);
    const fact = await service.createFact(context.organizationId, {
      ...body,
      confidence: body.confidence ?? "moderate",
      verified: body.verified ?? false,
      importance: body.importance ?? "medium",
      metadata: body.metadata ?? {},
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ fact }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
