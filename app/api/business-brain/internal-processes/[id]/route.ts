import { NextResponse } from "next/server";
import {
  createBusinessBrainService,
  type UpdateInternalProcessInput,
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

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const { id } = await params;
  const body = await parseJsonBody<UpdateInternalProcessInput>(request);
  if (body instanceof NextResponse) return body;

  try {
    const service = createBusinessBrainService(context.supabase);
    const internalProcess = await service.updateInternalProcess(
      context.organizationId,
      id,
      body
    );
    return NextResponse.json({ internalProcess });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const { id } = await params;

  try {
    const service = createBusinessBrainService(context.supabase);
    await service.deleteInternalProcess(context.organizationId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleDomainError(error, [
      BusinessBrainNotFoundError,
      BusinessBrainEntityNotFoundError,
    ]);
  }
}
