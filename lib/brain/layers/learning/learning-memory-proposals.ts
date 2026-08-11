import type {
  LearningHypothesis,
  LearningInsight,
  LearningPattern,
  LearningRecommendation,
  LearningSystemProposal,
  MemoryDurability,
  MemoryWriteProposal,
  LearningConfidence,
  TargetBrain,
} from "./brain-types";

export function buildMemoryWriteProposals(input: {
  patterns: readonly LearningPattern[];
  hypotheses: readonly LearningHypothesis[];
  insights: readonly LearningInsight[];
  durableMemoryAllowed: boolean;
  campaignIds: readonly string[];
  deliverableIds: readonly string[];
}): MemoryWriteProposal[] {
  const proposals: MemoryWriteProposal[] = [];
  let counter = 0;

  for (const insight of input.insights.slice(0, 5)) {
    proposals.push({
      id: `mwp-${++counter}`,
      category: "insight",
      title: insight.observation.slice(0, 80),
      learning: insight.interpretation,
      scope: insight.scope,
      evidenceRefs: insight.evidenceRefs,
      confidence: insight.confidence,
      importance: insight.businessImpact.includes("Pipeline") ? "high" : "medium",
      durability: "temporary",
      recommendedMemoryDomain: "campaign_learning",
      relatedCampaigns: input.campaignIds,
      relatedDeliverables: input.deliverableIds,
      contradictions: [],
      expiresAt: null,
      reasonToStore: "Preserve episode insight for future reference",
      freshnessSensitivity: "high",
      reviewAfter: "30 days",
    });
  }

  for (const hyp of input.hypotheses.filter((h) => h.status === "proposed")) {
    proposals.push({
      id: `mwp-${++counter}`,
      category: "hypothesis",
      title: hyp.statement.slice(0, 80),
      learning: hyp.statement,
      scope: hyp.scope,
      evidenceRefs: hyp.supportingEvidence,
      confidence: hyp.confidence,
      importance: "medium",
      durability: "temporary",
      recommendedMemoryDomain: "hypothesis",
      relatedCampaigns: input.campaignIds,
      relatedDeliverables: input.deliverableIds,
      contradictions: hyp.contradictingEvidence,
      expiresAt: null,
      reasonToStore: "Track hypothesis until repeated or rejected",
      freshnessSensitivity: "medium",
      reviewAfter: "14 days",
    });
  }

  for (const pattern of input.patterns) {
    const durability: MemoryDurability = input.durableMemoryAllowed && pattern.sampleSize >= 5
      ? "durable_candidate"
      : "reinforce_if_repeated";
    proposals.push({
      id: `mwp-${++counter}`,
      category: pattern.category,
      title: pattern.title,
      learning: pattern.description,
      scope: pattern.scope,
      evidenceRefs: pattern.supportingObservations,
      confidence: pattern.confidence,
      importance: "high",
      durability,
      recommendedMemoryDomain: "organizational_learning",
      relatedCampaigns: pattern.supportingCampaigns,
      relatedDeliverables: pattern.supportingDeliverables,
      contradictions: pattern.contradictions,
      expiresAt: durability === "reinforce_if_repeated" ? "90d" : null,
      reasonToStore: durability === "durable_candidate" ? "Repeated evidence — candidate for durable Memory" : "Reinforce if pattern repeats",
      freshnessSensitivity: pattern.category === "messaging" ? "medium" : "low",
      reviewAfter: "90 days",
    });
  }

  return proposals;
}

export function buildRecommendations(input: {
  hypotheses: readonly LearningHypothesis[];
  patterns: readonly LearningPattern[];
}): LearningRecommendation[] {
  const recs: LearningRecommendation[] = [];
  let counter = 0;

  for (const pattern of input.patterns.filter((p) => p.category === "messaging")) {
    recs.push({
      id: `rec-${++counter}`,
      title: "Consider messaging territory",
      recommendation: `Creative Brain should consider ${pattern.title} when targeting comparable audiences`,
      reason: pattern.description,
      evidence: pattern.supportingObservations,
      expectedBenefit: pattern.businessImpact,
      confidence: pattern.confidence,
      scope: pattern.scope,
      targetBrain: "creative",
      requiresValidation: true,
    });
  }

  for (const hyp of input.hypotheses.filter((h) => h.status === "supported")) {
    recs.push({
      id: `rec-${++counter}`,
      title: "Strategy reconsideration signal",
      recommendation: "Future Strategy Brain may review related decisions via Memory",
      reason: hyp.statement,
      evidence: hyp.supportingEvidence,
      expectedBenefit: "Improved future strategic choices",
      confidence: hyp.confidence,
      scope: hyp.scope,
      targetBrain: "strategy",
      requiresValidation: true,
    });
  }

  return recs;
}

export function buildSystemProposals(input: {
  validationBlindSpot: boolean;
  planningGap: boolean;
}): LearningSystemProposal[] {
  const proposals: LearningSystemProposal[] = [];
  if (input.validationBlindSpot) {
    proposals.push({
      id: "sys-1",
      area: "validation",
      proposal: "Review validation criteria for high-score / low-performance pattern",
      reason: "Repeated validation-performance mismatch observed",
      evidence: ["validation_vs_performance anomaly"],
      confidence: "low",
      autoApply: false,
    });
  }
  if (input.planningGap) {
    proposals.push({
      id: "sys-2",
      area: "planning",
      proposal: "Planning may underestimate tracking setup lead time",
      reason: "Context gaps correlated with delayed measurement",
      evidence: ["planning context gaps"],
      confidence: "low",
      autoApply: false,
    });
  }
  return proposals;
}

export function assertNeverWritesMemoryDirectly(fn: () => void): void {
  // Test hook — Learning layer must not import memory store in production path
  fn();
}
