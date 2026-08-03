import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainProvenanceRef } from "../domain/provenance";
import { resolveFreshness } from "../domain/freshness";
import type { CompanyProfile } from "./profile";
import { emptyCompanyProfile } from "./profile";
import type { CustomerCorrection } from "./corrections";
import { applyCorrectionToFieldValue, applyCorrectionToListValue } from "./corrections";
import { fieldFromValue, fieldFromListValue, winningSource, type CompanyFactSource } from "./source-priority";
import type { WebsiteSnapshot } from "../website/types";
import type {
  CompanySnapshot,
  CompanySnapshotBuilderInput,
  CompanySnapshotBuilderResult,
} from "./snapshot";

const PROFILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function applyCorrections(profile: CompanyProfile, corrections?: readonly CustomerCorrection[]): CompanyProfile {
  if (!corrections?.length) return profile;

  const next = { ...profile };
  for (const correction of corrections) {
    const key = correction.fieldKey as keyof CompanyProfile;
    if (key === "targetAudiences") {
      const listValue = applyCorrectionToListValue(
        profile.targetAudiences.value,
        correction.action === "remove" || correction.action === "reject_inference"
          ? correction
          : correction.correctedListValue
            ? correction
            : undefined
      );
      if (correction.correctedListValue || correction.action === "remove" || correction.action === "reject_inference") {
        next.targetAudiences = {
          value: listValue,
          source: "customer_confirmed",
          lastUpdatedAt: correction.correctedAt,
          freshness: "fresh",
          confidence: "high",
          customerConfirmed: true,
        };
      }
      continue;
    }
    const field = next[key];
    if (field && typeof field === "object" && "value" in field && typeof field.value === "string") {
      (next as Record<string, unknown>)[key] = {
        ...field,
        value: applyCorrectionToFieldValue(field.value, correction),
        source: "customer_confirmed" as CompanyFactSource,
        customerConfirmed: true,
        confidence: "high",
        freshness: "fresh",
        lastUpdatedAt: correction.correctedAt,
      };
    }
  }
  return next;
}

function mergeMarketingUnderstanding(
  profile: CompanyProfile,
  understanding: MarketingUnderstanding,
  at: string
): CompanyProfile {
  const next = { ...profile };
  if (understanding.products?.length) {
    next.products = fieldFromListValue(
      understanding.products.map((p) => p.name),
      "integration",
      { lastUpdatedAt: at, freshness: resolveFreshness(at, PROFILE_TTL_MS) }
    );
  }
  if (understanding.services?.length) {
    next.services = fieldFromListValue(
      understanding.services.map((s) => s.name),
      "integration",
      { lastUpdatedAt: at, freshness: resolveFreshness(at, PROFILE_TTL_MS) }
    );
  }
  if (understanding.customerSegments?.length) {
    next.targetAudiences = fieldFromListValue(
      understanding.customerSegments.map((s) => s.name),
      "integration",
      { lastUpdatedAt: at, freshness: resolveFreshness(at, PROFILE_TTL_MS) }
    );
  }
  if (understanding.competitors?.length) {
    next.mainCompetitors = fieldFromListValue(
      understanding.competitors.map((c) => c.name),
      "integration",
      { lastUpdatedAt: at, freshness: resolveFreshness(at, PROFILE_TTL_MS) }
    );
  }
  const brand = understanding.brand;
  if (brand?.positioningStatement) {
    next.positioning = fieldFromValue(brand.positioningStatement, "integration", {
      lastUpdatedAt: at,
      freshness: resolveFreshness(at, PROFILE_TTL_MS),
    });
  }
  if (brand?.toneOfVoice?.summary) {
    next.tone = fieldFromValue(brand.toneOfVoice.summary, "integration", {
      lastUpdatedAt: at,
      freshness: resolveFreshness(at, PROFILE_TTL_MS),
    });
  }
  return next;
}

function mergeWebsite(profile: CompanyProfile, website: WebsiteSnapshot): CompanyProfile {
  const at = website.assembledAt;
  const next = { ...profile };
  next.website = fieldFromValue(website.source.url, "website_extracted", {
    lastUpdatedAt: at,
    freshness: website.freshness.freshness,
  });
  if (website.metadata.title && !next.companyName.value) {
    next.companyName = fieldFromValue(website.metadata.title, "website_extracted", {
      lastUpdatedAt: at,
      freshness: website.freshness.freshness,
    });
  }
  return next;
}

function mergeCampaignInput(
  profile: CompanyProfile,
  ctx: CampaignContext,
  at: string
): CompanyProfile {
  const next = { ...profile };
  if (ctx.description.trim()) {
    const source: CompanyFactSource = "customer_entered";
    next.goals = fieldFromListValue([ctx.description.trim()], source, {
      lastUpdatedAt: at,
      freshness: "fresh",
      confidence: "medium",
    });
  }
  if (ctx.audience.trim()) {
    const existing = next.targetAudiences.value ?? [];
    const merged = [...new Set([...existing, ctx.audience.trim()])];
    const source = winningSource(next.targetAudiences.source, "customer_entered");
    next.targetAudiences = fieldFromListValue(merged, source, {
      lastUpdatedAt: at,
      freshness: "fresh",
      confidence: source === "customer_confirmed" ? "high" : "medium",
      customerConfirmed: next.targetAudiences.customerConfirmed,
    });
  }
  if (ctx.companyName.trim() && !next.companyName.value) {
    next.companyName = fieldFromValue(ctx.companyName.trim(), "customer_entered", {
      lastUpdatedAt: at,
      freshness: "fresh",
    });
  }
  return next;
}

