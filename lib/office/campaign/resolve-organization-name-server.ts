import "server-only";

import { fetchOrganizationById } from "@/lib/context-engine/data/queries";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";

/**
 * Loads durable organization identity (organizations.name) for campaign context.
 * Callers pass the result into buildCampaignContext — not read inside boundary logic.
 */
export async function resolveDurableOrganizationNameServer(
  supabase: AppSupabaseClient | undefined,
  organizationId: string
): Promise<string | null> {
  if (!supabase || !organizationId.trim()) return null;
  try {
    const org = await fetchOrganizationById(supabase, organizationId);
    return org?.name?.trim() ?? null;
  } catch {
    return null;
  }
}
