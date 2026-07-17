import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrganizationRole } from "@/lib/supabase/database.types";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export type ContextOrganizationRow = {
  id: string;
  name: string;
  slug: string;
};

export type ContextPeerRow = {
  id: string;
  name: string;
  role: string;
  website: string;
  objective: string;
  status: string;
  organization_id: string | null;
};

export type ContextMembershipRow = {
  organization_id: string;
  role: OrganizationRole;
};

export async function fetchOrganizationMember(
  supabase: AppSupabaseClient,
  userId: string,
  organizationId: string
): Promise<ContextMembershipRow | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchOrganizationById(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<ContextOrganizationRow | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchPeerForContext(
  supabase: AppSupabaseClient,
  peerId: string,
  organizationId: string
): Promise<ContextPeerRow | null> {
  const { data, error } = await supabase
    .from("peers")
    .select("id, name, role, website, objective, status, organization_id")
    .eq("id", peerId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
