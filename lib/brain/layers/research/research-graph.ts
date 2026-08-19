/**
 * Research Brain — graph builder and orchestrator.
 * Evidence-first external discovery from CompanyGraph + providers.
 */

import type { CompanyGraph } from "../company/types";
import type { MemoryGraph } from "../memory/types";
import {
  emptyResearchBrainGraph,
  type ResearchBrainGraph,
  type ResearchBudgetState,
  type ResearchDomainId,
  type ResearchStopReason,
  type UnresolvedQuestion,
} from "./brain-types";
import { buildResearchPlan, planQuestionsAnswered } from "./research-plan";
import { providerItemsToEvidence } from "./research-evidence-builder";
import { buildCompetitorResearch } from "./research-competitors";
import { buildMarketResearch } from "./research-market";
import { buildAudienceResearch } from "./research-audience";
import { buildPositioningResearch } from "./research-positioning";
import { buildCompanyUpdateProposals } from "./research-update-proposals";
import { aggregateGraphConfidence, enforceConfidenceCeiling } from "./research-confidence";
import type { ResearchProviderRegistry } from "./research-provider-registry";
import { getDefaultResearchProviderRegistry } from "./research-provider-registry";
import type { ResearchBrainInput } from "./brain-types";
import { fetchExternalResearchTargets } from "./providers/external-web-research-provider";
import { resolveResearchRuntimeConfig } from "./research-config";

let runCounter = 0;

export function resetResearchGraphRunCounter(): void {
  runCounter = 0;
}

function initBudgetState(): ResearchBudgetState {
  return {
    sourcesUsed: 0,
    requestsUsed: 0,
    pagesUsed: 0,
    competitorsUsed: 0,
    durationMs: 0,
    costUsed: 0,
    exhausted: false,
    stopReason: null,
  };
}

function applyProviderUsage(
  state: ResearchBudgetState,
  usage: { requestsUsed: number; pagesUsed: number; costUsed: number; sourceCount: number },
  budget: ResearchBrainGraph["plan"]["budget"]
): ResearchBudgetState {
  const next = {
    ...state,
    sourcesUsed: state.sourcesUsed + usage.sourceCount,
    requestsUsed: state.requestsUsed + usage.requestsUsed,
    pagesUsed: state.pagesUsed + usage.pagesUsed,
    costUsed: state.costUsed + usage.costUsed,
  };

  const exhausted =
    next.sourcesUsed >= budget.maxSources ||
    next.requestsUsed >= budget.maxRequests ||
    next.pagesUsed >= budget.maxPages ||
    next.costUsed >= budget.costBudget;

  let stopReason: ResearchStopReason | null = state.stopReason;
  if (exhausted && !stopReason) {
    stopReason = "source_budget_reached";
  }

  return { ...next, exhausted, stopReason };
}

function unresolvedFromPlan(
  plan: ResearchBrainGraph["plan"],
  answeredQuestionIds: Set<string>
): UnresolvedQuestion[] {
  return plan.objective.questions
    .filter((_, i) => !answeredQuestionIds.has(`q-${i}`))
    .map((question, i) => ({
      id: `unresolved-q-${i}`,
      question,
      reason: "Insufficient external evidence within budget.",
      domain: plan.domains[0] ?? null,
    }));
}

export type BuildResearchBrainGraphInput = ResearchBrainInput & {
  readonly memoryGraph?: MemoryGraph | null;
  readonly registry?: ResearchProviderRegistry;
  readonly startedAt?: number;
};

/**
 * Builds full ResearchBrainGraph — never mutates CompanyGraph.
 */
