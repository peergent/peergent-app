import type { WebsiteSnapshot } from "../website/types";
import { buildDemoWebsiteSnapshotSync } from "../website/providers/demo-website-provider";
import { PEERGENT_DEMO_ORG_ID } from "./peergent-company-profile";

/** In-memory org-scoped website snapshots for demo — no persistence. */
const demoWebsiteSnapshots = new Map<string, WebsiteSnapshot>();

export function getDemoWebsiteSnapshot(organizationId: string): WebsiteSnapshot | undefined {
  return demoWebsiteSnapshots.get(organizationId);
}

export function setDemoWebsiteSnapshot(snapshot: WebsiteSnapshot): void {
  demoWebsiteSnapshots.set(snapshot.organizationId, snapshot);
}

export function buildAndStoreDemoWebsiteSnapshotSync(input: {
  organizationId?: string;
  url: string;
  companyName?: string;
}): WebsiteSnapshot {
  const orgId = input.organizationId ?? PEERGENT_DEMO_ORG_ID;
  const snapshot = buildDemoWebsiteSnapshotSync({
    organizationId: orgId,
    url: input.url,
    companyName: input.companyName,
  });
  setDemoWebsiteSnapshot(snapshot);
  return snapshot;
}

export async function buildAndStoreDemoWebsiteSnapshot(input: {
  organizationId?: string;
  url: string;
  companyName?: string;
}): Promise<WebsiteSnapshot> {
  return buildAndStoreDemoWebsiteSnapshotSync(input);
}

export function clearDemoWebsiteSnapshots(): void {
  demoWebsiteSnapshots.clear();
}

export function seedPeergentDemoWebsiteSnapshotSync(): WebsiteSnapshot {
  return buildAndStoreDemoWebsiteSnapshotSync({
    organizationId: PEERGENT_DEMO_ORG_ID,
    url: "https://peergent.com",
    companyName: "Peergent",
  });
}

export async function seedPeergentDemoWebsiteSnapshot(): Promise<WebsiteSnapshot> {
  return seedPeergentDemoWebsiteSnapshotSync();
}

/** Sync getter — returns stored snapshot or undefined. */
export function getOrSeedDemoWebsiteSnapshot(organizationId: string): WebsiteSnapshot | undefined {
  const existing = getDemoWebsiteSnapshot(organizationId);
  if (existing) return existing;
  return undefined;
}
