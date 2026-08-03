import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";

/** Brain tables are not yet in generated database.types — untyped access until regen. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function brainFrom(supabase: AppSupabaseClient, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}
