import type { PlanningRisk, PlanningNode } from "./types";
import type { StrategyGraph } from "../../strategy/strategy-graph";
import type { PlanningReadinessAssessment } from "./types";

export type RiskEngineInput = {
  strategyGraph: StrategyGraph;
  nodes: readonly PlanningNode[];
  readiness: PlanningReadinessAssessment;
  locale: "nl" | "en";
};

/** Proactively identify execution risks with mitigation and review triggers. */
export function buildPlanningRisks(input: RiskEngineInput): PlanningRisk[] {
  const nl = input.locale === "nl";
  const risks: PlanningRisk[] = [];
  let idx = 0;

  const add = (risk: Omit<PlanningRisk, "id">) => {
    risks.push({ ...risk, id: `plan-risk-${++idx}` });
  };

  const landingNode = input.nodes.find((n) => /landing|page/i.test(n.title));
  if (landingNode && landingNode.status !== "ready") {
    add({
      title: nl ? "Landing page niet af" : "Landing page unfinished",
      description: nl
        ? "Paid traffic vóór landing page optimalisatie verlaagt conversiekwaliteit."
        : "Paid traffic before landing page optimization reduces conversion quality.",
      probability: "high",
      impact: "critical",
      mitigation: nl
        ? "Delay kanaalactivatie tot landing page is goedgekeurd."
        : "Delay channel activation until landing page is approved.",
      fallback: nl ? "Start met organische/LinkedIn content zonder paid spend." : "Start with organic/LinkedIn content without paid spend.",
      reviewTrigger: nl ? "Direct na landing page approval" : "Immediately after landing page approval",
      linkedNodeIds: [landingNode.id],
    });
  }

  if (input.readiness.checks.some((c) => c.id === "tracking" && !c.passed)) {
    add({
      title: nl ? "Tracking ontbreekt" : "Missing tracking",
      description: nl
        ? "Zonder tracking kan Performance Brain niet betrouwbaar evalueren."
        : "Without tracking, Performance Brain cannot evaluate reliably.",
      probability: "medium",
      impact: "high",
      mitigation: nl ? "Tracking implementeren vóór paid scale." : "Implement tracking before paid scale.",
      fallback: nl ? "Handmatige UTM-review en demo-tracking." : "Manual UTM review and demo tracking.",
      reviewTrigger: nl ? "Vóór eerste paid activatie" : "Before first paid activation",
      linkedNodeIds: input.nodes.filter((n) => /channel|ads/i.test(n.title)).map((n) => n.id),
    });
  }

  if (input.strategyGraph.primaryAudience.confidence === "low") {
    add({
      title: nl ? "Lage confidence doelgroep" : "Low confidence audience",
      description: input.strategyGraph.primaryAudience.description,
      probability: "medium",
      impact: "high",
      mitigation: nl ? "Smalle eerste test met meetbare feedback-loop." : "Narrow first test with measurable feedback loop.",
      fallback: nl ? "Pauzeer paid scale tot audience is bevestigd." : "Pause paid scale until audience is confirmed.",
      reviewTrigger: nl ? "Na eerste 100 bezoekers of 500 impressies" : "After first 100 visitors or 500 impressions",
      linkedNodeIds: [],
    });
  }

  if (input.strategyGraph.valueProposition.confidence === "low") {
    add({
      title: nl ? "Zwakke waardepropositie" : "Weak value proposition",
      description: input.strategyGraph.valueProposition.description,
      probability: "medium",
      impact: "critical",
      mitigation: nl ? "Versterk proof points vóór brede distributie." : "Strengthen proof points before broad distribution.",
      fallback: nl ? "Focus op 1 kanaal met directe feedback." : "Focus on one channel with direct feedback.",
      reviewTrigger: nl ? "Na eerste campagneresultaten" : "After first campaign results",
      linkedNodeIds: [],
    });
  }

  if (input.readiness.checks.some((c) => c.id === "brand_completeness" && !c.passed)) {
    add({
      title: nl ? "Onvoldoende merkcontext" : "Insufficient brand information",
      description: nl
        ? "Creative en Pixel Brain missen bevestigde merkfeiten."
        : "Creative and Pixel Brain lack confirmed brand facts.",
      probability: "medium",
      impact: "high",
      mitigation: nl ? "Brand Brain verrijken vóór creative generatie." : "Enrich Brand Brain before creative generation.",
      fallback: nl ? "Conservatieve creative richting met expliciete review." : "Conservative creative direction with explicit review.",
      reviewTrigger: nl ? "Vóór creative generatie" : "Before creative generation",
      linkedNodeIds: input.nodes.filter((n) => n.ownerBrain === "creative").map((n) => n.id),
    });
  }

  if (input.readiness.checks.some((c) => c.id === "customer_approval" && !c.passed)) {
    add({
      title: nl ? "Goedkeuringsvertraging" : "Approval delay",
      description: nl
        ? "Executie wacht op klantbevestiging."
        : "Execution waits for customer confirmation.",
      probability: "medium",
      impact: "medium",
      mitigation: nl ? "Eén executive review — geen stap-voor-stap wizard." : "One executive review — no step-by-step wizard.",
      fallback: nl ? "Emma houdt planning klaar tot approval binnen is." : "Emma keeps plan ready until approval arrives.",
      reviewTrigger: nl ? "Bij approval of na 48u zonder reactie" : "On approval or after 48h without response",
      linkedNodeIds: [],
    });
  }

  return risks;
}

export function buildPlanningReviewMoments(input: {
  campaignGoal: string;
  locale: "nl" | "en";
}): import("./types").PlanningReviewMoment[] {
  const nl = input.locale === "nl";
  return [
    {
      id: "review-7d",
      title: nl ? "Review na 7 dagen" : "Review after 7 days",
      trigger: nl ? "7 dagen na launch" : "7 days after launch",
      purpose: nl
        ? `Eerste signalen: bereikt ${input.campaignGoal} traction?`
        : `Early signals: is ${input.campaignGoal} gaining traction?`,
    },
    {
      id: "review-30d",
      title: nl ? "Review na 30 dagen" : "Review after 30 days",
      trigger: nl ? "30 dagen na launch" : "30 days after launch",
      purpose: nl ? "Business impact evalueren en bijsturen." : "Evaluate business impact and adjust.",
    },
    {
      id: "review-visitors",
      title: nl ? "Review bij 100 bezoekers" : "Review at 100 visitors",
      trigger: nl ? "100 unieke bezoekers" : "100 unique visitors",
      purpose: nl ? "Conversiepad en landing page kwaliteit beoordelen." : "Assess conversion path and landing page quality.",
    },
    {
      id: "review-impressions",
      title: nl ? "Review bij 500 impressies" : "Review at 500 impressions",
      trigger: nl ? "500 impressies" : "500 impressions",
      purpose: nl ? "CTR en message-market fit beoordelen." : "Assess CTR and message-market fit.",
    },
    {
      id: "review-ctr",
      title: nl ? "CTR onder drempel" : "CTR below threshold",
      trigger: nl ? "CTR onder campagne-drempel" : "CTR below campaign threshold",
      purpose: nl ? "Creative of targeting herzien — Performance Brain input." : "Revise creative or targeting — Performance Brain input.",
    },
  ];
}
