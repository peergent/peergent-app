import {
  INTEGRATION_LABELS,
  INTEGRATION_PROVIDERS,
  type IntegrationConnection,
  type IntegrationConnectionStatus,
  type IntegrationProviderId,
} from "./types";

const STORAGE_PREFIX = "peergent-integrations:";

type StoredConnections = Partial<Record<IntegrationProviderId, IntegrationConnectionStatus>>;

function settingsHref(provider: IntegrationProviderId): string {
  return `/integrations?provider=${provider}`;
}

export function loadIntegrationConnections(orgId: string): IntegrationConnection[] {
  let stored: StoredConnections = {};
  if (typeof window !== "undefined" && orgId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${orgId}`);
      if (raw) stored = JSON.parse(raw) as StoredConnections;
    } catch {
      stored = {};
    }
  }

  return INTEGRATION_PROVIDERS.map((id) => ({
    id,
    label: INTEGRATION_LABELS[id],
    status: stored[id] ?? "not_connected",
    settingsHref: settingsHref(id),
    lastSyncedAt: null,
  }));
}

export function saveIntegrationConnection(
  orgId: string,
  provider: IntegrationProviderId,
  status: IntegrationConnectionStatus
): IntegrationConnection[] {
  if (typeof window === "undefined" || !orgId) {
    return loadIntegrationConnections(orgId);
  }

  const current = loadIntegrationConnections(orgId);
  const next: StoredConnections = {};
  for (const connection of current) {
    next[connection.id] = connection.id === provider ? status : connection.status;
  }
  if (!next[provider]) next[provider] = status;

  localStorage.setItem(`${STORAGE_PREFIX}${orgId}`, JSON.stringify(next));
  return loadIntegrationConnections(orgId);
}

export function hasAnalyticsConnection(connections: IntegrationConnection[]): boolean {
  return connections.some(
    (c) =>
      c.status === "connected" &&
      (c.id === "ga4" || c.id === "meta" || c.id === "linkedin" || c.id === "instagram")
  );
}
