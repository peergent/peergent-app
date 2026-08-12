/**
 * Scope key helpers for brain layer persistence.
 */

export function orgScopeKey(organizationId: string): string {
  return `${organizationId}:org`;
}

export function projectScopeKey(input: {
  organizationId: string;
  projectId?: string;
  campaignId?: string;
}): string {
  return `${input.organizationId}:${input.projectId ?? "org"}:${input.campaignId ?? "none"}`;
}

export function recordKey(parts: readonly string[]): string {
  return parts.join(":");
}

export function outputRefKey(organizationId: string, outputRef: string): string {
  return `${organizationId}:${outputRef}`;
}

export function idempotencyKey(organizationId: string, key: string): string {
  return `${organizationId}:${key}`;
}
