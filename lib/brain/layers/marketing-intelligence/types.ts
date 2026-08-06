/**
 * Marketing Intelligence Layer — canonical types.
 * Sprint 9.3. Translates business understanding into marketing thinking.
 * Never generates ads, channels, or creative.
 */

export const MARKETING_INTELLIGENCE_LAYER_VERSION = "1.1.0";

export type MarketingIntelligenceConfidence = number;

/** Single marketing-thinking insight with evidence chain. */
export type MarketingIntelligenceInsight = {
  id: string;
  title: string;
  /** Consultant-grade narrative — specific, grounded, never generic ad copy. */
  narrative: string;
  confidence: MarketingIntelligenceConfidence;
  /** Research evidence ids. */
  supportingEvidence: readonly string[];
  /** Reasoning node ids this insight derives from. */
  reasoningReferences: readonly string[];
  marketingIntelligenceVersion: string;
  createdAt: string;
};

import type { MarketingIntelligenceThinkingRecord } from "./marketing-intelligence-thinking";

/** Internal Marketing Brain layer output — consumed by Strategy. */
export type MarketingIntelligenceGraph = {
  version: string;
  organizationId: string;
  campaignId?: string;
  reasoningVersion: string;
  createdAt: string;
  /** Internal strategist Q&A — never shown directly to customers (Sprint 10.1). */
  internalThinking: readonly MarketingIntelligenceThinkingRecord[];
  businessReality: MarketingIntelligenceInsight;
  buyingMotivation: MarketingIntelligenceInsight;
  primaryPain: MarketingIntelligenceInsight;
  emotionalDrivers: MarketingIntelligenceInsight;
  objections: MarketingIntelligenceInsight;
  strongestPositioning: MarketingIntelligenceInsight;
  competitiveAdvantage: MarketingIntelligenceInsight;
  dominantMessaging: MarketingIntelligenceInsight;
  highestProbabilityCampaigns: readonly MarketingIntelligenceInsight[];
  antiPatterns: readonly MarketingIntelligenceInsight[];
  missingInformation: readonly MarketingIntelligenceInsight[];
  assumptions: readonly MarketingIntelligenceInsight[];
};

export function emptyMarketingIntelligenceGraph(input: {
  organizationId: string;
  campaignId?: string;
  reasoningVersion: string;
  createdAt?: string;
}): MarketingIntelligenceGraph {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const version = MARKETING_INTELLIGENCE_LAYER_VERSION;
  const blank = (id: string, title: string): MarketingIntelligenceInsight => ({
    id,
    title,
    narrative: "",
    confidence: 0,
    supportingEvidence: [],
    reasoningReferences: [],
    marketingIntelligenceVersion: version,
    createdAt,
  });

  return {
    version,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    reasoningVersion: input.reasoningVersion,
    createdAt,
    internalThinking: [],
    businessReality: blank("mi:business-reality", "Business reality"),
    buyingMotivation: blank("mi:buying-motivation", "Buying motivation"),
    primaryPain: blank("mi:primary-pain", "Primary pain"),
    emotionalDrivers: blank("mi:emotional-drivers", "Emotional drivers"),
    objections: blank("mi:objections", "Objections"),
    strongestPositioning: blank("mi:strongest-positioning", "Strongest positioning"),
    competitiveAdvantage: blank("mi:competitive-advantage", "Competitive advantage"),
    dominantMessaging: blank("mi:dominant-messaging", "Dominant messaging"),
    highestProbabilityCampaigns: [],
    antiPatterns: [],
    missingInformation: [],
    assumptions: [],
  };
}
