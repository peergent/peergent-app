import type { PlanningGraph, PlanningReadinessLevel } from "./types";

const TASK_LIST_PATTERN =
  /^(create|build|start|make|write|post|launch)\s+(linkedin|google|meta|landing|email|ads?|campaign)/i;

/** Business-language execution plan for Executive Briefing — no internal graph structures. */
export function presentExecutionPlanSummary(input: {
  graph: PlanningGraph;
  locale?: "nl" | "en";
}): string {
  const nl = input.locale === "nl";
  const g = input.graph;
  const parts: string[] = [];

  const objective = g.objectives[0];
  if (objective) {
    const value = objective.businessValue || objective.description;
    parts.push(
      nl
        ? `Emma richt zich op: ${value}`
        : `Emma will run this campaign toward: ${value}`
    );
    if (objective.businessValue) {
      parts.push(nl ? `Business value: ${objective.businessValue}` : `Business value: ${objective.businessValue}`);
    }
  }

  const phases = g.estimatedTimeline
    .filter((t) => !t.happensAfterLaunch)
    .slice(0, 4)
    .map((t) => t.phase);
  if (phases.length) {
    parts.push(
      nl
        ? `Aanbevolen volgorde: ${phases.join(" → ")}.`
        : `Recommended order: ${phases.join(" → ")}.`
    );
  }

  const why = g.estimatedTimeline[0]?.intent;
  if (why) {
    parts.push(nl ? `Waarom: ${why}` : `Why: ${why}`);
  }

  if (g.parallelActivities.length) {
    const parallel = g.parallelActivities[0];
    parts.push(
      nl
        ? `Parallel mogelijk: ${parallel.reason}`
        : `Can run in parallel: ${parallel.reason}`
    );
  }

  parts.push(presentReadinessCustomerSummary(g, input.locale));

  if (g.risks[0]) {
    parts.push(
      nl
        ? `Belangrijkste risico: ${g.risks[0].title} — ${g.risks[0].mitigation}`
        : `Top risk: ${g.risks[0].title} — ${g.risks[0].mitigation}`
    );
  }

  const postLaunch = g.estimatedTimeline.find((t) => t.happensAfterLaunch);
  if (postLaunch) {
    parts.push(nl ? `Na launch: ${postLaunch.intent}` : `After launch: ${postLaunch.intent}`);
  }

  return parts.join(" ");
}

export function presentReadinessCustomerSummary(
  graph: PlanningGraph,
  locale: "nl" | "en" = "en"
): string {
  const nl = locale === "nl";
  const level = graph.readiness.level;
  const waiting = graph.readiness.waitingFor.filter(Boolean);

  const label = readinessCustomerLabel(level, nl);

  if (level === "ready") {
    return nl
      ? `${label} Emma kan starten zodra jij akkoord geeft.`
      : `${label} Emma can begin once you approve.`;
  }

  if (waiting.length) {
    return nl
      ? `${label} Emma heeft nog nodig: ${waiting.join(", ")}.`
      : `${label} Emma still needs: ${waiting.join(", ")}.`;
  }

  return graph.readiness.summary;
}

function readinessCustomerLabel(level: PlanningReadinessLevel, nl: boolean): string {
  switch (level) {
    case "ready":
      return nl ? "Klaar." : "Ready.";
    case "mostly_ready":
      return nl ? "Bijna klaar." : "Nearly ready.";
    case "waiting":
      return nl ? "Wacht op input." : "Waiting for input.";
    default:
      return nl ? "Geblokkeerd." : "Blocked.";
  }
}

export function presentCustomerInputSummary(
  graph: PlanningGraph,
  locale: "nl" | "en" = "en"
): string {
  const nl = locale === "nl";
  const items = [
    ...graph.requiredCustomerInput.filter((r) => r.status !== "available").map((r) => r.title),
    ...graph.requiredAssets.filter((r) => r.status === "missing").map((r) => r.title),
    ...graph.requiredIntegrations.filter((r) => r.status === "missing").map((r) => r.title),
  ];

  const unique = [...new Set(items)];
  if (unique.length === 0) {
    return nl
      ? "Emma heeft op dit moment geen extra input van jou nodig om verder te gaan."
      : "Emma does not need additional input from you right now to proceed.";
  }

  return nl
    ? `Wat ik nog van je nodig heb: ${unique.join(", ")}.`
    : `What I still need from you: ${unique.join(", ")}.`;
}

export type ExecutionPlanBriefingSections = {
  whatEmmaIntends: string;
  recommendedOrder: string;
  whyThisOrder: string;
  parallelOpportunities: string;
  whatEmmaNeeds: string;
  readiness: string;
  mainRisks: string;
  reviewMoments: string;
  expectedNextStep: string;
};

export function presentExecutionPlanBriefingSections(input: {
  graph: PlanningGraph;
  locale?: "nl" | "en";
}): ExecutionPlanBriefingSections {
  const nl = input.locale === "nl";
  const g = input.graph;

  return {
    whatEmmaIntends: g.objectives.map((o) => o.businessValue || o.description).join(" · "),
    recommendedOrder: g.estimatedTimeline
      .filter((t) => !t.happensAfterLaunch)
      .map((t) => `${t.phase}: ${t.intent}`)
      .join("\n"),
    whyThisOrder: g.planningDecisions
      .slice(0, 3)
      .map((d) => d.reason)
      .join("\n"),
    parallelOpportunities:
      g.parallelActivities.map((p) => p.reason).join("\n") ||
      (nl ? "Geen parallelle fases nodig." : "No parallel phases needed."),
    whatEmmaNeeds: presentCustomerInputSummary(g, input.locale),
    readiness: presentReadinessCustomerSummary(g, input.locale),
    mainRisks: g.risks
      .slice(0, 3)
      .map((r) => `${r.title} — ${r.mitigation}`)
      .join("\n"),
    reviewMoments: g.reviewMoments
      .slice(0, 4)
      .map((r) => `${r.title}: ${r.purpose}`)
      .join("\n"),
    expectedNextStep: nl
      ? "Na jouw goedkeuring start Emma met de eerste uitvoeringsfase volgens dit plan."
      : "After your approval, Emma begins the first execution phase according to this plan.",
  };
}

export function presentExecutionPlanDetail(input: {
  graph: PlanningGraph;
  locale?: "nl" | "en";
}): {
  whatEmmaWillDo: string;
  whyThisOrder: string;
  dependencies: string;
  waitingFor: string;
  delayRisks: string;
  risks: string;
  afterLaunch: string;
} {
  const g = input.graph;
  const sections = presentExecutionPlanBriefingSections(input);

  return {
    whatEmmaWillDo: g.executionStages.map((s) => `${s.title}: ${s.businessPurpose}`).join("\n"),
    whyThisOrder: sections.whyThisOrder,
    dependencies: g.dependencies
      .slice(0, 6)
      .map((d) => d.reason)
      .join("\n"),
    waitingFor: sections.whatEmmaNeeds,
    delayRisks: g.planningDecisions
      .slice(0, 3)
      .map((d) => d.delayRisk)
      .join(" · "),
    risks: sections.mainRisks,
    afterLaunch: sections.reviewMoments,
  };
}

export function isGenericTaskListPlanning(graph: PlanningGraph): boolean {
  const text = graph.executionStages.map((s) => `${s.title} ${s.description}`).join(" ");
  const matches = text.match(new RegExp(TASK_LIST_PATTERN.source, "gi")) ?? [];
  const withoutPurpose = graph.executionStages.filter((s) => s.businessPurpose.length < 15);
  return matches.length >= 3 && withoutPurpose.length >= 2;
}
