import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { slugifyOrganizationName } from "./types";

type AppSupabaseClient = SupabaseClient<Database>;

type ProvisionOrganizationInput = {
  userId: string;
  organizationName: string;
};

export async function provisionOrganizationForUser(
  supabase: AppSupabaseClient,
  input: ProvisionOrganizationInput
) {
  const baseSlug = slugifyOrganizationName(input.organizationName);
  const slug = `${baseSlug}-${input.userId.slice(0, 8)}`;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      name: input.organizationName.trim(),
      slug,
    })
    .select("id, name, slug")
    .single();

  if (organizationError || !organization) {
    throw organizationError ?? new Error("Organization creation failed.");
  }

  const { error: membershipError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      user_id: input.userId,
      role: "owner",
    });

  if (membershipError) {
    throw membershipError;
  }

  return organization;
}

export async function ensureUserOrganization(
  supabase: AppSupabaseClient,
  userId: string,
  fallbackName: string
) {
  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.organization_id) {
    return existingMembership.organization_id;
  }

  const organization = await provisionOrganizationForUser(supabase, {
    userId,
    organizationName: fallbackName,
  });

  return organization.id;
}
