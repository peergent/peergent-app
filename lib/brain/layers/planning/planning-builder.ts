import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { Decision, DecisionCollection } from "../../decision/decision-types";
import type { BrandGraph } from "../brand/types";
import type { MarketingIntelligenceGraph } from "../marketing-intelligence/types";
import type { ResearchGraph } from "../research/types";
import type { ReasoningGraph } from "../reasoning/types";
import type { StrategyGraph } from "../../strategy/strategy-graph";
import {
  analyzePlanningDependencies,
  mergeNodeDependencies,
} from "./planning-dependency-engine";
import { assessPlanningReadiness } from "./planning-readiness-engine";
import { buildPlanningTimeline, deriveExecutionOrder } from "./planning-timeline-engine";
import { buildPlanningReviewMoments, buildPlanningRisks } from "./planning-risk-engine";
import type {
  PlanningDecision,
  PlanningGraph,
  PlanningMilestone,
  PlanningNode,
  PlanningObjective,
  PlanningRequirement,
} from "./types";
import { PLANNING_LAYER_VERSION } from "./types";

export type BuildPlanningGraphInput = {
  organizationId: string;
  campaignId?: string;
  campaignContext: CampaignContext;
  strategyGraph: StrategyGraph;
  decisionCollection: DecisionCollection;
  brandGraph?: BrandGraph | null;
  marketingIntelligence?: MarketingIntelligenceGraph | null;
  researchGraph?: ResearchGraph | null;
  reasoningGraph?: ReasoningGraph | null;
  locale?: "nl" | "en";
};

function node(
  partial: Omit<PlanningNode, "status"> & { status?: PlanningNode["status"] }
): PlanningNode {
  return { status: partial.status ?? "proposed", ...partial };
}

function planningDecisionFromStrategyDecision(
  decision: Decision,
  linkedNodeIds: string[],
  nl: boolean
): PlanningDecision {
  return {
    id: `plan-dec:${decision.id}`,
    title: decision.title,
    summary: decision.summary,
    reason: decision.reasoning,
    whyNow: decision.recommendation,
    whyNotEarlier: nl
      ? "Eerdere start zonder prerequisites verlaagt conversiekwaliteit."
      : "Starting earlier without prerequisites reduces conversion quality.",
    whyNotLater: nl
      ? "Uitstel vertraagt learning en time-to-value voor het campagnedoel."
      : "Delay slows learning and time-to-value for the campaign goal.",
    businessValue: decision.businessImpact,
    dependsOn: decision.dependencies.map((d) => d.decisionId),
    blocks: [],
    delayRisk: decision.knownRisks[0] ?? (nl ? "Vertraagde learning" : "Delayed learning"),
    prerequisites: decision.assumptions,
    expectedLearning: decision.expectedOutcome,
    reviewTrigger: decision.reviewTriggers[0]?.condition ?? (nl ? "Na eerste resultaten" : "After first results"),
    linkedNodeIds,
    sourceDecisionId: decision.id,
  };
}

