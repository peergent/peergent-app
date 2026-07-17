import type { OrganizationSlice } from "../types/organization";
import { createStubSource, type ContextLoader } from "./base";

export const organizationLoader: ContextLoader<OrganizationSlice> = {
  key: "organization",
  layerKey: "organization",
  loadMode: "eager",
  ttlMs: 5 * 60 * 1000,
  load: ({ scope }) => ({
    key: "organization",
    data: {
      name: scope.organization.organizationName,
      slug: scope.organization.slug,
      primaryWebsite: scope.peer.website || undefined,
    },
    sources: [createStubSource("organization-loader")],
    priority: 20,
    loadMode: "eager",
  }),
};
