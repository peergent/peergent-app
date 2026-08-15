import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { fetchLatestWebsiteIntelligenceAssessment } from "@/lib/website-intelligence/persistence";
import { createBusinessBrainService } from "@/lib/business-brain";
import type { WebsiteSnapshot } from "../website/types";
import { buildCustomerSuppliedWebsiteSnapshot } from "../website/build-customer-supplied-snapshot";
import { buildWebsiteSnapshotFromAssessment } from "./build-website-snapshot-from-assessment";
import type { OrganizationWebsiteSourceKind } from "./types";

const URL_PATTERN = /^https?:\/\/.+/i;

function normalizeUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !URL_PATTERN.test(trimmed)) return null;
  return trimmed.replace(/\/$/, "");
}

function websiteFromSnapshotPayload(payload: Record<string, unknown>): WebsiteSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  if ("source" in payload && "pages" in payload) {
    return payload as unknown as WebsiteSnapshot;
  }
  return null;
}

async function loadPeerWebsiteUrl(
  supabase: AppSupabaseClient,
  organizationId: string,
  peerId?: string
): Promise<string | null> {
  if (peerId) {
    const { data, error } = await supabase
      .from("peers")
      .select("website")
      .eq("id", peerId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load peer website: ${error.message}`);
    const url = normalizeUrl(data?.website);
    if (url) return url;
  }

  const { data, error } = await supabase
    .from("peers")
    .select("website")
    .eq("organization_id", organizationId)
    .not("website", "is", null)
    .limit(10);

  if (error) throw new Error(`Failed to load organization peer websites: ${error.message}`);

  for (const row of data ?? []) {
    const url = normalizeUrl(row.website);
    if (url) return url;
  }

  return null;
}

type BrainSnapshotRow = {
  payload: unknown;
  freshness: string;
  created_at: string;
};

async function loadBrainWebsiteSnapshot(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<WebsiteSnapshot | null> {
  const client = supabase as AppSupabaseClient & {
    from: (table: string) => ReturnType<AppSupabaseClient["from"]>;
  };
  const { data, error } = await client
    .from("brain_snapshots")
    .select("payload, freshness, created_at")
    .eq("organization_id", organizationId)
    .eq("snapshot_kind", "website")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;
    throw new Error(`Failed to load brain website snapshot: ${error.message}`);
  }

  const row = data as BrainSnapshotRow | null;
  if (!row?.payload || typeof row.payload !== "object") return null;
  return websiteFromSnapshotPayload(row.payload as Record<string, unknown>);
}

async function loadBusinessBrainWebsiteUrl(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<string | null> {
  const aggregate = await createBusinessBrainService(supabase).getAggregate(organizationId);
  const websiteSource = aggregate.knowledgeSources.find(
    (source) => source.sourceType === "website" && normalizeUrl(source.sourceUrl)
  );
  return normalizeUrl(websiteSource?.sourceUrl);
}

export type ResolvedOrganizationWebsite = {
  snapshot: WebsiteSnapshot | null;
  sourceKind: OrganizationWebsiteSourceKind;
  analysisAvailable: boolean;
};

/**
 * Deterministic organization website precedence (org durable stores only):
 * 1. peer configured website
 * 2. Website Intelligence assessment
 * 3. brain_snapshots website payload
 * 4. Business Brain website knowledge source
 *
 * Campaign explicit URL is applied later in CompanyContextAssembler.
 */
export async function resolveOrganizationWebsiteSnapshot(input: {
  supabase: AppSupabaseClient;
  organizationId: string;
  peerId?: string;
  campaignWebsiteSkipped?: boolean;
}): Promise<ResolvedOrganizationWebsite> {
  if (input.campaignWebsiteSkipped) {
    return { snapshot: null, sourceKind: "unknown", analysisAvailable: false };
  }

  const peerUrl = await loadPeerWebsiteUrl(input.supabase, input.organizationId, input.peerId);
  if (peerUrl) {
    return {
      snapshot: buildCustomerSuppliedWebsiteSnapshot({
        organizationId: input.organizationId,
        url: peerUrl,
      }),
      sourceKind: "peer_configured",
      analysisAvailable: false,
    };
  }

  const loadedAssessment = await fetchLatestWebsiteIntelligenceAssessment(
    input.supabase,
    input.organizationId
  );
  if (loadedAssessment) {
    const snapshot = buildWebsiteSnapshotFromAssessment({
      organizationId: input.organizationId,
      assessment: loadedAssessment.assessment,
      analyzedAt: loadedAssessment.analyzedAt,
      sourceUrl: loadedAssessment.assessment.meta.url,
    });
    return {
      snapshot,
      sourceKind: "website_intelligence",
      analysisAvailable: snapshot.findings.length > 0,
    };
  }

  const brainSnapshot = await loadBrainWebsiteSnapshot(input.supabase, input.organizationId);
  if (brainSnapshot) {
    return {
      snapshot: brainSnapshot,
      sourceKind: "brain_snapshot",
      analysisAvailable: brainSnapshot.findings.length > 0,
    };
  }

  const bbUrl = await loadBusinessBrainWebsiteUrl(input.supabase, input.organizationId);
  if (bbUrl) {
    return {
      snapshot: buildCustomerSuppliedWebsiteSnapshot({
        organizationId: input.organizationId,
        url: bbUrl,
      }),
      sourceKind: "business_brain_source",
      analysisAvailable: false,
    };
  }

  return { snapshot: null, sourceKind: "unknown", analysisAvailable: false };
}
