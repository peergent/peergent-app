/**
 * Marketing Intelligence — priority ranking.
 * Priorities are NOT strategic decisions.
 */

import type {
  ChannelIntelligence,
  MarketingOpportunity,
  MarketingPrioritySignal,
  MarketingRisk,
} from "./brain-types";

let priorityCounter = 0;

export function resetMarketingPriorityCounter(): void {
  priorityCounter = 0;
}

function scorePriority(input: {
  businessImpact: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
}): "high" | "medium" | "low" {
  let score = 0;
  if (input.businessImpact === "critical" || input.businessImpact === "high") score += 2;
  if (input.confidence === "high") score += 2;
  else if (input.confidence === "medium") score += 1;
  if (input.urgency === "high") score += 2;
  if (input.effort === "low") score += 1;
  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function buildMarketingPriorities(input: {
  channels: readonly ChannelIntelligence[];
  opportunities: readonly MarketingOpportunity[];
  risks: readonly MarketingRisk[];
}): MarketingPrioritySignal[] {
  const priorities: MarketingPrioritySignal[] = [];

  for (const channel of input.channels.filter((c) => c.intentFit === "high" || c.intentFit === "medium")) {
    priorityCounter += 1;
    priorities.push({
      id: `mi-pri-${priorityCounter}`,
      subject: `${channel.channel} intent fit`,
      priority: scorePriority({
        businessImpact: "medium",
        confidence: channel.confidence,
        urgency: channel.intentFit,
        effort: channel.estimatedComplexity,
      }),
      reasoning: `${channel.channel} has ${channel.intentFit} intent fit and ${channel.measurementQuality} measurement quality.`,
      businessImpact: "medium",
      evidenceStrength: channel.confidence,
      urgency: channel.intentFit,
      confidence: channel.confidence,
      effort: channel.estimatedComplexity,
      dependencies: [],
    });
  }

  for (const opp of input.opportunities.slice(0, 5)) {
    priorityCounter += 1;
    priorities.push({
      id: `mi-pri-${priorityCounter}`,
      subject: opp.title,
      priority: opp.urgency,
      reasoning: opp.marketingImpact,
      businessImpact: opp.expectedBusinessImpact,
      evidenceStrength: opp.confidence,
      urgency: opp.urgency,
      confidence: opp.confidence,
      effort: opp.effort,
      dependencies: [...opp.dependencies],
    });
  }

  for (const risk of input.risks.filter((r) => r.severity === "high").slice(0, 3)) {
    priorityCounter += 1;
    priorities.push({
      id: `mi-pri-${priorityCounter}`,
      subject: risk.description.slice(0, 80),
      priority: "high",
      reasoning: risk.mitigationConsideration,
      businessImpact: risk.severity,
      evidenceStrength: risk.confidence,
      urgency: risk.likelihood,
      confidence: risk.confidence,
      effort: "medium",
      dependencies: [],
    });
  }

  if (priorities.length === 0 && input.channels.length > 0) {
    const channel = input.channels[0]!;
    priorityCounter += 1;
    priorities.push({
      id: `mi-pri-${priorityCounter}`,
      subject: `${channel.channel} channel signal`,
      priority: channel.confidence === "high" ? "high" : "medium",
      reasoning: channel.funnelRole,
      businessImpact: "medium",
      evidenceStrength: channel.confidence,
      urgency: channel.intentFit,
      confidence: channel.confidence,
      effort: channel.estimatedComplexity,
      dependencies: [],
    });
  }

  if (priorities.length === 0 && input.opportunities.length > 0) {
    const opp = input.opportunities[0]!;
    priorityCounter += 1;
    priorities.push({
      id: `mi-pri-${priorityCounter}`,
      subject: opp.title,
      priority: opp.urgency,
      reasoning: opp.marketingImpact,
      businessImpact: opp.expectedBusinessImpact,
      evidenceStrength: opp.confidence,
      urgency: opp.urgency,
      confidence: opp.confidence,
      effort: opp.effort,
      dependencies: [...opp.dependencies],
    });
  }

  return priorities.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return order[b.priority] - order[a.priority];
  });
}

export function buildStrategyInputs(input: {
  audience: readonly { segment: string; confidence: string }[];
  channels: readonly ChannelIntelligence[];
  messaging: { saturatedClaims: readonly string[]; messageRisks: readonly string[] };
  market: readonly { signal: string }[];
  competitive: readonly { name: string }[];
  funnelGaps: readonly string[];
  opportunities: readonly MarketingOpportunity[];
  risks: readonly MarketingRisk[];
  benchmarks: readonly import("./brain-types").MarketingBenchmark[];
  constraints: readonly string[];
  unknowns: readonly string[];
  confidence: "low" | "medium" | "high";
}): import("./brain-types").MarketingStrategyInput {
  return {
    topAudienceSignals: input.audience.map((a) => a.segment).slice(0, 5),
    topChannelSignals: [...input.channels]
      .sort((a, b) => {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.intentFit] - order[a.intentFit];
      })
      .map((c) => `${c.channel}: ${c.intentFit} intent fit, ${c.measurementQuality} measurement`)
      .slice(0, 5),
    topMessagingSignals: [
      ...input.messaging.saturatedClaims.map((c) => `Saturated: ${c}`),
      ...input.messaging.messageRisks.slice(0, 3),
    ],
    topMarketSignals: input.market.map((m) => m.signal).slice(0, 5),
    topCompetitiveSignals: input.competitive.map((c) => c.name).slice(0, 5),
    topFunnelGaps: [...input.funnelGaps].slice(0, 5),
    topOpportunities: input.opportunities.map((o) => o.title).slice(0, 5),
    topRisks: input.risks.map((r) => r.description).slice(0, 5),
    benchmarkContext: [...input.benchmarks],
    constraints: [...input.constraints],
    unknowns: [...input.unknowns],
    confidence: input.confidence,
  };
}
