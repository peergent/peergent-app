import type {
  MarketingIntelligenceBrainGraph,
  MarketingIntelligenceBrainInput,
} from "../layers/marketing-intelligence/brain-types";
import { buildMarketingIntelligenceBrainGraph } from "../layers/marketing-intelligence/marketing-intelligence-graph";
import type { MarketingIntelligenceLlmPayload } from "./marketing-intelligence-llm-schema";
import type { IntelligenceProviderMetadata } from "./intelligence-provider-metadata";

export function mapMarketingIntelligenceLlmPayloadToGraph(input: {
  payload: MarketingIntelligenceLlmPayload;
  miInput: MarketingIntelligenceBrainInput;
  providerMeta: IntelligenceProviderMetadata;
}): MarketingIntelligenceBrainGraph {
  const base = buildMarketingIntelligenceBrainGraph(input.miInput);
  const p = input.payload;
  const createdAt = new Date().toISOString();

  return {
    ...base,
    updatedAt: createdAt,
    audienceIntelligence:
      p.audienceIntelligence.length > 0
        ? p.audienceIntelligence.map((a) => ({
            segment: a.summary.slice(0, 80),
            importance: "medium" as const,
            intentLevel: "medium" as const,
            coreProblem: a.summary,
            primaryMotivation:
              a.classification === "UNKNOWN" ? "Insufficient evidence" : a.summary,
            keyObjections: [],
            trustBuilders: [],
            preferredChannels: input.miInput.selectedChannels ?? [],
            messageSensitivity: "medium",
            evidenceIds: [...a.supportedEvidenceIds],
            confidence: a.classification === "OBSERVED" ? ("medium" as const) : ("low" as const),
          }))
        : base.audienceIntelligence,
    competitiveMarketing:
      p.competitorIntelligence.length > 0
        ? p.competitorIntelligence.map((c) => ({
            competitorId: c.id,
            name: c.id,
            channelPresence: [],
            messagingShare: null,
            campaignThemes: [c.summary],
            positioningCluster: c.summary,
            offerPatterns: [],
            ctaPatterns: [],
            contentThemes: [],
            creativePatterns: [],
            proofUsage: [],
            marketSaturation: "medium" as const,
            visibleWeaknesses: [],
            visibleWhitespace: [],
            confidence: c.classification === "OBSERVED" ? ("medium" as const) : ("low" as const),
            evidenceIds: [...c.supportedEvidenceIds],
          }))
        : base.competitiveMarketing,
    messagingIntelligence: {
      ...base.messagingIntelligence,
      dominantMarketMessages: p.messagingIntelligence.dominantThemes,
      messageDifferentiation: p.messagingIntelligence.differentiationAngles,
      evidenceIds: [...p.messagingIntelligence.supportedEvidenceIds],
      confidence:
        p.messagingIntelligence.classification === "OBSERVED"
          ? ("medium" as const)
          : ("low" as const),
    },
    channelIntelligence:
      p.channelImplications.length > 0
        ? p.channelImplications.map((c) => ({
            channel: c.channel,
            audienceFit: "medium" as const,
            intentFit: "medium" as const,
            objectiveFit: "medium" as const,
            creativeFit: "medium" as const,
            competitiveIntensity: "medium" as const,
            estimatedComplexity: "medium" as const,
            measurementQuality: "medium" as const,
            organicOrPaid: "unknown" as const,
            funnelRole: "awareness",
            confidence: "medium" as const,
            evidenceIds: [],
            risks: [],
            opportunities: [c.implication],
          }))
        : base.channelIntelligence,
    opportunitySignals: p.opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      category: o.classification,
      audience: [],
      channels: input.miInput.selectedChannels ?? [],
      funnelStage: "awareness",
      expectedBusinessImpact: "medium" as const,
      marketingImpact: o.description,
      urgency: "medium" as const,
      effort: "medium" as const,
      confidence: o.classification === "OBSERVED" ? ("medium" as const) : ("low" as const),
      evidenceIds: [...o.supportedEvidenceIds],
      dependencies: [],
      risks: [],
    })),
    riskSignals: p.risks.map((r) => ({
      id: r.id,
      description: r.description,
      category: r.classification,
      likelihood: "medium" as const,
      severity: "medium" as const,
      marketingImpact: r.description,
      businessImpact: r.description,
      affectedChannels: [],
      affectedAudience: [],
      confidence: "medium" as const,
      evidenceIds: [...r.supportedEvidenceIds],
      mitigationConsideration: "Validate before scaling spend.",
    })),
    marketingPriorities: p.campaignRecommendations.map((r) => ({
      id: r.id,
      subject: r.recommendation.slice(0, 80),
      priority: "medium" as const,
      reasoning: r.recommendation,
      businessImpact: "medium" as const,
      evidenceStrength: "medium" as const,
      urgency: "medium" as const,
      confidence: r.classification === "DERIVED" ? ("medium" as const) : ("low" as const),
      effort: "medium" as const,
      dependencies: [...r.reasoningRefs],
    })),
    summary: {
      headline:
        p.positioningIntelligence.summary ||
        `LLM marketing intelligence (${p.opportunities.length} opportunities)`,
      opportunityCount: p.opportunities.length,
      riskCount: p.risks.length,
      priorityCount: p.campaignRecommendations.length,
      insufficientDataFlags: p.audienceIntelligence.some((a) => a.classification === "UNKNOWN")
          ? (["audience_evidence_weak"] as const)
          : base.summary.insufficientDataFlags,
    },
    providerMeta: input.providerMeta,
  };
}

export function attachMarketingIntelligenceProviderMeta(
  graph: MarketingIntelligenceBrainGraph,
  providerMeta: IntelligenceProviderMetadata
): MarketingIntelligenceBrainGraph {
  return { ...graph, providerMeta };
}
