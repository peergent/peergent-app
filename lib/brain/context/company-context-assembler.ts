import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CompanyProfile } from "../company/profile";
import type { CustomerCorrection } from "../company/corrections";
import type { WebsiteSnapshot } from "../website/types";
import type { WebsiteProvider } from "../website/providers/website-provider";
import { createDemoWebsiteProvider } from "../website/providers/demo-website-provider";
import { buildCompanySnapshot } from "../company/snapshot-builder";
import { buildBrainSnapshotFromCompany } from "./brain-snapshot-builder";
import { buildReadinessReport, readinessNeedsMoreInfo } from "./readiness";
import { detectMissingInformation, formatMissingInformationMessage } from "./missing-information";
import { buildSnapshotVersionMetadata } from "./snapshot-versioning";
import { createAssemblyAuditTrace } from "./assembly-audit";
import type {
  ContextAssemblyResult,
  ContextAssemblySource,
  ContextAssemblyState,
  ContextAssemblyWarning,
} from "./assembly-types";
import { CONTEXT_HASH_SLICES, invalidationForCorrection } from "../invalidation/dependency-graph";

export type CompanyContextAssemblerInput = {
  organizationId: string;
  companyProfile?: CompanyProfile | null;
  marketingUnderstanding?: MarketingUnderstanding | null;
  websiteSnapshot?: WebsiteSnapshot | null;
  websiteUrl?: string | null;
  websiteProvider?: WebsiteProvider;
  corrections?: readonly CustomerCorrection[];
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
};

function recordSource(
  audit: ReturnType<typeof createAssemblyAuditTrace>,
  source: ContextAssemblySource,
  refId: string,
  action: "used" | "ignored" | "corrected"
): void {
  const entry = { source, refId, action };
  if (action === "ignored") {
    audit.sourcesIgnored = [...audit.sourcesIgnored, entry];
  } else {
    audit.sourcesUsed = [...audit.sourcesUsed, entry];
  }
}

function buildAssemblyResult(input: {
  assemblerInput: CompanyContextAssemblerInput;
  website: WebsiteSnapshot | null;
  assembledAt: string;
  audit: ReturnType<typeof createAssemblyAuditTrace>;
}): ContextAssemblyResult {
  const { assemblerInput, website, assembledAt, audit } = input;

  const builderResult = buildCompanySnapshot({
    organizationId: assemblerInput.organizationId,
    companyProfile: assemblerInput.companyProfile,
    marketingUnderstanding: assemblerInput.marketingUnderstanding ?? null,
    websiteSnapshot: website,
    campaignContext: assemblerInput.campaignContext ?? null,
    corrections: assemblerInput.corrections,
    assembledAt,
  });

  const companySnapshot = builderResult.snapshot;
  const brandAvailable = Boolean(assemblerInput.marketingUnderstanding?.brand);
  const businessAvailable = Boolean(assemblerInput.marketingUnderstanding?.available);
  const correctionsApplied = assemblerInput.corrections ?? [];

  recordSource(audit, "organization", assemblerInput.organizationId, "used");
  if (assemblerInput.companyProfile) {
    recordSource(audit, "company_profile", assemblerInput.organizationId, "used");
  }
  if (businessAvailable) recordSource(audit, "business_brain", assemblerInput.organizationId, "used");
  if (brandAvailable) recordSource(audit, "brand_brain", assemblerInput.organizationId, "used");
  if (website) recordSource(audit, "website_snapshot", website.source.url, "used");
  if (assemblerInput.campaignContext) {
    recordSource(audit, "campaign_context", assemblerInput.campaignContext.projectId, "used");
  }

  audit.correctionsApplied = [...correctionsApplied];
  audit.unknowns = [...companySnapshot.unknowns];
  for (const c of correctionsApplied) {
    recordSource(audit, "customer_correction", c.fieldKey, "corrected");
    audit.warnings = [
      ...audit.warnings,
      `Invalidates: ${invalidationForCorrection(c.fieldKey).join(", ")}`,
    ];
  }

  const readiness = buildReadinessReport({
    profile: companySnapshot.profile,
    website: companySnapshot.website,
    brandAvailable,
    businessAvailable,
    correctionsApplied: correctionsApplied.length,
  });

  const missingInformation = detectMissingInformation({
    profile: companySnapshot.profile,
    website: companySnapshot.website,
  });

  const warnings: ContextAssemblyWarning[] = missingInformation.map((m) => ({
    id: `warn-${m.id}`,
    code: m.id,
    message: m.reason,
    source: "company_profile" as ContextAssemblySource,
  }));

  let state: ContextAssemblyState = readiness.overall;
  if (readinessNeedsMoreInfo(readiness) && missingInformation.some((m) => m.priority === "critical")) {
    state = "needs_information";
  }

  const brainSnapshot = buildBrainSnapshotFromCompany({
    companySnapshot,
    campaignRef: assemblerInput.campaignContext
      ? {
          refId: assemblerInput.campaignContext.projectId,
          summary: assemblerInput.campaignContext.campaignName,
        }
      : undefined,
    readiness,
    assembledAt,
  });

  const version = buildSnapshotVersionMetadata({
    sourceKeys: [
      assemblerInput.organizationId,
      website?.source.url ?? "no-website",
      String(correctionsApplied.length),
      String(businessAvailable),
      String(brandAvailable),
    ],
    contextKeys: [...CONTEXT_HASH_SLICES],
    createdAt: assembledAt,
  });

  return {
    organizationId: assemblerInput.organizationId,
    state,
    companySnapshot,
    brainSnapshot,
    readiness,
    missingInformation,
    warnings,
    issues: [],
    version,
    audit,
    assembledAt,
  };
}

/**
 * ONLY place where CompanySnapshot and BrainSnapshot are assembled.
 */
export class CompanyContextAssembler {
  /** Synchronous assembly when website snapshot is already available. */
  assemble(input: CompanyContextAssemblerInput): ContextAssemblyResult {
    const assembledAt = new Date().toISOString();
    const audit = createAssemblyAuditTrace({
      organizationId: input.organizationId,
      assembledAt,
    });
    return buildAssemblyResult({
      assemblerInput: input,
      website: input.websiteSnapshot ?? null,
      assembledAt,
      audit,
    });
  }

  /** Resolves website via provider when URL supplied but snapshot missing. */
  async assembleAsync(input: CompanyContextAssemblerInput): Promise<ContextAssemblyResult> {
    const assembledAt = new Date().toISOString();
    const audit = createAssemblyAuditTrace({
      organizationId: input.organizationId,
      assembledAt,
    });

    let website = input.websiteSnapshot ?? null;
    if (!website && input.websiteUrl?.trim()) {
      const provider = input.websiteProvider ?? createDemoWebsiteProvider();
      website = await provider.scan({
        organizationId: input.organizationId,
        url: input.websiteUrl.trim(),
        companyName: input.companyProfile?.companyName.value ?? input.campaignContext?.companyName,
      });
    }

    return buildAssemblyResult({
      assemblerInput: input,
      website,
      assembledAt,
      audit,
    });
  }
}

export const companyContextAssembler = new CompanyContextAssembler();

export async function assembleCompanyContext(
  input: CompanyContextAssemblerInput
): Promise<ContextAssemblyResult> {
  return companyContextAssembler.assembleAsync(input);
}

export function assembleCompanyContextSync(
  input: CompanyContextAssemblerInput
): ContextAssemblyResult {
  return companyContextAssembler.assemble(input);
}

export { formatMissingInformationMessage };