function collectKnownFacts(profile: CompanyProfile): CompanySnapshot["knownFacts"] {
  const facts: Array<CompanySnapshot["knownFacts"][number]> = [];
  const add = (id: string, label: string, value: string | null, kind: BrainProvenanceRef["kind"]) => {
    if (!value?.trim()) return;
    facts.push({
      id,
      label,
      value: value.trim(),
      provenance: { kind, refId: `company:${profile.organizationId}:${id}`, capturedAt: profile.metadata.lastUpdatedAt ?? undefined },
    });
  };
  add("company-name", "Company name", profile.companyName.value, "company_profile");
  add("industry", "Industry", profile.industry.value, "company_profile");
  add("positioning", "Positioning", profile.positioning.value, "company_profile");
  add("tone", "Tone", profile.tone.value, "company_profile");
  if (profile.products.value?.length) {
    facts.push({
      id: "products",
      label: "Products",
      value: profile.products.value.join(", "),
      provenance: { kind: "company_profile", refId: `company:${profile.organizationId}:products` },
    });
  }
  return facts;
}

function collectUnknowns(profile: CompanyProfile, website: WebsiteSnapshot | null): string[] {
  const unknowns = [...profile.unknowns];
  if (!profile.companyName.value) unknowns.push("company_name");
  if (!profile.industry.value) unknowns.push("industry");
  if (!profile.positioning.value) unknowns.push("positioning");
  if (!profile.targetAudiences.value?.length) unknowns.push("target_audiences");
  if (!website) unknowns.push("website_snapshot");
  return [...new Set(unknowns)];
}

function assessReadiness(profile: CompanyProfile): CompanySnapshotBuilderResult["readiness"] {
  const hasCore =
    Boolean(profile.companyName.value) ||
    Boolean(profile.positioning.value) ||
    Boolean(profile.targetAudiences.value?.length);
  if (!hasCore) return "unknown";
  const gaps = [
    !profile.industry.value,
    !profile.products.value?.length && !profile.services.value?.length,
    !profile.positioning.value,
  ].filter(Boolean).length;
  return gaps >= 2 ? "partial" : "ready";
}

/** Assembles org-level Company Snapshot from upstream systems. */
export class CompanySnapshotBuilder {
  build(input: CompanySnapshotBuilderInput): CompanySnapshotBuilderResult {
    const assembledAt = input.assembledAt ?? new Date().toISOString();
    let profile = input.companyProfile ?? emptyCompanyProfile(input.organizationId);
    profile = applyCorrections(profile, input.corrections);
    if (input.websiteSnapshot) profile = mergeWebsite(profile, input.websiteSnapshot);
    profile = {
      ...profile,
      metadata: {
        freshness: resolveFreshness(assembledAt, PROFILE_TTL_MS),
        lastUpdatedAt: assembledAt,
      },
    };
    const sources: BrainProvenanceRef[] = [];
    if (input.businessBrainAvailable) {
      sources.push({ kind: "company_profile", refId: `business-brain:${input.organizationId}`, label: "Business Brain" });
    }
    if (input.brandBrainAvailable) {
      sources.push({ kind: "company_profile", refId: `brand-brain:${input.organizationId}`, label: "Brand Brain" });
    }
    if (input.websiteSnapshot) {
      sources.push({ kind: "website", refId: input.websiteSnapshot.source.url, label: "Website snapshot" });
    }
    const snapshot: CompanySnapshot = {
      organizationId: input.organizationId,
      profile,
      website: input.websiteSnapshot ?? null,
      knownFacts: collectKnownFacts(profile),
      unknowns: collectUnknowns(profile, input.websiteSnapshot ?? null),
      sources,
      assembledAt,
    };
    return { snapshot, readiness: assessReadiness(profile) };
  }

  buildFromContext(input: {
    organizationId: string;
    companyProfile?: CompanyProfile | null;
    marketingUnderstanding?: MarketingUnderstanding | null;
    campaignContext?: CampaignContext | null;
    websiteSnapshot?: WebsiteSnapshot | null;
    corrections?: readonly CustomerCorrection[];
    assembledAt?: string;
  }): CompanySnapshotBuilderResult {
    const assembledAt = input.assembledAt ?? new Date().toISOString();
    let profile = input.companyProfile ?? emptyCompanyProfile(input.organizationId);
    if (input.marketingUnderstanding?.available) {
      profile = mergeMarketingUnderstanding(profile, input.marketingUnderstanding, assembledAt);
    }
    if (input.campaignContext) profile = mergeCampaignInput(profile, input.campaignContext, assembledAt);
    return this.build({
      organizationId: input.organizationId,
      companyProfile: profile,
      businessBrainAvailable: Boolean(input.marketingUnderstanding?.available),
      brandBrainAvailable: Boolean(input.marketingUnderstanding?.brand),
      websiteSnapshot: input.websiteSnapshot,
      corrections: input.corrections,
      assembledAt,
    });
  }
}

export function buildCompanySnapshot(
  input: Parameters<CompanySnapshotBuilder["buildFromContext"]>[0]
): CompanySnapshotBuilderResult {
  return new CompanySnapshotBuilder().buildFromContext(input);
}
