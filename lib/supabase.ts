import { createClient } from "@/lib/supabase/client";

/** @deprecated Use `createClient` from `@/lib/supabase/client`. */
export const supabase = createClient();

export { createClient } from "@/lib/supabase/client";
