import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type CreateInternalProcessInput,
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
    const internalProcesses = await service.listInternalProcesses(context.organizationId);
    return NextResponse.json({ internalProcesses });
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

  const body = await parseJsonBody<CreateInternalProcessInput>(request);
  if (body instanceof NextResponse) return body;

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Internal process name is required." }, { status: 400 });
  }

  try {
    const service = createBusinessBrainService(context.supabase);
    const internalProcess = await service.createInternalProcess(context.organizationId, {
      ...body,
      steps: body.steps ?? [],
      metadata: body.metadata ?? {},
      sortOrder: body.sortOrder ?? 0,
    });
    return NextResponse.json({ internalProcess }, { status: 201 });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
