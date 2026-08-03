import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignContext, isSeedCampaign } from "@/lib/office/campaign/campaign-context";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { assembleCompanyContextSync } from "../context/company-context-assembler";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { buildPeergentCompanyProfile, PEERGENT_DEMO_ORG_ID } from "../demo/peergent-company-profile";
import {
  getDemoWebsiteSnapshot,
  setDemoWebsiteSnapshot,
  seedPeergentDemoWebsiteSnapshotSync,
} from "../demo/demo-intelligence-store";
import { createDemoWebsiteProvider } from "../website/providers/demo-website-provider";
import type { CompanyProfile } from "../company/profile";

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

function buildAssemblerInput(input: ResolveCompanyIntelligenceInput): {
  assemblerInput: Parameters<typeof assembleCompanyContextSync>[0];
  ctx: CampaignContext;
} {
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

  let websiteSnapshot = getDemoWebsiteSnapshot(organizationId) ?? null;
  if (!websiteSnapshot && isDemoPeer(input.peerId) && isSeedCampaign(ctx.projectId)) {
    seedPeergentDemoWebsiteSnapshotSync();
    websiteSnapshot = getDemoWebsiteSnapshot(organizationId) ?? null;
  }

  return {
    ctx,
    assemblerInput: {
      organizationId,
      companyProfile,
      marketingUnderstanding: input.domainInput.understanding ?? null,
      websiteSnapshot,
      websiteUrl:
        !websiteSnapshot && ctx.websiteUrl && ctx.websiteState !== "skipped"
          ? ctx.websiteUrl
          : null,
      websiteProvider: createDemoWebsiteProvider(),
      campaignContext: ctx,
      locale: ctx.locale,
    },
  };
}

export function resolveCompanyIntelligence(
  input: ResolveCompanyIntelligenceInput
): ContextAssemblyResult {
  const { assemblerInput } = buildAssemblerInput(input);
  return assembleCompanyContextSync(assemblerInput);
}

export async function resolveCompanyIntelligenceAsync(
  input: ResolveCompanyIntelligenceInput
): Promise<ContextAssemblyResult> {
  const { assemblerInput } = buildAssemblerInput(input);
  const { assembleCompanyContext } = await import("../context/company-context-assembler");
  const result = await assembleCompanyContext(assemblerInput);
  if (result.companySnapshot.website) {
    setDemoWebsiteSnapshot(result.companySnapshot.website);
  }
  return result;
}

/** @deprecated Use ContextAssemblyResult */
export function resolveCompanyIntelligenceLegacy(input: ResolveCompanyIntelligenceInput): {
  snapshot: ContextAssemblyResult["companySnapshot"];
  readiness: "ready" | "partial" | "unknown";
} {
  const result = resolveCompanyIntelligence(input);
  return {
    snapshot: result.companySnapshot,
    readiness:
      result.state === "ready"
        ? "ready"
        : result.state === "partial"
          ? "partial"
          : "unknown",
  };
}
