import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignContext, isSeedCampaign } from "@/lib/office/campaign/campaign-context";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { buildCompanySnapshot } from "../company/snapshot-builder";
import type { CompanySnapshotBuilderResult } from "../company/snapshot";
import { buildPeergentCompanyProfile, PEERGENT_DEMO_ORG_ID } from "../demo/peergent-company-profile";
import {
  buildAndStoreDemoWebsiteSnapshot,
  getDemoWebsiteSnapshot,
  seedPeergentDemoWebsiteSnapshot,
} from "../demo/demo-intelligence-store";
import type { CompanyProfile } from "../company/profile";
import type { WebsiteSnapshot } from "../website/types";

export type ResolveCompanyIntelligenceInput = {
  peerId: string;
  organizationId?: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  campaignContext?: CampaignContext;
};

export function resolveOrganizationId(peerId: string, organizationId?: string): string {
  if (organizationId) return organizationId;
  if (isDemoPeer(peerId)) return PEERGENT_DEMO_ORG_ID;
  return `org-${peerId}`;
}

export function resolveWebsiteSnapshotForOrg(input: {
  organizationId: string;
  campaignContext: CampaignContext;
  peerId: string;
}): WebsiteSnapshot | null {
  const stored = getDemoWebsiteSnapshot(input.organizationId);
  if (stored) return stored;

  if (
    input.campaignContext.websiteUrl &&
    input.campaignContext.websiteState !== "missing" &&
    input.campaignContext.websiteState !== "skipped"
  ) {
    return buildAndStoreDemoWebsiteSnapshot({
      organizationId: input.organizationId,
      url: input.campaignContext.websiteUrl,
      companyName: input.campaignContext.companyName,
    });
  }

  if (isDemoPeer(input.peerId) && isSeedCampaign(input.campaignContext.projectId)) {
    return seedPeergentDemoWebsiteSnapshot();
  }

  return null;
}

export function resolveCompanyIntelligence(
  input: ResolveCompanyIntelligenceInput
): CompanySnapshotBuilderResult {
  const overlay = readDemoCampaignOverlay(input.domainInput);
  const ctx =
    input.campaignContext ??
    overlay.demoCampaignContexts?.[input.project.id] ??
    buildCampaignContext({ project: input.project, domainInput: input.domainInput });

  const organizationId = resolveOrganizationId(input.peerId, input.organizationId);
  const assembledAt = new Date().toISOString();

  const companyProfile: CompanyProfile | null = isDemoPeer(input.peerId)
    ? buildPeergentCompanyProfile(ctx.locale, assembledAt)
    : null;

  const websiteSnapshot = resolveWebsiteSnapshotForOrg({
    organizationId,
    campaignContext: ctx,
    peerId: input.peerId,
  });

  return buildCompanySnapshot({
    organizationId,
    companyProfile,
    marketingUnderstanding: input.domainInput.understanding ?? null,
    campaignContext: ctx,
    websiteSnapshot,
    assembledAt,
  });
}
