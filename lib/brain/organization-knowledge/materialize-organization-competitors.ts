import { createBusinessBrainService } from "@/lib/business-brain";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { MaterializedOrganizationCompetitor } from "./types";

export type OrganizationCompetitorLoadResult = {
  rowCount: number;
  namedCount: number;
  competitors: readonly MaterializedOrganizationCompetitor[];
};

/** Normalize durable Business Brain competitors — trim, dedupe, drop empty names. */
export function normalizeOrganizationCompetitors(
  rows: readonly { name: string; website?: string | null }[]
): MaterializedOrganizationCompetitor[] {
  const unique = new Map<string, MaterializedOrganizationCompetitor>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (unique.has(key)) continue;
    const url = row.website?.trim();
    unique.set(key, {
      name,
      ...(url ? { url } : {}),
      source: "business_brain",
    });
  }
  return [...unique.values()];
}

/** Load organization-scoped competitors directly from Business Brain. */
export async function loadOrganizationCompetitors(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<OrganizationCompetitorLoadResult> {
  const aggregate = await createBusinessBrainService(supabase).getAggregate(organizationId);
  const rowCount = aggregate.competitors.length;
  const competitors = normalizeOrganizationCompetitors(aggregate.competitors);
  return {
    rowCount,
    namedCount: competitors.length,
    competitors,
  };
}
