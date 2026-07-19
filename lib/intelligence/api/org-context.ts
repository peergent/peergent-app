import { NextResponse } from "next/server";
import { getPrimaryOrganizationForUser } from "@/lib/organizations/queries";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type AppSupabaseClient = SupabaseClient<Database>;

export type AuthenticatedOrgContext = {
  supabase: AppSupabaseClient;
  organizationId: string;
  userId: string;
};

export async function getAuthenticatedOrgContext(): Promise<
  AuthenticatedOrgContext | NextResponse
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const organization = await getPrimaryOrganizationForUser(supabase, user.id);
  if (!organization) {
    return NextResponse.json(
      { error: "An active organization is required." },
      { status: 403 }
    );
  }

  return {
    supabase,
    organizationId: organization.id,
    userId: user.id,
  };
}

export function isAuthContext(
  value: AuthenticatedOrgContext | NextResponse
): value is AuthenticatedOrgContext {
  return "organizationId" in value;
}

export async function parseJsonBody<T>(request: Request): Promise<T | NextResponse> {
  try {
    return (await request.json()) as T;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

export function handleDomainError(
  error: unknown,
  notFoundErrors: Array<new (...args: never[]) => Error> = []
): NextResponse {
  if (error instanceof Error && notFoundErrors.some((Type) => error instanceof Type)) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message }, { status: 500 });
}
