import {
  createBrandBrainService,
  createExistingPeergentBrandRepository,
} from "@/lib/brand-brain";
import {
  BrandBrainInvalidOrganizationIdError,
  BrandBrainOrganizationNotFoundError,
  BrandBrainSourceLoadError,
  BrandProfileOrganizationMismatchError,
} from "@/lib/brand-brain/errors";
import { createSupabaseSource } from "@/lib/context-engine/data/sources";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { AppSupabaseClient } from "../api/org-context";
import {
  assembledBrandProfileToContextSlice,
  emptyBrandBrainContextSlice,
  type BrandBrainContextSlice,
} from "../types/brand-brain-context-slice";

export type BrandBrainLoadResult = {
  slice: BrandBrainContextSlice;
  sources: SourceRef[];
  /** Set when the slice is degraded (organization inaccessible or source failure). */
  degraded?: boolean;
};

function unavailableResult(
  organizationId: string,
  assembledAt: string,
  label: string
): BrandBrainLoadResult {
  return {
    slice: emptyBrandBrainContextSlice(assembledAt),
    sources: [
      {
        id: `brand-brain:unavailable:${organizationId}`,
        type: "derived",
        label,
        fetchedAt: assembledAt,
        freshness: "cached",
      },
    ],
    degraded: true,
  };
}

/**
 * Loads canonical Brand Brain read state for Context Engine (read-only, no writes).
 */
export async function loadBrandBrainContext(
  supabase: AppSupabaseClient | undefined,
  organizationId: string,
  assembledAt: string
): Promise<BrandBrainLoadResult> {
  if (!supabase) {
    return unavailableResult(
      organizationId,
      assembledAt,
      "Brand Brain unavailable"
    );
  }

  try {
    const repository = createExistingPeergentBrandRepository(supabase);
    const service = createBrandBrainService(repository);
    const assembled = await service.getBrandProfile(organizationId, {
      assembledAt,
    });
    const slice = assembledBrandProfileToContextSlice(assembled, assembledAt);

    return {
      slice,
      sources: [
        createSupabaseSource(
          "brand_brain_read_model",
          organizationId,
          slice.available ? "Brand Brain" : "Brand Brain (incomplete)"
        ),
      ],
    };
  } catch (error) {
    if (
      error instanceof BrandBrainOrganizationNotFoundError ||
      error instanceof BrandBrainInvalidOrganizationIdError
    ) {
      return unavailableResult(
        organizationId,
        assembledAt,
        "Brand Brain unavailable — organization not accessible"
      );
    }

    if (
      error instanceof BrandBrainSourceLoadError ||
      error instanceof BrandProfileOrganizationMismatchError
    ) {
      return unavailableResult(
        organizationId,
        assembledAt,
        "Brand Brain unavailable — source load failed"
      );
    }

    return unavailableResult(
      organizationId,
      assembledAt,
      "Brand Brain unavailable"
    );
  }
}
