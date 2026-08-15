import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import type {
  MaterializeOrganizationKnowledgeInput,
  MaterializedOrganizationKnowledge,
} from "./types";
import { resolveOrganizationWebsiteSnapshot } from "./resolve-organization-website";
import { loadOrganizationCompetitors } from "./materialize-organization-competitors";

function normalizePeerRole(role?: string): string {
  const trimmed = role?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Marketing";
}

function isMarketingPeerRole(role: string): boolean {
  return role.toLowerCase() === "marketing";
}

/**
 * Canonical organization knowledge materialization boundary.
 * Loads durable org website + Business Brain-backed profile inputs once,
 * before CompanySnapshot assembly and capability execution.
 */
export async function materializeOrganizationKnowledge(
  input: MaterializeOrganizationKnowledgeInput
): Promise<MaterializedOrganizationKnowledge> {
  const startMs = Date.now();
  const peerRole = normalizePeerRole(input.peerRole);

  const [website, competitorLoad] = await Promise.all([
    resolveOrganizationWebsiteSnapshot({
      supabase: input.supabase,
      organizationId: input.organizationId,
      peerId: input.peerId,
      campaignWebsiteSkipped: input.campaignWebsiteSkipped,
    }),
    loadOrganizationCompetitors(input.supabase, input.organizationId),
  ]);

  let marketingUnderstanding = null;
  if (isMarketingPeerRole(peerRole)) {
    const { slice } = await loadMarketingUnderstandingContext(
      input.supabase,
      input.organizationId,
      "Marketing",
      "project_context"
    );
    marketingUnderstanding = slice.available ? slice : null;
  } else {
    const { slice } = await loadMarketingUnderstandingContext(
      input.supabase,
      input.organizationId,
      "Marketing",
      "project_context"
    );
    marketingUnderstanding = slice.available ? slice : null;
  }

  const competitors = competitorLoad.competitors;
  const competitorSourceKind =
    competitors.length > 0 ? ("business_brain" as const) : ("none" as const);

  const companyProfileEnriched = Boolean(
    website.snapshot ||
      competitors.length > 0 ||
      (marketingUnderstanding?.products.length ?? 0) > 0 ||
      (marketingUnderstanding?.customerSegments.length ?? 0) > 0
  );

  const durationMs = Date.now() - startMs;
  const result: MaterializedOrganizationKnowledge = {
    organizationId: input.organizationId,
    websiteSnapshot: website.snapshot,
    websiteSourceKind: website.sourceKind,
    websiteKnowledgeAvailable: Boolean(website.snapshot),
    websiteAnalysisAvailable: website.analysisAvailable,
    marketingUnderstanding,
    competitors,
    competitorRowCount: competitorLoad.rowCount,
    competitorNamedCount: competitorLoad.namedCount,
    competitorMaterializedCount: competitors.length,
    competitorSourceKind,
    companyProfileEnriched,
    durationMs,
  };

  return result;
}
