/**
 * Brand Memory extension point — Sprint 10.0 stub.
 * Future: persist validated brand knowledge across campaigns.
 */

import type { BrandGraph } from "./types";

export type BrandMemoryInput = {
  readonly graph: BrandGraph;
  readonly organizationId: string;
};

export type BrandMemoryResult = {
  readonly implemented: false;
  readonly message: string;
};

export function persistValidatedBrandKnowledge(
  _input: BrandMemoryInput
): BrandMemoryResult {
  return {
    implemented: false,
    message: "Brand Memory layer is not implemented yet — Sprint 10.0 extension point.",
  };
}

export function loadBrandMemory(_input: {
  organizationId: string;
  campaignId?: string;
}): null {
  return null;
}
