/**
 * PX-50.16 — privacy-safe organization knowledge materialization diagnostics.
 */

export type OrganizationKnowledgeDiagnosticPayload = {
  event: "organization_knowledge_materialized";
  organizationId: string;
  websiteSourceKind: string;
  websiteKnowledgeAvailable: boolean;
  websiteAnalysisAvailable: boolean;
  competitorCount: number;
  competitorSourceKind: string;
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
