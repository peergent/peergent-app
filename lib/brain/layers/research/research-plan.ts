/**
 * Research Brain — plan builder.
 * Question-driven research with bounded scope and stop conditions.
 */

import type { CompanyGraph } from "../company/types";
import {
  DEFAULT_RESEARCH_BUDGET,
  type ResearchBudget,
  type ResearchDomainId,
  type ResearchObjective,
  type ResearchPlan,
  type ResearchSourceType,
} from "./brain-types";

const DEFAULT_DOMAINS: ResearchDomainId[] = [
  "company_website",
  "competitor",
  "market",
  "audience",
  "positioning",
];

const DOMAIN_SOURCES: Partial<Record<ResearchDomainId, ResearchSourceType[]>> = {
  company_website: ["company_website", "company_graph"],
  competitor: ["competitor_website", "company_graph"],
  market: ["market_report", "company_graph"],
  audience: ["review_platform", "company_graph"],
  positioning: ["company_website", "competitor_website", "company_graph"],
  search_seo: ["search_result"],
  reputation_review: ["review_platform"],
};

let planCounter = 0;

export function resetResearchPlanCounter(): void {
  planCounter = 0;
}

export function buildResearchPlan(input: {
  companyGraph: CompanyGraph;
  projectObjective?: string;
  questions?: readonly string[];
  scope?: readonly ResearchDomainId[];
  budget?: Partial<ResearchBudget>;
  createdAt?: string;
}): ResearchPlan {
  planCounter += 1;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const budget: ResearchBudget = { ...DEFAULT_RESEARCH_BUDGET, ...input.budget };

  const defaultQuestions = [
    "What external signals help validate our positioning?",
    "Which competitors are visible from known company data?",
    "Which audience segments may need enrichment?",
  ];

  const questions = input.questions?.length ? input.questions : defaultQuestions;
  const domains = input.scope?.length ? input.scope : DEFAULT_DOMAINS;

  const knownFacts = input.companyGraph.facts.slice(0, 12).map((f) => `${f.title}: ${f.value}`);
  const unknowns = input.companyGraph.unknownDomains.map((d) => `Unknown domain: ${d}`);

  const sourcesNeeded = [
    ...new Set(
      domains.flatMap((d) => DOMAIN_SOURCES[d] ?? (["company_graph"] as ResearchSourceType[]))
    ),
  ] as ResearchSourceType[];

  const objective: ResearchObjective = {
    id: `obj-${planCounter}`,
    projectObjective:
      input.projectObjective ??
      "Discover external evidence to inform downstream reasoning without overwriting company truth.",
    scope: domains,
    questions,
    priority: "high",
  };

  return {
    id: `plan-${planCounter}`,
    objective,
    domains,
    sourcesNeeded,
    knownFacts,
    unknowns,
    budget,
    stopConditions: [
      "questions_answered",
      "confidence_threshold_met",
      "source_budget_reached",
      "no_useful_evidence",
    ],
    freshnessRequirements: domains.map((domain) => ({
      domain,
      maxAgeDays: domain === "trend" || domain === "search_seo" ? 30 : 90,
    })),
    priority: "high",
    createdAt,
  };
}

export function planQuestionsAnswered(
  plan: ResearchPlan,
  findingsCount: number,
  unresolvedCount: number
): boolean {
  const minFindingsPerQuestion = 1;
  const required = plan.objective.questions.length * minFindingsPerQuestion;
  return findingsCount >= required && unresolvedCount === 0;
}
