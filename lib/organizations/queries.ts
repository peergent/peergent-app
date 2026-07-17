import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { OrganizationSummary, UserAccount } from "./types";

type AppSupabaseClient = SupabaseClient<Database>;

export async function getPrimaryOrganizationForUser(
  supabase: AppSupabaseClient,
  userId: string
): Promise<OrganizationSummary | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    console.error("Organization membership lookup failed:", membershipError);
    return null;
  }

  if (!membership) {
    return null;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", membership.organization_id)
    .maybeSingle();

  if (organizationError || !organization) {
    console.error("Organization lookup failed:", organizationError);
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    role: membership.role,
  };
}

export async function getUserAccount(
  supabase: AppSupabaseClient,
  userId: string,
  email: string
): Promise<UserAccount> {
  const [{ data: profile }, organization] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url").eq("id", userId).maybeSingle(),
    getPrimaryOrganizationForUser(supabase, userId),
  ]);

  return {
    userId,
    email,
    fullName: profile?.full_name?.trim() || email.split("@")[0] || "User",
    avatarUrl: profile?.avatar_url ?? null,
    organization,
  };
}

export async function getOrganizationPeerCount(
  supabase: AppSupabaseClient,
  organizationId: string
) {
  const { count, error } = await supabase
    .from("peers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Peer count failed:", error);
    return 0;
  }

  return count ?? 0;
}