function buildRequirements(input: BuildPlanningGraphInput): {
  assets: PlanningRequirement[];
  knowledge: PlanningRequirement[];
  customerInput: PlanningRequirement[];
  integrations: PlanningRequirement[];
  missing: string[];
} {
  const nl = input.locale === "nl";
  const missing: string[] = [];
  const assets: PlanningRequirement[] = [];
  const knowledge: PlanningRequirement[] = [];
  const customerInput: PlanningRequirement[] = [];
  const integrations: PlanningRequirement[] = [];

  const hasLanding = Boolean(input.campaignContext.websiteUrl?.trim());
  assets.push({
    id: "req-landing-page",
    title: nl ? "Landing page" : "Landing page",
    category: "asset",
    reason: nl
      ? "Conversie vereist een bestemming — traffic zonder landing page verspilt spend."
      : "Conversion requires a destination — traffic without a landing page wastes spend.",
    blocksNodeIds: ["stage-channel-activation"],
    status: hasLanding ? "partial" : "missing",
  });
  if (!hasLanding) missing.push(nl ? "Landing page" : "Landing page");

  assets.push({
    id: "req-tracking",
    title: nl ? "Tracking / pixel" : "Tracking / pixel",
    category: "tracking",
    reason: nl
      ? "Performance Brain en review triggers vereisen meetbare signalen."
      : "Performance Brain and review triggers require measurable signals.",
    blocksNodeIds: ["stage-channel-activation", "stage-post-launch-review"],
    status: "missing",
  });
  missing.push(nl ? "Tracking" : "Tracking");

  knowledge.push({
    id: "req-brand-guidelines",
    title: nl ? "Brand guidelines" : "Brand guidelines",
    category: "knowledge",
    reason: nl ? "Creative Brain heeft merkcontext nodig voor consistente output." : "Creative Brain needs brand context for consistent output.",
    blocksNodeIds: ["stage-creative-prep"],
    status: input.brandGraph ? "partial" : "missing",
  });

  customerInput.push({
    id: "req-campaign-approval",
    title: nl ? "Campagne goedkeuring" : "Campaign approval",
    category: "approval",
    reason: nl ? "Executie start pas na klantbevestiging." : "Execution starts only after customer confirmation.",
    blocksNodeIds: ["stage-launch"],
    status: "missing",
  });
  missing.push(nl ? "Customer approval" : "Customer approval");

  for (const channel of input.campaignContext.selectedChannels) {
    integrations.push({
      id: `req-integration-${channel.toLowerCase().replace(/\s+/g, "-")}`,
      title: channel,
      category: "integration",
      reason: nl ? `${channel} integratie vereist voor publicatie.` : `${channel} integration required for publication.`,
      blocksNodeIds: ["stage-channel-activation"],
      status: "missing",
    });
  }

  if (input.campaignContext.selectedDeliverables.includes("social_post")) {
    assets.push({
      id: "req-copy",
      title: nl ? "Copy / messaging" : "Copy / messaging",
      category: "asset",
      reason: nl ? "Creative Brain produceert copy — Planning identificeert de behoefte." : "Creative Brain produces copy — Planning identifies the need.",
      blocksNodeIds: ["stage-creative-prep"],
      status: "missing",
    });
  }

  return { assets, knowledge, customerInput, integrations, missing };
}

