import type { CampaignArtifactVersionMap } from "./campaign-review-decision-types";

export function getCampaignArtifactVersion(
  workUnitId: string,
  versions: CampaignArtifactVersionMap | undefined
): number {
  const value = versions?.[workUnitId];
  if (typeof value === "number" && value >= 1) {
    return value;
  }
  return 1;
}

export function bumpCampaignArtifactVersion(
  workUnitId: string,
  versions: CampaignArtifactVersionMap | undefined
): { nextVersion: number; nextMap: Record<string, number> } {
  const current = getCampaignArtifactVersion(workUnitId, versions);
  const nextVersion = current + 1;
  return {
    nextVersion,
    nextMap: {
      ...(versions ?? {}),
      [workUnitId]: nextVersion,
    },
  };
}

export function ensureInitialCampaignArtifactVersion(
  workUnitId: string,
  versions: CampaignArtifactVersionMap | undefined
): Record<string, number> {
  if (versions?.[workUnitId] !== undefined) {
    return { ...versions };
  }
  return {
    ...(versions ?? {}),
    [workUnitId]: 1,
  };
}
