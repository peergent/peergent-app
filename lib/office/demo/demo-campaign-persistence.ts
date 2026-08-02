import type { DemoCampaignSnapshot } from "./demo-campaign-store";
import { DEMO_PEER_ID } from "./demo-company";

export const DEMO_CAMPAIGN_STORAGE_VERSION = 1;
export const DEMO_CAMPAIGN_STORAGE_KEY = "peergent-demo-campaign-v1";

type PersistedEnvelope = {
  version: number;
  peerId: typeof DEMO_PEER_ID;
  snapshot: DemoCampaignSnapshot;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function loadPersistedDemoCampaignSnapshot(): DemoCampaignSnapshot | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_CAMPAIGN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedEnvelope;
    if (parsed.version !== DEMO_CAMPAIGN_STORAGE_VERSION) return null;
    if (parsed.peerId !== DEMO_PEER_ID) return null;
    if (!parsed.snapshot || typeof parsed.snapshot !== "object") return null;
    return parsed.snapshot;
  } catch {
    return null;
  }
}

export function persistDemoCampaignSnapshot(snapshot: DemoCampaignSnapshot): void {
  if (!isBrowser()) return;
  try {
    const envelope: PersistedEnvelope = {
      version: DEMO_CAMPAIGN_STORAGE_VERSION,
      peerId: DEMO_PEER_ID,
      snapshot,
    };
    window.sessionStorage.setItem(DEMO_CAMPAIGN_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // sessionStorage may be unavailable — demo remains in-memory only
  }
}

export function clearPersistedDemoCampaignSnapshot(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(DEMO_CAMPAIGN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
