import { NextResponse } from "next/server";
import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import {
  getAuthenticatedOrgContext,
  handleDomainError,
  isAuthContext,
} from "@/lib/intelligence/api/org-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await getAuthenticatedOrgContext();
  if (!isAuthContext(context)) return context;

  const taskHint = new URL(request.url).searchParams.get("taskHint") ?? undefined;

  try {
    const { slice: understanding } = await loadMarketingUnderstandingContext(
      context.supabase,
      context.organizationId,
      "Marketing",
      taskHint
    );

    return NextResponse.json({ understanding });
  } catch (error) {
    return handleDomainError(error, []);
  }
}