function buildExecutionNodes(input: BuildPlanningGraphInput, requirements: ReturnType<typeof buildRequirements>): PlanningNode[] {
  const nl = input.locale === "nl";
  const name = input.campaignContext.companyName;
  const nodes: PlanningNode[] = [];

  nodes.push(
    node({
      id: "stage-strategy-foundation",
      title: nl ? "Strategie-fundament bevestigen" : "Confirm strategy foundation",
      description: nl
        ? `Alle strategische beslissingen voor ${name} zijn vastgelegd — executie volgt de beslissingen, niet losse taken.`
        : `All strategic decisions for ${name} are recorded — execution follows decisions, not loose tasks.`,
      businessPurpose: nl ? "Zekerstellen dat executie op de juiste beslissingen bouwt." : "Ensure execution builds on the right decisions.",
      reason: nl ? "Zonder bevestigde strategie is elke activiteit een gok." : "Without confirmed strategy, every activity is a guess.",
      priority: "critical",
      ownerBrain: "marketing",
      dependsOn: [],
      blocks: ["stage-landing-readiness", "stage-creative-prep"],
      estimatedEffort: nl ? "1 review-moment" : "1 review moment",
      requiredInputs: [nl ? "Executive briefing approval" : "Executive briefing approval"],
      producedOutputs: [nl ? "Goedgekeurde executierichting" : "Approved execution direction"],
      approvalRequired: true,
      reviewTrigger: nl ? "Bij klantbevestiging" : "On customer confirmation",
      confidence: "high",
    })
  );

  const landingMissing = requirements.assets.find((a) => a.id === "req-landing-page")?.status === "missing";
  nodes.push(
    node({
      id: "stage-landing-readiness",
      title: nl ? "Landing page gereed maken" : "Prepare landing page readiness",
      description: nl
        ? landingMissing
          ? "Delay kanaalactivatie tot landing page is af — traffic vóór optimalisatie verlaagt conversiekwaliteit."
          : "Landing context beschikbaar — optimalisatie en tracking valideren vóór paid scale."
        : landingMissing
          ? "Delay channel activation until landing page is ready — traffic before optimization reduces conversion quality."
          : "Landing context available — validate optimization and tracking before paid scale.",
      businessPurpose: nl ? "Conversiekwaliteit maximaliseren." : "Maximize conversion quality.",
      reason: nl
        ? "Traffic zonder bestemming creëert impressies, geen business value."
        : "Traffic without a destination creates impressions, not business value.",
      priority: "critical",
      ownerBrain: "marketing",
      dependsOn: ["stage-strategy-foundation"],
      blocks: ["stage-channel-activation"],
      estimatedEffort: nl ? "Afhankelijk van landing page status" : "Depends on landing page status",
      requiredInputs: [nl ? "Landing page URL of draft" : "Landing page URL or draft"],
      producedOutputs: [nl ? "Launch-ready destination" : "Launch-ready destination"],
      approvalRequired: landingMissing,
      reviewTrigger: nl ? "Direct na landing page approval" : "Immediately after landing page approval",
      status: landingMissing ? "blocked" : "waiting",
      confidence: landingMissing ? "low" : "medium",
    })
  );

  nodes.push(
    node({
      id: "stage-tracking-setup",
      title: nl ? "Tracking voorbereiden" : "Prepare tracking",
      description: nl
        ? "Tracking moet live vóór paid activatie — anders kan Performance Brain niet evalueren."
        : "Tracking must be live before paid activation — otherwise Performance Brain cannot evaluate.",
      businessPurpose: nl ? "Learning speed en accountability." : "Learning speed and accountability.",
      reason: nl ? "Zonder meting is elke review giswerk." : "Without measurement, every review is guesswork.",
      priority: "high",
      ownerBrain: "execution",
      dependsOn: ["stage-strategy-foundation"],
      blocks: ["stage-channel-activation"],
      estimatedEffort: nl ? "Setup vóór launch" : "Setup before launch",
      requiredInputs: [nl ? "Pixel / analytics toegang" : "Pixel / analytics access"],
      producedOutputs: [nl ? "Meetbare campagne" : "Measurable campaign"],
      approvalRequired: false,
      confidence: "medium",
      status: "waiting",
    })
  );

  nodes.push(
    node({
      id: "stage-creative-prep",
      title: nl ? "Creative voorbereiding" : "Creative preparation",
      description: nl
        ? "Creative Brain bepaalt HOW — Planning beslist dat creative nodig is vóór kanaalactivatie."
        : "Creative Brain decides HOW — Planning decides creative is needed before channel activation.",
      businessPurpose: nl ? "Consistente boodschap op alle kanalen." : "Consistent message across channels.",
      reason: nl ? "Kanalen zonder creative leveren geen learning op." : "Channels without creative deliver no learning.",
      priority: "high",
      ownerBrain: "creative",
      dependsOn: ["stage-strategy-foundation"],
      blocks: ["stage-channel-activation"],
      estimatedEffort: nl ? "Parallel met landing page waar mogelijk" : "Parallel with landing page where possible",
      requiredInputs: [nl ? "Brand context + channel keuze" : "Brand context + channel choice"],
      producedOutputs: [nl ? "Creative richting (future Creative Layer)" : "Creative direction (future Creative Layer)"],
      approvalRequired: false,
      confidence: "medium",
    })
  );

  const channelDecision = input.decisionCollection.decisions.find((d) => d.category === "channel_choice");
  nodes.push(
    node({
      id: "stage-channel-activation",
      title: nl
        ? `Kanaalactivatie${channelDecision ? `: ${channelDecision.title}` : ""}`
        : `Channel activation${channelDecision ? `: ${channelDecision.title}` : ""}`,
      description: channelDecision?.recommendation ?? (nl ? "Kanalen activeren wanneer dependencies klaar zijn." : "Activate channels when dependencies are ready."),
      businessPurpose: channelDecision?.businessImpact ?? (nl ? "Eerste pipeline en learning." : "First pipeline and learning."),
      reason: channelDecision?.reasoning ?? (nl ? "Niet alles start tegelijk — volgorde maximaliseert impact." : "Not everything starts at once — order maximizes impact."),
      priority: "critical",
      ownerBrain: "marketing",
      dependsOn: ["stage-landing-readiness", "stage-tracking-setup", "stage-creative-prep"],
      blocks: ["stage-launch"],
      estimatedEffort: nl ? "Na readiness groen" : "After readiness green",
      requiredInputs: input.campaignContext.selectedChannels,
      producedOutputs: [nl ? "Live kanaalactiviteit" : "Live channel activity"],
      approvalRequired: true,
      reviewTrigger: nl ? "7 dagen na activatie" : "7 days after activation",
      status: "blocked",
      confidence: channelDecision?.confidence === "low" ? "low" : "medium",
    })
  );

  nodes.push(
    node({
      id: "stage-launch",
      title: nl ? "Campagne launch" : "Campaign launch",
      description: nl
        ? "Publicatie wanneer readiness, approval en dependencies groen zijn."
        : "Publication when readiness, approval, and dependencies are green.",
      businessPurpose: nl ? "Time-to-value realiseren." : "Realize time-to-value.",
      reason: nl ? "Launch is een beslissing, geen automatische stap." : "Launch is a decision, not an automatic step.",
      priority: "critical",
      ownerBrain: "execution",
      dependsOn: ["stage-channel-activation"],
      blocks: ["stage-post-launch-review"],
      estimatedEffort: nl ? "1 goedkeuringsmoment" : "1 approval moment",
      requiredInputs: [nl ? "Klant approval" : "Customer approval"],
      producedOutputs: [nl ? "Live campagne" : "Live campaign"],
      approvalRequired: true,
      confidence: "medium",
      status: "waiting",
    })
  );

  nodes.push(
    node({
      id: "stage-post-launch-review",
      title: nl ? "Post-launch review" : "Post-launch review",
      description: nl
        ? "Emma plant continue evaluatie — Performance Brain beslist later of de aanpak moet veranderen."
        : "Emma schedules continuous evaluation — Performance Brain later decides whether the approach should change.",
      businessPurpose: nl ? "Learning speed maximaliseren." : "Maximize learning speed.",
      reason: nl ? "Planning stopt niet bij launch." : "Planning does not stop at launch.",
      priority: "high",
      ownerBrain: "performance",
      dependsOn: ["stage-launch"],
      blocks: [],
      estimatedEffort: nl ? "Doorlopend" : "Ongoing",
      requiredInputs: [nl ? "Tracking data" : "Tracking data"],
      producedOutputs: [nl ? "Review signals voor Performance Brain" : "Review signals for Performance Brain"],
      approvalRequired: false,
      reviewTrigger: nl ? "7 / 30 dagen + drempels" : "7 / 30 days + thresholds",
      confidence: "medium",
      status: "proposed",
    })
  );

  return nodes;
}

