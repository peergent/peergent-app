/**
 * PX-63D — consistent snapshot index lookup when campaignId/projectId differ.
 */

export function snapshotIndexCandidates(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
}): string[] {
  const candidates = new Set<string>();
  const projectId = input.projectId;
  const campaignId = input.campaignId;

  candidates.add(`${input.organizationId}:${projectId ?? "org"}:${campaignId ?? "none"}`);

  if (projectId) {
    candidates.add(`${input.organizationId}:${projectId}:none`);
    candidates.add(`${input.organizationId}:${projectId}:${projectId}`);
  }

  if (campaignId && campaignId !== projectId) {
    candidates.add(`${input.organizationId}:${projectId ?? "org"}:${campaignId}`);
  }

  return [...candidates];
}

export function readLatestSnapshot<T>(
  snapshots: Map<string, T>,
  input: {
    organizationId: string;
    projectId?: string;
    campaignId?: string;
  }
): T | null {
  for (const indexKey of snapshotIndexCandidates(input)) {
    const found = snapshots.get(`latest:${indexKey}`);
    if (found) return found;
  }
  return null;
}
