import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { Decision } from "../decision/decision-types";
import type { PlanningGraph } from "../layers/planning/types";
import {
  presentExecutionPlanSummary,
  presentExecutionPlanBriefingSections,
  presentCustomerInputSummary,
  type ExecutionPlanBriefingSections,
} from "../layers/planning/planning-presenter";
import {
  presentTopDecisions,
  type DecisionPresentationSummary,
} from "../decision/decision-presentation";

export type ExecutiveBriefingSection = {
  id: string;
  title: string;
  summary: string;
  /** Drill-down target — workflow step, decision id, planning id, or evidence scope. */
  drillDownStepId?: string;
  drillDownDecisionId?: string;
  drillDownPlanningDecisionId?: string;
  drillDownLabel?: string;
};

export type ExecutiveCampaignBriefing = {
  title: string;
  preparedAt: string;
  companyName: string;
  sections: readonly ExecutiveBriefingSection[];
  topDecisions: readonly DecisionPresentationSummary[];
  decisions: readonly Decision[];
  recommendationSummary: string;
  requiredDecisions: readonly string[];
  /** Sprint 11.1 — structured execution plan for progressive disclosure. */
  executionPlan?: ExecutionPlanBriefingSections;
  /** Sprint 11.1 — full graph for drill-down only (never shown raw to customers). */
  planningGraph?: PlanningGraph;
};

function resolveDecisions(strategy: BrainStructuredOutput | undefined): Decision[] {
  if (strategy?.decisionRecords?.length) {
    return [...strategy.decisionRecords];
  }
  return [];
}

function finding(output: BrainStructuredOutput | undefined, label: string): string {
  return output?.findings.find((f) => f.label.toLowerCase() === label.toLowerCase())?.value ?? "";
}

function formatTopDecisionsSummary(decisions: readonly DecisionPresentationSummary[]): string {
  return decisions
    .slice(0, 4)
    .map((d) => `${d.title}: ${d.recommendation}`)
    .join("\n\n");
}

function aggregateBusinessImpact(decisions: readonly Decision[], nl: boolean): string {
  const impacts = decisions
    .filter((d) => d.category === "strategy_direction" || d.category === "channel_choice")
    .map((d) => d.businessImpact)
    .filter(Boolean);
  if (impacts.length === 0) {
    return nl
      ? "Meetbare campagneresultaten gericht op het campagnedoel."
      : "Measurable campaign results aligned to the campaign goal.";
  }
  return impacts.join(" · ");
}

function aggregateRisksAndUnknowns(
  decisions: readonly Decision[],
  planningGraph: PlanningGraph | null | undefined,
  nl: boolean
): string {
  const decisionRisks = decisions.flatMap((d) => d.knownRisks).filter(Boolean);
  const planningRisks = planningGraph?.risks.map((r) => `${r.title}: ${r.mitigation}`) ?? [];
  const unknowns = decisions.flatMap((d) => d.unknowns).filter(Boolean);
  const parts = [...new Set([...planningRisks, ...decisionRisks])].slice(0, 3);
  if (unknowns.length) {
    parts.push(
      nl ? `Open vragen: ${[...new Set(unknowns)].slice(0, 2).join(", ")}` : `Open questions: ${[...new Set(unknowns)].slice(0, 2).join(", ")}`
    );
  }
  if (parts.length === 0) {
    return nl ? "Geen kritieke risico's geïdentificeerd." : "No critical risks identified.";
  }
  return parts.join(" · ");
}

function aggregateEvidenceCount(decisions: readonly Decision[]): number {
  return decisions.reduce((sum, d) => sum + d.supportingEvidence.length, 0);
}


