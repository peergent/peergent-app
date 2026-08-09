import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import type { Decision } from "@/lib/brain/decision/decision-types";
import type { CampaignWorkflowStep, CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import { customerTextOrFallback, sanitizeCustomerText } from "../sanitize";
import type { ProgressNarrative, ProgressStepNarrative, ProgressStepState } from "../types";

const PROGRESS_STEP_DEFS: readonly {
  id: string;
  en: string;
  nl: string;
  workflowIds: readonly CampaignWorkflowStepId[];
  source: ProgressStepNarrative["source"];
  narrativeEn: (ctx: ProgressNarrativeContext) => string;
  narrativeNl: (ctx: ProgressNarrativeContext) => string;
}[] = [
  {
    id: "business",
    en: "Business researched",
    nl: "Bedrijf onderzocht",
    workflowIds: ["business_analyzed", "website_analyzed"],
    source: "research",
    narrativeEn: (ctx) =>
      ctx.competitorFinding
        ? `We analysed your market footprint${ctx.competitorFinding ? ` and ${ctx.competitorFinding}` : ""}.`
        : "We researched your business context and market position.",
    narrativeNl: (ctx) =>
      ctx.competitorFinding
        ? `We analyseerden je markt${ctx.competitorFinding ? ` en ${ctx.competitorFinding}` : ""}.`
        : "We onderzochten je bedrijfscontext en marktpositie.",
  },
  {
    id: "competitors",
    en: "Competitors analyzed",
    nl: "Concurrenten geanalyseerd",
    workflowIds: ["competitors_analyzed"],
    source: "research",
    narrativeEn: (ctx) =>
      ctx.competitorCount
        ? `We analysed ${ctx.competitorCount} competitors and identified pricing and positioning gaps.`
        : "We mapped the competitive landscape and identified differentiation opportunities.",
    narrativeNl: (ctx) =>
      ctx.competitorCount
        ? `We analyseerden ${ctx.competitorCount} concurrenten en vonden prijs- en positioneringsgaten.`
        : "We bracht het concurrentielandschap in kaart en vonden differentiatiekansen.",
  },
  {
    id: "audience",
    en: "Audience defined",
    nl: "Doelgroep bepaald",
    workflowIds: ["strategy_determined"],
    source: "marketing_intelligence",
    narrativeEn: () => "We defined the target audience with highest purchase intent for this campaign.",
    narrativeNl: () => "We bepaalden de doelgroep met de hoogste koopintentie voor deze campagne.",
  },
  {
    id: "strategy",
    en: "Strategy created",
    nl: "Strategie gecreëerd",
    workflowIds: ["strategy_determined", "channels_selected"],
    source: "strategy",
    narrativeEn: (ctx) =>
      ctx.positioningDecision
        ? `We selected positioning around ${ctx.positioningDecision} because competitors focus elsewhere.`
        : "We selected a campaign strategy aligned with your strongest market opportunity.",
    narrativeNl: (ctx) =>
      ctx.positioningDecision
        ? `We kozen positionering rond ${ctx.positioningDecision} omdat concurrenten elders focussen.`
        : "We selecteerden een campagnestrategie afgestemd op je sterkste marktkans.",
  },
  {
    id: "content",
    en: "Content produced",
    nl: "Content geproduceerd",
    workflowIds: ["deliverables_created"],
    source: "creative",
    narrativeEn: (ctx) =>
      ctx.deliverableCount
        ? `${ctx.deliverableCount} deliverables are ready for publication.`
        : "Campaign content is prepared and ready for your review.",
    narrativeNl: (ctx) =>
      ctx.deliverableCount
        ? `${ctx.deliverableCount} deliverables zijn klaar voor publicatie.`
        : "Campagnecontent is voorbereid en klaar voor je review.",
  },
  {
    id: "approval",
    en: "Waiting for approval",
    nl: "Wacht op goedkeuring",
    workflowIds: ["waiting_for_approval"],
    source: "validation",
    narrativeEn: () => "One approval remains before automatic deployment can start.",
    narrativeNl: () => "Één goedkeuring resterend voordat automatische deployment kan starten.",
  },
  {
    id: "published",
    en: "Publishing",
    nl: "Publiceren",
    workflowIds: ["published"],
    source: "planning",
    narrativeEn: () => "Campaign is live on selected channels.",
    narrativeNl: () => "Campagne is live op geselecteerde kanalen.",
  },
  {
    id: "optimizing",
    en: "Optimizing",
    nl: "Optimaliseren",
    workflowIds: ["optimizing"],
    source: "optimization",
    narrativeEn: () => "Performance is being tuned — budget shifts to best-performing channels.",
    narrativeNl: () => "Performance wordt bijgestuurd — budget verschuift naar best presterende kanalen.",
  },
];

type ProgressNarrativeContext = {
  competitorCount: string | null;
  competitorFinding: string | null;
  positioningDecision: string | null;
  deliverableCount: number | null;
};

function resolveWorkflowState(
  steps: readonly CampaignWorkflowStep[],
  workflowIds: readonly CampaignWorkflowStepId[]
): ProgressStepState {
  const matched = workflowIds
    .map((id) => steps.find((s) => s.id === id))
    .filter(Boolean) as CampaignWorkflowStep[];

  if (matched.length === 0) return "upcoming";
  if (matched.some((s) => s.state === "active")) return "waiting";
  if (matched.every((s) => s.state === "done" || s.state === "skipped")) return "done";
  if (matched.some((s) => s.state === "done")) return "waiting";
  return "upcoming";
}

function buildContext(
  strategy: BrainStructuredOutput | undefined,
  decisions: readonly Decision[]
): ProgressNarrativeContext {
  const competitorFinding = strategy?.findings.find((f) =>
    /competitor|concurrent/i.test(f.label)
  )?.value;
  const competitorCount = competitorFinding?.match(/\d+/)?.[0] ?? null;
  const positioning = decisions.find((d) => d.category === "strategy_direction");

  return {
    competitorCount,
    competitorFinding: sanitizeCustomerText(competitorFinding),
    positioningDecision: sanitizeCustomerText(positioning?.recommendation ?? positioning?.summary),
    deliverableCount: null,
  };
}

export function publishProgressNarrative(input: {
  workflowSteps: readonly CampaignWorkflowStep[];
  strategy?: BrainStructuredOutput;
  decisions: readonly Decision[];
  deliverableCount?: number;
  nl: boolean;
}): ProgressNarrative {
  const nl = input.nl;
  const ctx = buildContext(input.strategy, input.decisions);
  if (input.deliverableCount != null) ctx.deliverableCount = input.deliverableCount;

  const steps: ProgressStepNarrative[] = PROGRESS_STEP_DEFS.map((def) => {
    const state = resolveWorkflowState(input.workflowSteps, def.workflowIds);
    const narrative = nl ? def.narrativeNl(ctx) : def.narrativeEn(ctx);

    return {
      id: def.id,
      label: nl ? def.nl : def.en,
      state,
      narrative,
      source: def.source,
      expansion: {
        whatHappened: narrative,
        whyItHappened: customerTextOrFallback(
          input.decisions.find((d) => d.category === "strategy_direction")?.reasoning,
          nl ? "Onderdeel van het campagneplan." : "Part of the campaign plan."
        ),
        businessImpact: customerTextOrFallback(
          input.decisions.find((d) => d.category === "strategy_direction")?.businessImpact,
          nl ? "Bijdraagt aan campagnedoel." : "Contributes to campaign goal."
        ),
        decisionTaken:
          state === "done"
            ? sanitizeCustomerText(
                input.decisions.find((d) => d.category === "strategy_direction")?.recommendation
              )
            : null,
      },
    };
  });

  const doneCount = steps.filter((s) => s.state === "done").length;
  const waitingCount = steps.filter((s) => s.state === "waiting").length;
  const percent = Math.min(
    100,
    Math.round(((doneCount + waitingCount * 0.5) / steps.length) * 100)
  );

  let statusHeadline = nl ? "Campagne bijna klaar." : "Campaign almost ready.";
  if (percent >= 100) statusHeadline = nl ? "Campagne live en optimaliserend." : "Campaign live and optimizing.";
  else if (percent < 50) statusHeadline = nl ? "Campagne in opbouw." : "Campaign in progress.";

  return { percent, statusHeadline, steps };
}
