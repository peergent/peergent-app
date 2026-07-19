import { NextResponse } from "next/server";
import {
  createCompanyDnaService,
  type UpdateCompanyDnaInput,
} from "@/lib/company-dna";
import { CompanyDnaNotFoundError } from "@/lib/company-dna/services";
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
    const service = createCompanyDnaService(context.supabase);
    const companyDna = await service.getOrCreate(context.organizationId);
    return NextResponse.json({ companyDna });
  } catch (error) {
    return handleDomainError(error, [CompanyDnaNotFoundError]);
  }
}

export async function PATCH(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const body = await parseJsonBody<UpdateCompanyDnaInput>(request);
  if (body instanceof NextResponse) return body;

  try {
    const service = createCompanyDnaService(context.supabase);
    const companyDna = await service.update(context.organizationId, body);
    return NextResponse.json({ companyDna });
  } catch (error) {
    return handleDomainError(error, [CompanyDnaNotFoundError]);
  }
}