/** Decision-driven executive briefing — Sprint 10.2 + Execution Plan (Sprint 11.1). */
export function buildExecutiveCampaignBriefing(input: {
  campaignContext: CampaignContext;
  strategy?: BrainStructuredOutput;
  channels?: BrainStructuredOutput;
  creative?: BrainStructuredOutput;
  planningGraph?: PlanningGraph | null;
  locale?: "nl" | "en";
}): ExecutiveCampaignBriefing {
  const nl = input.locale === "nl";
  const name = input.campaignContext.companyName;
  const strategy = input.strategy;
  const decisions = resolveDecisions(strategy);
  const topDecisions = presentTopDecisions(
    {
      version: "1.0.0",
      organizationId: "",
      createdAt: strategy?.generatedAt ?? new Date().toISOString(),
      decisions,
    },
    nl
  );

  const primaryDecision = decisions.find((d) => d.category === "strategy_direction");
  const campaignObjective =
    finding(strategy, nl ? "Campagnedoel" : "Campaign objective") || primaryDecision?.summary;
  const kpi = finding(strategy, nl ? "KPI-kader" : "KPI framework") || primaryDecision?.expectedOutcome;
  const evidenceCount = aggregateEvidenceCount(decisions);

  const executionPlanSections = input.planningGraph
    ? presentExecutionPlanBriefingSections({ graph: input.planningGraph, locale: input.locale })
    : undefined;

  const customerNeeds =
    executionPlanSections?.whatEmmaNeeds ??
    (input.planningGraph ? presentCustomerInputSummary(input.planningGraph, input.locale) : "");

  const sections: ExecutiveBriefingSection[] = [
    {
      id: "executive-summary",
      title: nl ? "Executive summary" : "Executive summary",
      summary: nl
        ? `${name} — ${campaignObjective || input.campaignContext.description}. Emma heeft research, intelligence, strategie, beslissingen en het executieplan afgerond. Dit is je ene review.`
        : `${name} — ${campaignObjective || input.campaignContext.description}. Emma completed research, intelligence, strategy, decisions, and the execution plan. This is your single review.`,
    },
    {
      id: "top-decisions",
      title: nl ? "Belangrijkste beslissingen" : "Top decisions",
      summary: formatTopDecisionsSummary(topDecisions) || (nl ? "Zie beslissingen hieronder." : "See decisions below."),
      drillDownDecisionId: topDecisions[0]?.id,
      drillDownLabel: nl ? "Open beslissing" : "Open decision",
    },
    {
      id: "business-impact",
      title: nl ? "Business impact" : "Business impact",
      summary: aggregateBusinessImpact(decisions, nl),
      drillDownDecisionId: primaryDecision?.id,
      drillDownLabel: nl ? "Toon redenering" : "Show reasoning",
    },
    ...(executionPlanSections && input.planningGraph
      ? [
    {
      id: "execution-plan",
      title: nl ? "Executieplan" : "Execution plan",
      summary: presentExecutionPlanSummary({ graph: input.planningGraph, locale: input.locale }),
      drillDownPlanningDecisionId: input.planningGraph.planningDecisions[0]?.id,
      drillDownLabel: nl ? "Open executiedetails" : "Open execution details",
    },
        ]
      : []),
    {
      id: "customer-needs",
      title: nl ? "Wat Emma van jou nodig heeft" : "What Emma needs from you",
      summary:
        customerNeeds ||
        (nl
          ? "Emma heeft op dit moment geen extra input van jou nodig om verder te gaan."
          : "Emma does not need additional input from you right now to proceed."),
    },
    {
      id: "risks-and-unknowns",
      title: nl ? "Risico's en onbekenden" : "Risks and unknowns",
      summary: aggregateRisksAndUnknowns(decisions, input.planningGraph, nl),
      drillDownDecisionId: primaryDecision?.id,
      drillDownLabel: nl ? "Toon risico-evidence" : "Show risk evidence",
    },
    {
      id: "approval-summary",
      title: nl ? "Goedkeuring" : "Approval summary",
      summary: nl
        ? `Bevestig Emma's campagne-aanpak — één beslissing. Verwacht resultaat: ${kpi || campaignObjective || input.campaignContext.description}. ${evidenceCount} bewijsreferenties beschikbaar als je wilt inzoomen.`
        : `Confirm Emma's campaign approach — one decision. Expected outcome: ${kpi || campaignObjective || input.campaignContext.description}. ${evidenceCount} evidence references available if you want to drill down.`,
    },
  ].filter((s) => s.summary.trim().length > 0);

  return {
    title: nl ? `Executive review — ${name}` : `Executive review — ${name}`,
    preparedAt: strategy?.generatedAt ?? new Date().toISOString(),
    companyName: name,
    sections,
    topDecisions,
    decisions,
    recommendationSummary:
      primaryDecision?.recommendation ?? topDecisions[0]?.recommendation ?? sections[0]?.summary ?? "",
    requiredDecisions: decisions.filter((d) => d.approvalRequired).map((d) => d.title),
    executionPlan: executionPlanSections,
    planningGraph: input.planningGraph ?? undefined,
  };
}

/** Rebuild decisions from strategy graph when only legacy output is available. */
export function rebuildDecisionsFromStrategyOutput(input: {
  strategy: BrainStructuredOutput;
  campaignContext: CampaignContext;
  organizationId: string;
  locale: "nl" | "en";
}): Decision[] {
  if (input.strategy.decisionRecords?.length) {
    return [...input.strategy.decisionRecords];
  }
  return [];
}
