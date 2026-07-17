import { fetchOrganizationById } from "../data/queries";
import { createSupabaseSource } from "../data/sources";
import type { OrganizationSlice } from "../types/organization";
import { createStubSource, type ContextLoader, type LoaderContext } from "./base";

function organizationFromScope(scope: LoaderContext["scope"]): OrganizationSlice {
  return {
    name: scope.organization.organizationName,
    slug: scope.organization.slug,
    primaryWebsite: scope.peer.website || undefined,
  };
}

export const organizationLoader: ContextLoader<OrganizationSlice> = {
  key: "organization",
  layerKey: "organization",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: async ({ scope, supabase }) => {
    if (!supabase) {
      return {
        key: "organization",
        data: organizationFromScope(scope),
        sources: [createStubSource("organization-loader")],
        priority: 20,
        loadMode: "eager",
      };
    }

    const organization = await fetchOrganizationById(
      supabase,
      scope.organization.organizationId
    );

    if (!organization) {
      return {
        key: "organization",
        data: organizationFromScope(scope),
        sources: [createStubSource("organization-loader-fallback")],
        priority: 20,
        loadMode: "eager",
      };
    }

    return {
      key: "organization",
      data: {
        name: organization.name,
        slug: organization.slug,
        primaryWebsite: scope.peer.website || undefined,
      },
      sources: [
        createSupabaseSource(
          "organizations",
          organization.id,
          organization.name
        ),
      ],
      priority: 20,
      loadMode: "eager",
    };
  },
};
