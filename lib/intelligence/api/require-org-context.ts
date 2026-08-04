import { getPrimaryOrganizationForUser } from "@/lib/organizations/queries";
import { createClient } from "@/lib/supabase/server";
import type { AuthenticatedOrgContext } from "./org-context";

export class OrgContextError extends Error {
  readonly code: "unauthorized" | "forbidden";

  constructor(code: "unauthorized" | "forbidden", message: string) {
    super(message);
    this.name = "OrgContextError";
    this.code = code;
  }
}

/** Server action / RSC helper — throws instead of returning NextResponse. */
export async function requireAuthenticatedOrgContext(): Promise<AuthenticatedOrgContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new OrgContextError("unauthorized", "Unauthorized.");
  }

  const organization = await getPrimaryOrganizationForUser(supabase, user.id);
  if (!organization) {
    throw new OrgContextError("forbidden", "An active organization is required.");
  }

  return {
    supabase,
    organizationId: organization.id,
    userId: user.id,
  };
}
