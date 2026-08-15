import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import type {
  MaterializeOrganizationKnowledgeInput,
  MaterializedOrganizationKnowledge,
} from "./types";
import { resolveOrganizationWebsiteSnapshot } from "./resolve-organization-website";
import { emitOrganizationKnowledgeDiagnostic } from "./diagnostics";

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

  const website = await resolveOrganizationWebsiteSnapshot({
    supabase: input.supabase,
    organizationId: input.organizationId,
    peerId: input.peerId,
    campaignWebsiteSkipped: input.campaignWebsiteSkipped,
  });

  let marketingUnderstanding = null;
  if (isMarketingPeerRole(peerRole)) {
    const { slice } = await loadMarketingUnderstandingContext(
      input.supabase,
      input.organizationId,
      peerRole,
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

  const competitorCount = marketingUnderstanding?.competitors.length ?? 0;
  const competitorSourceKind =
    competitorCount > 0 ? ("business_brain" as const) : ("none" as const);

  const companyProfileEnriched = Boolean(
    website.snapshot ||
      competitorCount > 0 ||
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
    competitorCount,
    competitorSourceKind,
    companyProfileEnriched,
    durationMs,
  };

  emitOrganizationKnowledgeDiagnostic({
    event: "organization_knowledge_materialized",
    organizationId: input.organizationId,
    websiteSourceKind: result.websiteSourceKind,
    websiteKnowledgeAvailable: result.websiteKnowledgeAvailable,
    websiteAnalysisAvailable: result.websiteAnalysisAvailable,
    competitorCount: result.competitorCount,
    competitorSourceKind: result.competitorSourceKind,
    companyProfileEnriched: result.companyProfileEnriched,
    durationMs,
  });

  return result;
}
