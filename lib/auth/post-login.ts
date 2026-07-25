import { getSafeNextPath } from "@/lib/auth/next-path";
import { ensureUserOrganization } from "@/lib/organizations/provision";
import { getPrimaryOrganizationForUser } from "@/lib/organizations/queries";
import { createClient } from "@/lib/supabase/server";

function organizationFallbackName(
  fullName: string | undefined,
  email: string | undefined
) {
  const fromMetadata = fullName?.trim();
  if (fromMetadata) {
    return `${fromMetadata.split(" ")[0]}'s workspace`;
  }

  const localPart = email?.split("@")[0]?.trim();
  if (localPart) {
    return `${localPart}'s workspace`;
  }

  return "My workspace";
}

export async function resolvePostLoginPath(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  let organization = await getPrimaryOrganizationForUser(supabase, user.id);

  if (!organization) {
    const fallbackName = organizationFallbackName(
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : undefined,
      user.email
    );

    try {
      await ensureUserOrganization(supabase, user.id, fallbackName);
      organization = await getPrimaryOrganizationForUser(supabase, user.id);
    } catch (error) {
      console.error("Organization recovery failed:", error);
      return "/hq";
    }
  }

  if (!organization) {
    return "/hq";
  }

  const { count, error } = await supabase
    .from("peers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  if (error) {
    console.error("Post-login peer count failed:", error);
    return "/hq";
  }

  if ((count ?? 0) === 0) {
    return "/website-intelligence";
  }

  return "/hq";
}

export async function resolveAuthenticatedDestination(
  rawNext?: string | null
): Promise<string> {
  const safeNext = getSafeNextPath(rawNext);
  if (safeNext) {
    return safeNext;
  }

  return resolvePostLoginPath();
}
