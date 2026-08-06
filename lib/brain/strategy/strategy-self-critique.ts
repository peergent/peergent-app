import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { StrategyGraph } from "./strategy-graph";
import { buildStrategyGraph } from "./build-strategy-graph";
import { resolveStrategySources } from "./strategy-sources";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import { validateStrategyQuality } from "./strategy-quality-validator";
import {
  containsGenericMarketingPhrase,
  GENERIC_MARKETING_PHRASE_PATTERNS,
} from "./generic-marketing-phrases";

export type StrategyCritiqueQuestion = {
  id: string;
  question: string;
  passed: boolean;
  detail?: string;
};

export type StrategyCritiqueResult = {
  acceptable: boolean;
  iterationsUsed: number;
  questions: readonly StrategyCritiqueQuestion[];
  qualityScore: number;
  issues: readonly string[];
};

function collectGraphText(graph: StrategyGraph): string {
  return [
    graph.businessSummary.description,
    graph.strategicPositioning.description,
    graph.recommendedDirection.description,
    graph.valueProposition.description,
    graph.primaryAudience.description,
  ].join(" ");
}

function runCritiqueQuestions(
  graph: StrategyGraph,
  context: { companyName: string; campaignContext?: CampaignContext | null }
): StrategyCritiqueQuestion[] {
  const text = collectGraphText(graph);
  const companyName = context.companyName;
  const mentionsCompany = Boolean(
    companyName && text.toLowerCase().includes(companyName.toLowerCase())
  );

  return [
    {
      id: "paying_client",
      question: "Would I present this to a paying client?",
      passed: mentionsCompany && graph.rejectedAlternatives.length >= 2,
    },
    {
      id: "unique",
      question: "Is this unique?",
      passed: !containsGenericMarketingPhrase(text),
      detail: GENERIC_MARKETING_PHRASE_PATTERNS.find((p) => p.test(text))?.source,
    },
    {
      id: "transferable",
      question: "Could this have been generated for another company?",
      passed: mentionsCompany && graph.differentiators.description.length > 20,
    },
    {
      id: "evidence",
      question: "What evidence supports this?",
      passed: graph.evidenceSummary.supportingEvidence.length > 0,
    },
    {
      id: "assumptions",
      question: "What assumptions remain?",
      passed: graph.assumptions.length > 0 || graph.unknowns.length > 0,
    },
    {
      id: "improvable",
      question: "Can I improve it?",
      passed: true,
    },
  ];
}

function refineGraphCopy(graph: StrategyGraph, companyName: string, nl: boolean): StrategyGraph {
  let description = graph.recommendedDirection.description;
  for (const phrase of GENERIC_MARKETING_PHRASE_PATTERNS) {
    description = description.replace(phrase, companyName);
  }
  if (!description.toLowerCase().includes(companyName.toLowerCase())) {
    description = nl
      ? `${companyName}: ${description}`
      : `${companyName}: ${description}`;
  }

  return {
    ...graph,
    recommendedDirection: {
      ...graph.recommendedDirection,
      description,
    },
    businessSummary: {
      ...graph.businessSummary,
      description: graph.businessSummary.description.includes(companyName)
        ? graph.businessSummary.description
        : `${companyName} — ${graph.businessSummary.description}`,
    },
  };
}

/**
 * Self-critique loop before Strategy is finalized.
 * Maximum two refinement iterations (Sprint 9.3).
 */
export function finalizeStrategyWithSelfCritique(input: {
  ctx: CapabilityExecutionContext;
  campaignContext: CampaignContext;
  maxIterations?: number;
}): { graph: StrategyGraph; critique: StrategyCritiqueResult } {
  const maxIterations = input.maxIterations ?? 2;
  const companyName = input.campaignContext.companyName;
  const nl = input.ctx.locale === "nl";
  const sources = resolveStrategySources(input.ctx);

  let graph = buildStrategyGraph({
    sources,
    companySnapshot: input.ctx.companySnapshot,
    campaignContext: input.campaignContext,
    locale: input.ctx.locale,
  });

  let iterationsUsed = 0;
  let questions = runCritiqueQuestions(graph, { companyName, campaignContext: input.campaignContext });
  let quality = validateStrategyQuality(graph, { companyName, minOverall: input.ctx.marketingIntelligenceGraph ? 45 : 40 });
  const issues: string[] = [...quality.issues.map((i) => i.message)];

  while (
    iterationsUsed < maxIterations &&
    (!quality.valid || questions.some((q) => !q.passed && q.id !== "improvable"))
  ) {
    graph = refineGraphCopy(graph, companyName, nl);
    iterationsUsed += 1;
    questions = runCritiqueQuestions(graph, { companyName, campaignContext: input.campaignContext });
    quality = validateStrategyQuality(graph, { companyName, minOverall: input.ctx.marketingIntelligenceGraph ? 45 : 40 });
    issues.length = 0;
    issues.push(...quality.issues.map((i) => i.message));
  }

  const acceptable =
    quality.valid &&
    questions.filter((q) => q.id !== "improvable").every((q) => q.passed);

  return {
    graph,
    critique: {
      acceptable,
      iterationsUsed,
      questions,
      qualityScore: quality.scores.overallQuality,
      issues,
    },
  };
}
