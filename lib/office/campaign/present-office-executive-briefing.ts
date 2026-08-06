import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { PlanningGraph } from "@/lib/brain/layers/planning/types";
import { presentDecisionSummary } from "@/lib/brain/decision/decision-presentation";

export type OfficeCustomerNeedItem = {
  readonly title: string;
  readonly reason: string;
  readonly blocksExecution: boolean;
};

export type OfficeExecutionPhase = {
  readonly order: number;
  readonly title: string;
  readonly purpose?: string;
};

export type OfficeExecutiveBriefingSummaryVm = {
  readonly headerTitle: string;
  readonly humanSummary: string;
  readonly statusLabel: string;
  readonly statusKind: "pending_approval" | "approved" | "ready";
  readonly metadata: {
    readonly decisionCount: number;
    readonly channelCount: number;
    readonly deliverableCount: number;
    readonly customerActionCount: number;
  };
  readonly primaryAdvice: {
    readonly recommendation: string;
    readonly whyAudience?: string;
    readonly whyNow?: string;
    readonly businessImpact: string;
    readonly confidence: string;
    readonly rejectedAlternative?: { readonly alternative: string; readonly reason: string };
  } | null;
  readonly whyItWorks: string;
  readonly executionPhases: readonly OfficeExecutionPhase[];
  readonly customerNeeds: readonly OfficeCustomerNeedItem[];
  readonly customerNeedsEmpty: boolean;
  readonly risks: readonly string[];
  readonly expectedNextStep: string;
};

function sectionSummary(briefing: ExecutiveCampaignBriefing, id: string): string {
  return briefing.sections.find((s) => s.id === id)?.summary ?? "";
}

function primaryDecision(briefing: ExecutiveCampaignBriefing): Decision | undefined {
  return (
    briefing.decisions.find((d) => d.category === "strategy_direction") ??
    briefing.decisions[0]
  );
}

function channelCount(briefing: ExecutiveCampaignBriefing): number {
  const channels = briefing.decisions.filter((d) => d.category === "channel_choice");
  return channels.length > 0 ? channels.length : Math.min(briefing.topDecisions.length, 3);
}

function deliverableCount(graph: PlanningGraph | undefined): number {
  if (!graph) return 0;
  return graph.executionStages.length > 0
    ? graph.executionStages.length
    : graph.milestones.length;
}

function buildCustomerNeeds(
  graph: PlanningGraph | undefined
): OfficeCustomerNeedItem[] {
  if (!graph) return [];

  const items = [
    ...graph.requiredCustomerInput.filter((r) => r.status !== "available"),
    ...graph.requiredAssets.filter((r) => r.status === "missing" || r.status === "partial"),
    ...graph.requiredIntegrations.filter((r) => r.status === "missing"),
  ];

  const seen = new Set<string>();
  return items
    .filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    })
    .slice(0, 6)
    .map((item) => ({
      title: item.title,
      reason: item.reason,
      blocksExecution: item.blocksNodeIds.length > 0,
    }));
}

function buildExecutionPhases(
  graph: PlanningGraph | undefined,
  briefing: ExecutiveCampaignBriefing
): OfficeExecutionPhase[] {
  if (graph?.estimatedTimeline?.length) {
    return graph.estimatedTimeline
      .filter((t) => !t.happensAfterLaunch)
      .slice(0, 5)
      .map((t, index) => ({
        order: index + 1,
        title: t.phase,
        purpose: t.intent,
      }));
  }

  if (graph?.executionStages?.length) {
    const order = graph.executionOrder.length
      ? graph.executionOrder
      : graph.executionStages.map((s) => s.id);
    const byId = new Map(graph.executionStages.map((s) => [s.id, s]));
    return order
      .map((id) => byId.get(id))
      .filter(Boolean)
      .slice(0, 5)
      .map((stage, index) => ({
        order: index + 1,
        title: stage!.title,
        purpose: stage!.businessPurpose || stage!.description,
      }));
  }

  const planSummary = briefing.executionPlan?.recommendedOrder;
  if (planSummary) {
    return planSummary
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5)
      .map((line, index) => {
        const [title, ...rest] = line.split(":");
        return {
          order: index + 1,
          title: (rest.length ? title : line) ?? line,
          purpose: rest.length ? rest.join(":").trim() : undefined,
        };
      });
  }

  return [];
}

