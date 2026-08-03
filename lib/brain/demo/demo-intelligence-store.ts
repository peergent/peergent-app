import type { WebsiteSnapshot } from "../website/types";
import { buildSimulatedWebsiteSnapshot } from "../website/simulated-snapshot";
import { PEERGENT_DEMO_ORG_ID } from "./peergent-company-profile";

/** In-memory org-scoped website snapshots for demo — no persistence. */
const demoWebsiteSnapshots = new Map<string, WebsiteSnapshot>();

export function getDemoWebsiteSnapshot(organizationId: string): WebsiteSnapshot | undefined {
  return demoWebsiteSnapshots.get(organizationId);
}

export function setDemoWebsiteSnapshot(snapshot: WebsiteSnapshot): void {
  demoWebsiteSnapshots.set(snapshot.organizationId, snapshot);
}

export function buildAndStoreDemoWebsiteSnapshot(input: {
  organizationId?: string;
  url: string;
  companyName?: string;
}): WebsiteSnapshot {
  const orgId = input.organizationId ?? PEERGENT_DEMO_ORG_ID;
  const snapshot = buildSimulatedWebsiteSnapshot({
    organizationId: orgId,
    url: input.url,
    companyName: input.companyName,
  });
  setDemoWebsiteSnapshot(snapshot);
  return snapshot;
}

export function clearDemoWebsiteSnapshots(): void {
  demoWebsiteSnapshots.clear();
}

export function seedPeergentDemoWebsiteSnapshot(): WebsiteSnapshot {
  const snapshot = buildSimulatedWebsiteSnapshot({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
    companyName: "Peergent",
  });
  setDemoWebsiteSnapshot(snapshot);
  return snapshot;
}
