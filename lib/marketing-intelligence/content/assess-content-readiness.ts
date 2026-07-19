import type { ContextPackage } from "@/lib/intelligence";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import type { ContentCalendarEntry, MarketingPlan } from "../types/plan";
import type { MarketingDraftContentType } from "../types/content-draft";
import type { MarketingStrategyConfidence } from "../types/strategy";
import { isSupportedContentType, normalizeContentType } from "./resolve-plan-activity";

export type ContentDraftReadiness = {
  ready: boolean;
  maxConfidence: MarketingStrategyConfidence;
  warnings: string[];
  normalizedContentType?: MarketingDraftContentType;
};

export function assessContentDraftReadiness(
  plan: MarketingPlan | undefined,
  planActivityReference: string | undefined,
  contextPackage: ContextPackage
): ContentDraftReadiness & { activity?: ContentCalendarEntry } {
  const warnings: string[] = [];

  if (!plan?.summary?.trim()) {
    return {
      ready: false,
      maxConfidence: "low",
      warnings: ["Marketing Plan is required for content creation."],
    };
  }

  if (!planActivityReference?.trim()) {
    return {
      ready: false,
      maxConfidence: "low",
      warnings: ["planActivityReference is required — select a content-calendar activity."],
    };
  }

  const activity = plan.contentCalendar.find(
    (entry) => entry.title.trim().toLowerCase() === planActivityReference.trim().toLowerCase()
  );

  if (!activity) {
    return {
      ready: false,
      maxConfidence: "low",
      warnings: [
        `Content-calendar activity "${planActivityReference}" not found in the Marketing Plan.`,
      ],
    };
  }

  const normalizedContentType = normalizeContentType(activity.contentType);
  if (!normalizedContentType) {
    return {
      ready: false,
      maxConfidence: "low",
      warnings: [
        `Unsupported content type "${activity.contentType}" for activity "${activity.title}".`,
      ],
    };
  }

  if (!isSupportedContentType(activity.contentType)) {
    warnings.push(`Content type "${activity.contentType}" mapped to ${normalizedContentType}.`);
  }

  const dna = contextPackage.slices.companyDna as CompanyDnaContextSlice | undefined;
  if (!dna?.available) {
    warnings.push("Company DNA unavailable — tone of voice guidance may be limited.");
  }

  const brain = contextPackage.slices.businessBrain as BusinessBrainContextSlice | undefined;
  if (!brain?.available) {
    warnings.push("Business Brain unavailable — product/service claims must be avoided.");
  } else if (brain.sparse) {
    warnings.push("Business Brain is sparse — verify all factual claims carefully.");
  }

  const understanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;
  if (!understanding?.roleApplicable || !understanding.available) {
    warnings.push("Marketing Understanding unavailable — audience context may be limited.");
  }

  let maxConfidence: MarketingStrategyConfidence = plan.confidence;
  if (warnings.length > 2) {
    maxConfidence = maxConfidence === "high" ? "moderate" : maxConfidence;
  }
  if (!dna?.available || !brain?.available) {
    maxConfidence = "low";
  }

  return {
    ready: true,
    maxConfidence,
    warnings,
    normalizedContentType,
    activity,
  };
}

export function extractKnownEntities(contextPackage: ContextPackage): {
  productNames: string[];
  serviceNames: string[];
  audienceNames: string[];
} {
  const brain = contextPackage.slices.businessBrain as BusinessBrainContextSlice | undefined;
  const understanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;

  const productNames = [
    ...(brain?.products.map((p) => p.name) ?? []),
    ...(understanding?.products.map((p) => p.name) ?? []),
  ];
  const serviceNames = [
    ...(brain?.services.map((s) => s.name) ?? []),
    ...(understanding?.services.map((s) => s.name) ?? []),
  ];
  const audienceNames = [
    ...(brain?.customerSegments.map((s) => s.name) ?? []),
    ...(understanding?.customerSegments.map((s) => s.name) ?? []),
  ];

  return {
    productNames: [...new Set(productNames)],
    serviceNames: [...new Set(serviceNames)],
    audienceNames: [...new Set(audienceNames)],
  };
}
