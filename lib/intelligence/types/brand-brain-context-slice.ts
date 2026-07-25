import type { AssembledBrandProfile } from "@/lib/brand-brain/assemble-brand-profile";
import { BRAND_BRAIN_GAPS } from "@/lib/brand-brain/ownership";
import type {
  BrandBrainContextSlice,
  BrandProfileSnapshot,
} from "@/lib/brand-brain/types";

export type { BrandBrainContextSlice };

export function emptyBrandBrainContextSlice(
  assembledAt: string
): BrandBrainContextSlice {
  return {
    available: false,
    completeness: 0,
    gaps: [...BRAND_BRAIN_GAPS],
    snapshot: {},
    assembledAt,
  };
}

function assembledProfileToSnapshot(
  assembled: AssembledBrandProfile
): BrandProfileSnapshot {
  return {
    profile: assembled.profile,
    identity: assembled.identity,
    visualIdentity: assembled.visualIdentity,
    voice: assembled.voice,
    creativeRules: assembled.creativeRules,
    assetReferences: assembled.assetReferences,
  };
}

export function assembledBrandProfileToContextSlice(
  assembled: AssembledBrandProfile,
  assembledAt: string
): BrandBrainContextSlice {
  const totalDimensions = BRAND_BRAIN_GAPS.length;
  const gapCount = assembled.gaps.length;
  const completeness = Math.round(
    ((totalDimensions - gapCount) / totalDimensions) * 100
  );
  const hasModuleContent = completeness > 0 || assembled.profile.status === "active";

  return {
    available: hasModuleContent,
    completeness,
    gaps: [...assembled.gaps],
    snapshot: assembledProfileToSnapshot(assembled),
    assembledAt,
  };
}
