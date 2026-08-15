/**
 * PX-50.16 / PX-50.18 — privacy-safe organization knowledge materialization diagnostics.
 */

export type OrganizationKnowledgeDiagnosticPayload = {
  event: "organization_knowledge_materialized";
  organizationId: string;
  websiteSourceKind: string;
  websiteKnowledgeAvailable: boolean;
  websiteAnalysisAvailable: boolean;
  competitorCount: number;
  competitorRowCount: number;
  competitorNamedCount: number;
  competitorMaterializedCount: number;
  competitorSourceKind: string;
  competitorsInjectedIntoSnapshot: boolean;
  usesExternalBrand: boolean;
  companyProfileEnriched: boolean;
  durationMs: number;
};

export function emitOrganizationKnowledgeDiagnostic(
  payload: OrganizationKnowledgeDiagnosticPayload
): void {
  if (process.env.BRAIN_CONTEXT_DIAGNOSTICS === "0") return;
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      domain: "brain_organization_knowledge",
      ...payload,
    })
  );
}
