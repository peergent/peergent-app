/**
 * PX-50.20 — privacy-safe campaign brand boundary diagnostics.
 */

import type {
  ExternalBrandDecisionSource,
  OrganizationIdentitySource,
} from "./campaign-brand-boundary";

export type CampaignBrandBoundaryDiagnosticPayload = {
  event: "campaign_brand_boundary_resolved";
  organizationId?: string;
  organizationIdentitySource: OrganizationIdentitySource;
  hasExplicitCampaignBrand: boolean;
  usesExternalBrand: boolean;
  externalBrandDecisionSource: ExternalBrandDecisionSource;
  setupMode?: "automatic" | "manual";
};

export function emitCampaignBrandBoundaryDiagnostic(
  payload: CampaignBrandBoundaryDiagnosticPayload
): void {
  if (process.env.BRAIN_CONTEXT_DIAGNOSTICS === "0") return;
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      domain: "brain_campaign_brand_boundary",
      ...payload,
    })
  );
}
