import type { CompanySnapshot } from "../../company/snapshot";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { ResearchEvidence, ResearchSource, ResearchUnknown } from "./types";

/** Common contract for every Research Module — discovers facts only. */
export type ResearchModuleId =
  | "company_research"
  | "website_research"
  | "competitor_research"
  | "product_research"
  | "audience_research"
  | "seo_research"
  | "brand_research"
  | "market_research"
  | "offer_research";

export type ResearchModuleInput = {
  companySnapshot: CompanySnapshot;
  campaignContext?: CampaignContext | null;
  upstreamOutputs?: Partial<Record<string, BrainStructuredOutput>>;
  locale: "nl" | "en";
};

/** Output from a single module run — no recommendations. */
export type ResearchModuleOutput = {
  moduleId: ResearchModuleId;
  version: string;
  evidence: readonly ResearchEvidence[];
  unknowns: readonly ResearchUnknown[];
  sources: readonly ResearchSource[];
  confidence: number;
  collectedAt: string;
};

export type ResearchModuleSpec = {
  id: ResearchModuleId;
  version: string;
  purpose: string;
  /** Capability id this module wraps today (strangler). Undefined = not yet wired. */
  legacyCapabilityId?: string;
  /** Whether module has a runtime adapter beyond spec. */
  implemented: boolean;
  inputDescription: string;
  outputDescription: string;
};

export type ResearchModule = {
  spec: ResearchModuleSpec;
  /** Collect facts — must not generate recommendations or invent facts. */
  collect: (input: ResearchModuleInput) => ResearchModuleOutput;
};

export function averageModuleConfidence(evidence: readonly ResearchEvidence[]): number {
  if (evidence.length === 0) return 0;
  return evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length;
}
