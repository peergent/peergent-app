const inFlightAutomaticByProject = new Map<string, Promise<unknown>>();

export function automaticBootstrapKey(organizationId: string, projectId: string): string {
  return `${organizationId}:${projectId}:automatic_bootstrap`;
}

export function getAutomaticBootstrapInFlight(
  key: string
): Promise<unknown> | undefined {
  return inFlightAutomaticByProject.get(key);
}

export function setAutomaticBootstrapInFlight(
  key: string,
  promise: Promise<unknown>
): void {
  inFlightAutomaticByProject.set(key, promise);
}

export function clearAutomaticBootstrapInFlight(key: string): void {
  inFlightAutomaticByProject.delete(key);
}

/** Test-only — reset in-flight automatic bootstrap dedupe. */
export function resetAutomaticCampaignBootstrapInFlightForTests(): void {
  inFlightAutomaticByProject.clear();
}