function buildRisks(
  graph: PlanningGraph | undefined,
  briefing: ExecutiveCampaignBriefing
): string[] {
  const fromGraph =
    graph?.risks.slice(0, 3).map((r) => r.title) ??
    [];
  const fromDecisions = briefing.decisions
    .flatMap((d) => d.knownRisks)
    .filter(Boolean)
    .slice(0, 2);

  const combined = [...new Set([...fromGraph, ...fromDecisions])].slice(0, 4);
  if (combined.length > 0) return combined;

  const fallback = sectionSummary(briefing, "risks-and-unknowns");
  if (!fallback || fallback.includes("Geen kritieke") || fallback.includes("No critical")) {
    return [];
  }

  return fallback
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildHumanSummary(input: {
  briefing: ExecutiveCampaignBriefing;
  primary: Decision | undefined;
  customerActionCount: number;
  pendingApproval: boolean;
  nl: boolean;
}): string {
  const { briefing, primary, customerActionCount, pendingApproval, nl } = input;
  const lead =
    primary?.recommendation ??
    briefing.recommendationSummary ??
    sectionSummary(briefing, "executive-summary");

  if (nl) {
    const prepared =
      "De strategie, kanalen en uitvoering zijn voorbereid.";
    if (pendingApproval && customerActionCount > 0) {
      return `${lead} ${prepared} Ik heb nog ${customerActionCount} punt${customerActionCount === 1 ? "" : "en"} waarvoor ik jouw akkoord nodig heb.`;
    }
    if (pendingApproval) {
      return `${lead} ${prepared} Eén akkoord en ik ga verder met uitvoering.`;
    }
    return `${lead} ${prepared}`;
  }

  const prepared = "Strategy, channels, and execution are prepared.";
  if (pendingApproval && customerActionCount > 0) {
    return `${lead} ${prepared} I still need your input on ${customerActionCount} item${customerActionCount === 1 ? "" : "s"}.`;
  }
  if (pendingApproval) {
    return `${lead} ${prepared} One approval and I continue with execution.`;
  }
  return `${lead} ${prepared}`;
}

export function presentOfficeExecutiveBriefingSummary(input: {
  briefing: ExecutiveCampaignBriefing;
  locale?: "nl" | "en";
  pendingApproval: boolean;
  publicationUnlocked: boolean;
}): OfficeExecutiveBriefingSummaryVm {
  const nl = input.locale === "nl";
  const { briefing } = input;
  const graph = briefing.planningGraph;
  const primary = primaryDecision(briefing);
  const customerNeeds = buildCustomerNeeds(graph);
  const customerActionCount = customerNeeds.length;

  const statusKind = input.publicationUnlocked
    ? "approved"
    : input.pendingApproval
      ? "pending_approval"
      : "ready";

  const statusLabel =
    statusKind === "approved"
      ? nl
        ? "Goedgekeurd — Emma voert uit"
        : "Approved — Emma is executing"
      : statusKind === "pending_approval"
        ? nl
          ? "Klaar voor akkoord"
          : "Ready for your approval"
        : nl
          ? "Briefing beschikbaar"
          : "Briefing available";

  const primaryAdvice = primary
    ? {
        recommendation: primary.recommendation,
        whyAudience:
          primary.category === "audience_focus" || primary.category === "strategy_direction"
            ? primary.summary
            : briefing.decisions.find((d) => d.category === "audience_focus")?.summary,
        whyNow: primary.reasoning.split(".").find(Boolean)?.trim(),
        businessImpact: primary.businessImpact,
        confidence: presentDecisionSummary(primary, nl).confidence,
        rejectedAlternative: primary.alternativesRejected[0],
      }
    : briefing.topDecisions[0]
      ? {
          recommendation: briefing.topDecisions[0].recommendation,
          businessImpact: briefing.topDecisions[0].businessImpact,
          confidence: briefing.topDecisions[0].confidence,
        }
      : null;

  return {
    headerTitle: nl ? "Emma heeft je campagne voorbereid" : "Emma prepared your campaign",
    humanSummary: buildHumanSummary({
      briefing,
      primary,
      customerActionCount,
      pendingApproval: input.pendingApproval,
      nl,
    }),
    statusLabel,
    statusKind,
    metadata: {
      decisionCount: Math.max(briefing.topDecisions.length, briefing.decisions.length),
      channelCount: channelCount(briefing),
      deliverableCount: deliverableCount(graph),
      customerActionCount,
    },
    primaryAdvice,
    whyItWorks: sectionSummary(briefing, "business-impact"),
    executionPhases: buildExecutionPhases(graph, briefing),
    customerNeeds,
    customerNeedsEmpty: customerNeeds.length === 0,
    risks: buildRisks(graph, briefing),
    expectedNextStep:
      briefing.executionPlan?.expectedNextStep ??
      (nl
        ? "Na jouw goedkeuring start Emma met de eerste uitvoeringsfase."
        : "After your approval, Emma begins the first execution phase."),
  };
}
