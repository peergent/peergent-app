import { assembleCompanyContext } from "../../context/company-context-assembler";
import type { ContextAssemblyResult } from "../../context/assembly-types";
import type { AcquireBrainContextInput } from "../types";
import {
  emitOrganizationKnowledgeDiagnostic,
  materializeOrganizationKnowledge,
} from "../../organization-knowledge";

export async function assembleContextFromSources(
  input: AcquireBrainContextInput
): Promise<ContextAssemblyResult | null> {
  try {
    const campaignContext = input.campaignContext ?? null;
    const materialized = await materializeOrganizationKnowledge({
      supabase: input.supabase,
      organizationId: input.organizationId,
      peerId: input.peerId,
      peerRole: input.task.peerRole,
      campaignWebsiteSkipped: campaignContext?.websiteState === "skipped",
      usesExternalBrand: campaignContext?.usesExternalBrand ?? false,
      competitorsSkipped: campaignContext?.competitorsSkipped ?? false,
    });

    const understanding = materialized.marketingUnderstanding;

    if (
      !understanding?.available &&
      !campaignContext &&
      !materialized.websiteSnapshot &&
      materialized.competitors.length === 0
    ) {
      return null;
    }

    const assembly = await assembleCompanyContext({
      organizationId: input.organizationId,
      marketingUnderstanding: understanding?.available ? understanding : null,
      materializedOrganizationCompetitors: materialized.competitors,
      websiteSnapshot: materialized.websiteSnapshot,
      websiteUrl: campaignContext?.websiteUrl ?? null,
      campaignContext,
      locale: input.task.locale ?? "en",
    });

    const profileCompetitorCount = assembly.companySnapshot.profile.mainCompetitors.value?.length ?? 0;
    emitOrganizationKnowledgeDiagnostic({
      event: "organization_knowledge_materialized",
      organizationId: input.organizationId,
      websiteSourceKind: materialized.websiteSourceKind,
      websiteKnowledgeAvailable: materialized.websiteKnowledgeAvailable,
      websiteAnalysisAvailable: materialized.websiteAnalysisAvailable,
      competitorCount: materialized.competitorMaterializedCount,
      competitorRowCount: materialized.competitorRowCount,
      competitorNamedCount: materialized.competitorNamedCount,
      competitorMaterializedCount: materialized.competitorMaterializedCount,
      competitorSourceKind: materialized.competitorSourceKind,
      competitorsInjectedIntoSnapshot:
        profileCompetitorCount > 0 &&
        !(campaignContext?.usesExternalBrand ?? false) &&
        !(campaignContext?.competitorsSkipped ?? false),
      usesExternalBrand: campaignContext?.usesExternalBrand ?? false,
      companyProfileEnriched: materialized.companyProfileEnriched,
      durationMs: materialized.durationMs,
    });

    return assembly;
  } catch {
    return null;
  }
}