/** Build PlanningGraph from strategic inputs — Sprint 11.0. */
export function buildPlanningGraph(input: BuildPlanningGraphInput): PlanningGraph {
  const nl = input.locale === "nl";
  const createdAt = new Date().toISOString();
  const goal =
    input.campaignContext.goals[0] ?? input.campaignContext.description;

  const requirements = buildRequirements(input);
  const executionStages = buildExecutionNodes(input, requirements);

  const objectives: PlanningObjective[] = [
    {
      id: "obj-primary",
      title: nl ? "Primair campagnedoel" : "Primary campaign objective",
      description: goal,
      businessValue: input.strategyGraph.successCriteria.description,
      successCriteria: input.strategyGraph.successCriteria.description,
      linkedDecisionIds: input.decisionCollection.decisions
        .filter((d) => d.category === "strategy_direction" || d.category === "lead_generation")
        .map((d) => d.id),
    },
  ];

  const milestones: PlanningMilestone[] = [
    {
      id: "ms-readiness",
      title: nl ? "Executie readiness" : "Execution readiness",
      description: nl ? "Alle prerequisites groen" : "All prerequisites green",
      intent: nl ? "Geen spend vóór readiness" : "No spend before readiness",
      dependsOnNodeIds: ["stage-strategy-foundation", "stage-landing-readiness", "stage-tracking-setup"],
      producesLearning: nl ? "Bevestiging dat executie veilig kan starten" : "Confirmation execution can safely start",
    },
    {
      id: "ms-first-learning",
      title: nl ? "Eerste learning" : "First learning",
      description: nl ? "Eerste meetbare signalen" : "First measurable signals",
      intent: nl ? "Valideren of message-market fit klopt" : "Validate message-market fit",
      dependsOnNodeIds: ["stage-channel-activation", "stage-post-launch-review"],
      producesLearning: nl ? "Input voor Performance Brain" : "Input for Performance Brain",
    },
  ];

  const nodeIds = executionStages.map((n) => n.id);
  const planningDecisions: PlanningDecision[] = input.decisionCollection.decisions.map((d) => {
    const linked = executionStages
      .filter((n) =>
        d.category === "channel_choice"
          ? n.id === "stage-channel-activation"
          : d.category === "strategy_direction"
            ? n.id === "stage-strategy-foundation"
            : false
      )
      .map((n) => n.id);
    return planningDecisionFromStrategyDecision(d, linked.length ? linked : nodeIds.slice(0, 1), nl);
  });

  const dependencies = mergeNodeDependencies(executionStages);
  const executionOrder = deriveExecutionOrder(executionStages);
  const dependencyAnalysis = analyzePlanningDependencies({ nodes: executionStages, dependencies });

  const readiness = assessPlanningReadiness({
    strategyGraph: input.strategyGraph,
    decisionCollection: input.decisionCollection,
    campaignContext: input.campaignContext,
    brandGraph: input.brandGraph,
    marketingIntelligence: input.marketingIntelligence,
    reasoningGraph: input.reasoningGraph,
    locale: input.locale ?? "en",
    missingRequirements: requirements.missing,
  });

  const risks = buildPlanningRisks({
    strategyGraph: input.strategyGraph,
    nodes: executionStages,
    readiness,
    locale: input.locale ?? "en",
  });

  const reviewMoments = buildPlanningReviewMoments({ campaignGoal: goal, locale: input.locale ?? "en" });
  const estimatedTimeline = buildPlanningTimeline({
    nodes: executionStages,
    executionOrder,
    locale: input.locale ?? "en",
    campaignGoal: goal,
  });

  const blockedActivities = executionStages.filter((n) => n.status === "blocked").map((n) => n.id);
  const unknowns = [
    ...input.strategyGraph.unknowns.map((u) => u.title),
    ...requirements.missing,
  ];

  return {
    version: PLANNING_LAYER_VERSION,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    createdAt,
    objectives,
    milestones,
    planningDecisions,
    executionStages,
    executionOrder,
    dependencies,
    blockedActivities,
    parallelActivities: dependencyAnalysis.parallelOpportunities,
    criticalPath: dependencyAnalysis.criticalPath,
    requiredAssets: requirements.assets,
    requiredKnowledge: requirements.knowledge,
    requiredCustomerInput: requirements.customerInput,
    requiredIntegrations: requirements.integrations,
    reviewMoments,
    successCriteria: [input.strategyGraph.successCriteria.description],
    readiness,
    risks,
    unknowns,
    estimatedTimeline,
    dependencyAnalysis,
  };
}