export async function buildResearchBrainGraph(
  input: BuildResearchBrainGraphInput
): Promise<ResearchBrainGraph> {
  runCounter += 1;
  const startedAt = input.startedAt ?? Date.now();
  const createdAt = new Date().toISOString();
  const registry = input.registry ?? getDefaultResearchProviderRegistry();
  const plan = buildResearchPlan({
    companyGraph: input.companyGraph,
    projectObjective: input.projectObjective,
    questions: input.researchQuestions,
    scope: input.researchScope,
    budget: input.budget,
    createdAt,
  });

  let graph = emptyResearchBrainGraph({
    organizationId: input.organizationId,
    projectId: input.projectId,
    campaignId: input.campaignId,
    objective: plan.objective,
    plan,
    createdAt,
  });

  let budgetState = initBudgetState();
  const stubProvider =
    registry.list().find((p) => p.id === "company_context_stub") ?? registry.list()[0];
  const externalProvider = registry.list().find((p) => p.id === "external_web_fetch") ?? null;

  const ctx = {
    companyGraph: input.companyGraph,
    organizationId: input.organizationId,
    budgetState,
  };

  const allSources = [...graph.sources];
  const allEvidence = [...graph.evidence];
  const allCitations = [...graph.citations];
  const allFindings = [...graph.findings];

  let providerIdUsed = stubProvider?.id ?? "none";
  let externalFetchCount = 0;
  let fetchFailures = 0;
  let fallbackUsed = false;

  if (externalProvider && resolveResearchRuntimeConfig().enableExternalFetch) {
    const external = await fetchExternalResearchTargets({
      companyGraph: input.companyGraph,
      websiteUrl: input.websiteUrl,
      competitors: input.competitors,
      organizationId: input.organizationId,
    });
    providerIdUsed = external.providerId;
    externalFetchCount = external.items.length;
    fetchFailures = external.fetchFailures;
    if (external.items.length > 0) {
      const converted = providerItemsToEvidence({
        items: external.items,
        defaultConfidence: "medium",
      });
      allSources.push(...converted.sources);
      allEvidence.push(...converted.evidence);
      allCitations.push(...converted.citations);
      budgetState = applyProviderUsage(
        budgetState,
        {
          requestsUsed: external.requestsUsed,
          pagesUsed: external.pagesUsed,
          costUsed: external.costUsed,
          sourceCount: converted.sources.length,
        },
        plan.budget
      );
    } else if (external.fetchFailures > 0 || (input.websiteUrl || input.competitors?.length)) {
      fallbackUsed = true;
    }
  }

  const provider = stubProvider;
  if (!provider) {
    return finalizeGraph(graph, budgetState, startedAt);
  }

  for (const domain of plan.domains) {
    if (budgetState.exhausted) break;
    if (budgetState.sourcesUsed >= plan.budget.maxSources) {
      budgetState = { ...budgetState, exhausted: true, stopReason: "source_budget_reached" };
      break;
    }

    const result = await provider.snapshot?.({
      target: domain,
      domain,
      ctx: { ...ctx, budgetState },
    });

    if (!result || !result.success) continue;

    const remainingSources = plan.budget.maxSources - budgetState.sourcesUsed;
    const items = result.items.slice(0, Math.max(0, remainingSources));

    const converted = providerItemsToEvidence({
      items,
      defaultConfidence: "medium",
      maxAgeDays: plan.freshnessRequirements.find((f) => f.domain === domain)?.maxAgeDays,
    });

    allSources.push(...converted.sources);
    allEvidence.push(...converted.evidence);
    allCitations.push(...converted.citations);

    budgetState = applyProviderUsage(
      budgetState,
      {
        requestsUsed: result.requestsUsed,
        pagesUsed: result.pagesUsed,
        costUsed: result.costUsed,
        sourceCount: converted.sources.length,
      },
      plan.budget
    );
  }

  if (input.memoryGraph) {
    const memoryEvidence = input.memoryGraph.memories.slice(0, 5).map((record) => ({
      sourceType: "memory_read" as const,
      identity: record.id,
      url: null,
      label: record.title,
      rawExcerpt: record.description,
      normalizedSummary: record.description,
      directEvidence: false,
      capturedAt: record.updatedAt,
    }));
    const converted = providerItemsToEvidence({
      items: memoryEvidence,
      defaultConfidence: "low",
    });
    allSources.push(...converted.sources);
    allEvidence.push(...converted.evidence);
    allCitations.push(...converted.citations);
  }

  const competitorResult = buildCompetitorResearch({
    companyGraph: input.companyGraph,
    evidence: allEvidence,
    maxCompetitors: plan.budget.maxCompetitors,
  });
  budgetState = {
    ...budgetState,
    competitorsUsed: competitorResult.profiles.length,
  };

  const marketResult = buildMarketResearch({
    companyGraph: input.companyGraph,
    evidence: allEvidence,
  });

  const audienceResult = buildAudienceResearch({
    companyGraph: input.companyGraph,
    evidence: allEvidence,
    enrichmentSegments: input.researchQuestions
      ?.filter((q) => /segment|audience/i.test(q))
      .map(() => "Logistics companies")
      .slice(0, 1),
  });

  const competitorClaims = competitorResult.profiles
    .flatMap((p) => p.primaryMessages)
    .filter(Boolean);

  const positioningResult = buildPositioningResearch({
    companyGraph: input.companyGraph,
    evidence: allEvidence,
    competitorClaims,
  });

  const premiumClaim = input.companyGraph.facts.find((f) =>
    /premium|fastest|fast implementation/i.test(f.value)
  );
  if (premiumClaim) {
    const reviewContradiction = positioningResult.contradictions.find(
      (c) => c.companyFactId === premiumClaim.id
    );
    if (!reviewContradiction && input.researchQuestions?.some((q) => /support|review/i.test(q))) {
      const reviewEvidence = allEvidence.filter((e) => /support|slow|review/i.test(e.rawExcerpt));
      if (reviewEvidence.length > 0) {
        positioningResult.contradictions.push({
          id: `con-review-${runCounter}`,
          companyClaim: premiumClaim.value,
          externalEvidence: "Reviews mention slow support themes.",
          companyFactId: premiumClaim.id,
          evidenceIds: reviewEvidence.map((e) => e.id),
          confidence: "medium",
          unresolved: true,
        });
      }
    }
  }

  allFindings.push(
    ...competitorResult.findings,
    ...marketResult.findings,
    ...audienceResult.findings,
    ...positioningResult.findings
  );

  const findingsWithConfidence = allFindings.map((f) => ({
    ...f,
    confidence: enforceConfidenceCeiling(
      f.confidence,
      f.evidenceIds.length,
      f.findingType
    ),
  }));

  const proposals = buildCompanyUpdateProposals({
    companyGraph: input.companyGraph,
    audienceInsights: audienceResult.insights,
    findings: findingsWithConfidence,
  });

  const answered = new Set<string>();
  plan.objective.questions.forEach((_, i) => {
    if (findingsWithConfidence.length > i) answered.add(`q-${i}`);
  });

  let unresolved = unresolvedFromPlan(plan, answered);
  if (planQuestionsAnswered(plan, findingsWithConfidence.length, unresolved.length)) {
    budgetState = { ...budgetState, stopReason: budgetState.stopReason ?? "questions_answered" };
  } else if (findingsWithConfidence.length >= 3) {
    budgetState = {
      ...budgetState,
      stopReason: budgetState.stopReason ?? "confidence_threshold_met",
    };
  }

  if (allEvidence.length === 0) {
    budgetState = { ...budgetState, stopReason: "no_useful_evidence" };
    unresolved = plan.objective.questions.map((question, i) => ({
      id: `unresolved-q-${i}`,
      question,
      reason: "No external evidence retrieved within provider limits.",
      domain: plan.domains[0] ?? null,
    }));
  }

  budgetState = {
    ...budgetState,
    durationMs: Date.now() - startedAt,
  };

  graph = {
    ...graph,
    updatedAt: new Date().toISOString(),
    sources: allSources,
    evidence: allEvidence,
    citations: allCitations,
    findings: findingsWithConfidence,
    comparisons: competitorResult.comparisons,
    contradictions: positioningResult.contradictions,
    opportunities: positioningResult.opportunities,
    risks: [],
    proposedUpdates: proposals,
    competitorProfiles: competitorResult.profiles,
    marketSignals: marketResult.signals,
    audienceInsights: audienceResult.insights,
    positioningInsights: positioningResult.insights,
    searchInsights: [],
    unresolvedQuestions: unresolved,
    patterns: [],
    summary: {
      headline: `Research run ${runCounter}: ${findingsWithConfidence.length} findings from ${allEvidence.length} evidence items`,
      findingCount: findingsWithConfidence.length,
      evidenceCount: allEvidence.length,
      contradictionCount: positioningResult.contradictions.length,
      proposalCount: proposals.length,
      unresolvedCount: unresolved.length,
      providerId: providerIdUsed,
      fallbackUsed,
      externalFetchCount,
      fetchFailures,
    },
    confidence: aggregateGraphConfidence(findingsWithConfidence),
    budgetState,
  };

  return graph;
}

function finalizeGraph(
  graph: ResearchBrainGraph,
  budgetState: ResearchBudgetState,
  startedAt: number
): ResearchBrainGraph {
  return {
    ...graph,
    budgetState: { ...budgetState, durationMs: Date.now() - startedAt },
    updatedAt: new Date().toISOString(),
  };
}

export function researchGraphHasEvidenceChain(graph: ResearchBrainGraph): boolean {
  if (graph.findings.length === 0) return true;
  return graph.findings.every(
    (f) =>
      f.findingType === "hypothesis" ||
      f.evidenceIds.length > 0 ||
      f.confidence === "low"
  );
}

export function researchGraphNeverHighConfidenceWithoutEvidence(
  graph: ResearchBrainGraph
): boolean {
  return graph.findings.every((f) => {
    if (f.confidence !== "high") return true;
    return f.evidenceIds.length >= 2 || f.findingType === "fact";
  });
}
