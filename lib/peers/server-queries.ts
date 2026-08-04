import type { SupabaseClient } from "@supabase/supabase-js";
import type { PeerRow } from "@/lib/peer-display";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

/** Server-safe peer lookup — verifies organization ownership. */
export async function fetchOrganizationPeerByIdServer(
  supabase: AppSupabaseClient,
  peerId: string,
  organizationId: string
): Promise<PeerRow | null> {
  const { data, error } = await supabase
    .from("peers")
    .select("*")
    .eq("id", peerId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PeerRow | null) ?? null;
}
