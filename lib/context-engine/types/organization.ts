import type { OrganizationRole } from "@/lib/supabase/database.types";

export type OrganizationScope = {
  organizationId: string;
  organizationName: string;
  slug: string;
};

export type ActorScope = {
  userId: string;
  membershipRole: OrganizationRole;
};

export type OrganizationSlice = {
  name: string;
  slug: string;
  primaryWebsite?: string;
};
