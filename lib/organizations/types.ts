import type { OrganizationRole } from "@/lib/supabase/database.types";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
};

export type UserAccount = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  organization: OrganizationSummary | null;
};

export function slugifyOrganizationName(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "workspace";
}
