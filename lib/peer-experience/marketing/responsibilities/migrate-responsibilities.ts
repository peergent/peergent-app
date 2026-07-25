import { loadPeerSettings } from "../peer-settings-store";
import { RESPONSIBILITY_CATALOG } from "./responsibility-catalog";
import { createMarketingResponsibility } from "./responsibility-engine";
import type { MarketingResponsibility } from "./types";

export type ResponsibilityMigrationResult = {
  responsibilities: MarketingResponsibility[];
};

/** Seed responsibilities from peer settings catalog when workspace has none. */
export function migrateWorkspaceResponsibilities(input: {
  peerId: string;
  organizationId?: string;
  responsibilities?: MarketingResponsibility[];
}): ResponsibilityMigrationResult {
  const existing = input.responsibilities ?? [];
  if (existing.length > 0) {
    return { responsibilities: existing };
  }

  const settings = loadPeerSettings(input.peerId);
  const responsibilities = RESPONSIBILITY_CATALOG.map((entry) =>
    createMarketingResponsibility(input.peerId, entry, {
      enabled: settings.responsibilities[entry.catalogId],
      organizationId: input.organizationId,
    })
  );

  return { responsibilities };
}

/** Merge catalog entries missing from stored responsibilities (forward-compatible). */
export function ensureResponsibilityCatalog(
  peerId: string,
  existing: MarketingResponsibility[],
  organizationId?: string
): MarketingResponsibility[] {
  const byCategory = new Map(existing.map((r) => [r.category, r]));
  const merged = [...existing];

  for (const entry of RESPONSIBILITY_CATALOG) {
    if (!byCategory.has(entry.category)) {
      merged.push(
        createMarketingResponsibility(peerId, entry, {
          enabled: false,
          organizationId,
        })
      );
    }
  }

  return merged;
}
