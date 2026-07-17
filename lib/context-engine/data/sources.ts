import type { SourceRef } from "../types/sources";

export function createSupabaseSource(
  table: string,
  id: string,
  label: string
): SourceRef {
  return {
    id: `${table}:${id}`,
    type: "supabase",
    label,
    fetchedAt: new Date().toISOString(),
    freshness: "live",
  };
}
