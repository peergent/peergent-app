import type { CampaignDetailViewModel } from "./build-campaign-detail";
import { findCampaignProject } from "./build-campaign-detail";
import type { CampaignWorkflowStep, CampaignWorkflowStepId } from "./workflow-types";
import { officeHref } from "../links";
import { resolveCampaignBrainOutput } from "@/lib/brain/output";
import { mapCampaignExperienceFromBrain } from "@/lib/office/brain-output";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  CampaignBrainTimelineStep,
  CampaignCreativeAsset,
  CampaignCreativeAssetKind,
  CampaignExperienceChartMetric,
  CampaignExperienceModel,
  CampaignExperienceProgress,
  CampaignProgressStep,
  CampaignProgressStepState,
} from "./campaign-experience-types";

const WORKFLOW_TERMS =
  /\b(workflow|brain|capability|retry|step id|orchestrat|pipeline|agent runtime|langgraph|prompt|token)\b/i;

function sanitizeDetail(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  if (WORKFLOW_TERMS.test(text)) return null;
  return text.trim();
}

function demoChartPoints(nl: boolean, scale: number): { at: string; value: number }[] {
  const labels = nl
    ? ["Wk 1", "Wk 2", "Wk 3", "Wk 4"]
    : ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const base = [0.72, 0.84, 0.91, 1].map((m) => Math.round(scale * m));
  return labels.map((at, index) => ({ at, value: base[index] ?? scale }));
}

function buildPerformanceMetrics(
  model: CampaignDetailViewModel,
  nl: boolean
): CampaignExperienceChartMetric[] {
  const mk = (
    id: CampaignExperienceChartMetric["id"],
    label: string,
    heroValue: string,
    scale: number,
    insight: string,
    valueFormat: CampaignExperienceChartMetric["valueFormat"],
    delta = "+12%"
  ): CampaignExperienceChartMetric => ({
    id,
    label,
    heroValue,
    delta,
    deltaPositive: !delta.startsWith("-"),
    chartLabel: label,
    points: demoChartPoints(nl, scale),
    insight,
    valueFormat,
  });

  const topMetric = model.resultsViewModel.metrics[0];
  const channelNote = model.channels.length
    ? nl
      ? `${model.channels.join(" en ")} drijven deze campagne.`
      : `${model.channels.join(" and ")} drive this campaign.`
    : "";

  if (model.lifecycleStatus !== "published" || !model.optimizationHasData) {
    return [];
  }

  return [
    mk(
        "revenue",
        nl ? "Omzet" : "Revenue",
        model.resultsViewModel.metrics.find((m) => m.group === "financial")?.value ?? "€ 2,1k",
        2100,
        nl
          ? `Omzet groeit gestaag over de campagneperiode. ${channelNote}`
          : `Revenue is growing steadily across the campaign period. ${channelNote}`,
        "currency"
      ),
      mk(
        "leads",
        nl ? "Leads" : "Leads",
        model.resultsViewModel.metrics.find((m) => m.id === "leads")?.value ?? "12",
        12,
        nl ? "Leadkwaliteit blijft boven verwachting." : "Lead quality remains above expectation.",
        "number",
        "+18%"
      ),
      mk(
        "ctr",
        "CTR",
        "4,1%",
        41,
        nl ? "CTR blijft boven branchegemiddelde." : "CTR remains above industry average.",
        "percent",
        "+6%"
      ),
      mk(
        "roas",
        "ROAS",
        "3,2×",
        32,
        nl ? "ROAS houdt stand terwijl spend stabiel blijft." : "ROAS holds while spend stays flat.",
        "multiplier",
        "+9%"
      ),
      mk(
        "spend",
        nl ? "Spend" : "Spend",
        "€ 840",
        840,
        nl ? "Spend blijft binnen budget." : "Spend remains within budget.",
        "currency",
        "-2%"
      ),
      mk(
        "conversions",
        nl ? "Conversies" : "Conversions",
        model.resultsViewModel.metrics.find((m) => m.id === "conversions")?.value ?? "8",
        8,
        nl ? "Conversies volgen leadtrend." : "Conversions follow the lead trend.",
        "number",
        "+14%"
      ),
    ];
}

function assetKindForChannel(channel: string | undefined): CampaignCreativeAssetKind {
  switch (channel) {
    case "linkedin":
      return "linkedin";
    case "google_ads":
      return "ads";
    case "email":
    case "newsletter":
      return "email";
    case "blog":
      return "blog";
    case "website_landing":
      return "landing";
    default:
      return "display";
  }
}

function statusToneFromDraftStatus(
  status: string
): CampaignCreativeAsset["statusTone"] {
  if (status === "published") return "live";
  if (status === "ready_to_publish") return "scheduled";
  if (status === "ready_for_review") return "review";
  return "draft";
}

function buildCreativeAssets(model: CampaignDetailViewModel, nl: boolean): CampaignCreativeAsset[] {
  const assets: CampaignCreativeAsset[] = [];
  const seen = new Set<string>();

  for (const draft of model.producedDrafts) {
    const channel = draft.channel ?? "content";
    if (seen.has(channel)) continue;
    seen.add(channel);

    const kind = assetKindForChannel(draft.channel ?? undefined);
    const channelLabels: Record<string, string> = {
      linkedin: "LinkedIn",
      google_ads: nl ? "Google Ads" : "Google Ads",
      email: "Email",
      newsletter: nl ? "E-mail" : "Email",
      blog: "Blog",
      website_landing: nl ? "Landingspagina" : "Landing page",
    };

    assets.push({
      id: draft.id,
      kind,
      channelLabel: channelLabels[channel] ?? channel,
      title: draft.title || (channelLabels[channel] ?? "Asset"),
      preview: (draft.body ?? draft.objective ?? "").slice(0, 220).trim(),
      statusLabel:
        draft.status === "published"
          ? "Live"
          : draft.status === "ready_for_review"
            ? nl
              ? "Wacht op goedkeuring"
              : "Awaiting review"
            : draft.status === "ready_to_publish"
              ? nl
                ? "Gepland"
                : "Scheduled"
              : nl
                ? "Concept"
                : "Draft",
      statusTone: statusToneFromDraftStatus(draft.status),
      href: `/office/${model.peerId}/content/${draft.id}`,
    });
  }

  for (const item of [...model.completed, ...model.pending]) {
    if (!item.channel || seen.has(item.channel)) continue;
    seen.add(item.channel);
    assets.push({
      id: item.id,
      kind: assetKindForChannel(item.channel),
      channelLabel: item.label,
      title: item.label,
      preview: item.description ?? item.evidence?.slice(0, 220) ?? "",
      statusLabel:
        item.kind === "pending"
          ? nl
            ? "Wacht op goedkeuring"
            : "Awaiting review"
          : "Live",
      statusTone: item.kind === "pending" ? "review" : "live",
      href: item.detailHref ?? item.previewHref ?? null,
    });
  }

  return assets;
}

const BRAIN_STEP_DEFS: readonly {
  id: string;
  en: string;
  nl: string;
  workflowIds: readonly CampaignWorkflowStepId[];
}[] = [
  {
    id: "business",
    en: "Business researched",
    nl: "Bedrijf onderzocht",
    workflowIds: ["business_analyzed", "website_analyzed"],
  },
  {
    id: "competitors",
    en: "Competitors analyzed",
    nl: "Concurrenten geanalyseerd",
    workflowIds: ["competitors_analyzed"],
  },
  {
    id: "audience",
    en: "Target audience defined",
    nl: "Doelgroep bepaald",
    workflowIds: ["strategy_determined"],
  },
  {
    id: "strategy",
    en: "Strategy generated",
    nl: "Strategie gegenereerd",
    workflowIds: ["strategy_determined", "channels_selected"],
  },
  {
    id: "content",
    en: "Content created",
    nl: "Content gemaakt",
    workflowIds: ["deliverables_created"],
  },
  {
    id: "approval",
    en: "Waiting for approval",
    nl: "Wacht op goedkeuring",
    workflowIds: ["waiting_for_approval"],
  },
  {
    id: "published",
    en: "Published",
    nl: "Gepubliceerd",
    workflowIds: ["published"],
  },
  {
    id: "optimizing",
    en: "Optimizing",
    nl: "Optimaliseren",
    workflowIds: ["optimizing"],
  },
];

function resolveBrainState(
  steps: readonly CampaignWorkflowStep[],
  workflowIds: readonly CampaignWorkflowStepId[]
): CampaignBrainTimelineStep["state"] {
  const matched = workflowIds
    .map((id) => steps.find((s) => s.id === id))
    .filter(Boolean) as CampaignWorkflowStep[];

  if (matched.length === 0) return "upcoming";
  if (matched.some((s) => s.state === "active")) return "active";
  if (matched.every((s) => s.state === "done" || s.state === "skipped")) {
    return matched.some((s) => s.state === "skipped") ? "skipped" : "done";
  }
  if (matched.some((s) => s.state === "done")) return "active";
  return "upcoming";
}

function detailForBrainStep(
  steps: readonly CampaignWorkflowStep[],
  workflowIds: readonly CampaignWorkflowStepId[],
  nl: boolean
): string | null {
  const step = workflowIds
    .map((id) => steps.find((s) => s.id === id))
    .find((s) => s && (s.state === "done" || s.state === "active"));

  if (!step) return null;

  const fromHint = sanitizeDetail(step.statusHint);
  if (fromHint) return fromHint;

  const firstItem = step.evidenceSections.flatMap((s) => s.items)[0];
  return sanitizeDetail(firstItem);
}

function buildBrainTimeline(
  model: CampaignDetailViewModel,
  nl: boolean
): CampaignBrainTimelineStep[] {
  const steps = model.workflow.steps;

  return BRAIN_STEP_DEFS.map((def) => ({
    id: def.id,
    label: nl ? def.nl : def.en,
    state: resolveBrainState(steps, def.workflowIds),
    detail: detailForBrainStep(steps, def.workflowIds, nl),
  }));
}

function mapBrainStateToProgress(
  state: CampaignBrainTimelineStep["state"]
): CampaignProgressStepState {
  if (state === "done" || state === "skipped") return "done";
  if (state === "active") return "waiting";
  return "upcoming";
}

function buildProgressExpansion(
  step: CampaignBrainTimelineStep,
  model: CampaignDetailViewModel,
  nl: boolean
): CampaignProgressStep["expansion"] {
  if (!step.detail && step.state === "upcoming") return null;

  const detail = step.detail ?? "";
  const goal = model.goal.trim() || model.why.trim();

  const defaults: Record<string, CampaignProgressStep["expansion"]> = {
    business: {
      whatHappened: detail || (nl ? "Markt- en bedrijfscontext vastgelegd." : "Market and company context captured."),
      whyItHappened: nl
        ? "Elke campagne begint met begrip van je marktpositie en klantbehoeften."
        : "Every campaign starts with understanding your market position and customer needs.",
      businessImpact: nl
        ? "Strategie sluit aan op je merk en groeidoel."
        : "Strategy aligns with your brand and growth goal.",
      decisionTaken: null,
    },
    competitors: {
      whatHappened: detail || (nl ? "Concurrentielandschap in kaart gebracht." : "Competitive landscape mapped."),
      whyItHappened: nl
        ? "Positionering bepaalt hoe je opvalt vóór Q4-budgetbeslissingen."
        : "Positioning determines how you stand out before Q4 budget decisions.",
      businessImpact: nl ? "Differentiatie versterkt conversie." : "Differentiation strengthens conversion.",
      decisionTaken: null,
    },
    audience: {
      whatHappened: detail || (nl ? "Doelgroep en koopintentie gedefinieerd." : "Audience and buying intent defined."),
      whyItHappened: nl
        ? "Budget gaat naar prospects met hoogste koopkans."
        : "Budget targets prospects with the highest purchase likelihood.",
      businessImpact: nl ? "Lagere CPC en hogere leadkwaliteit." : "Lower CPC and higher lead quality.",
      decisionTaken: null,
    },
    strategy: {
      whatHappened: detail || (nl ? "Kanaal- en boodschapstrategie vastgesteld." : "Channel and messaging strategy set."),
      whyItHappened: goal
        ? nl
          ? `Ondersteunt: ${goal.replace(/\.$/, "")}.`
          : `Supports: ${goal.replace(/\.$/, "")}.`
        : nl
          ? "Maximaliseert bereik vóór het budgetseizoen."
          : "Maximizes reach before budget season.",
      businessImpact: nl ? "Coherente boodschap over kanalen." : "Coherent message across channels.",
      decisionTaken: null,
    },
    content: {
      whatHappened: detail || (nl ? "Deliverables klaar voor publicatie." : "Deliverables ready for publication."),
      whyItHappened: nl
        ? "Content is afgestemd op de goedgekeurde strategie."
        : "Content matches the approved strategy.",
      businessImpact: nl
        ? "Drie deliverables klaar; één goedkeuring resterend."
        : "Three deliverables complete; one approval remains.",
      decisionTaken: null,
    },
    approval: {
      whatHappened: detail || (nl ? "Goedkeuring wacht op jouw beslissing." : "Approval awaits your decision."),
      whyItHappened: nl
        ? "Publicatie start pas na jouw akkoord."
        : "Publishing only starts after your sign-off.",
      businessImpact: nl
        ? "Automatische deployment kan direct na goedkeuring starten."
        : "Automatic deployment can start immediately after approval.",
      decisionTaken: nl ? "Review en keur goed om live te gaan." : "Review and approve to go live.",
    },
    published: {
      whatHappened: detail || (nl ? "Campagne live op geselecteerde kanalen." : "Campaign live on selected channels."),
      whyItHappened: nl ? "Timing sluit aan op het campagnedoel." : "Timing aligns with the campaign goal.",
      businessImpact: nl ? "Eerste resultaten binnen 48 uur verwacht." : "First results expected within 48 hours.",
      decisionTaken: nl ? "Live gezet na goedkeuring." : "Published after approval.",
    },
    optimizing: {
      whatHappened: detail || (nl ? "Performance wordt actief bijgestuurd." : "Performance is being actively tuned."),
      whyItHappened: nl
        ? "Budget verschuift naar best presterende kanalen."
        : "Budget shifts to best-performing channels.",
      businessImpact: nl ? "ROAS en leadvolume verbeteren." : "ROAS and lead volume improve.",
      decisionTaken: null,
    },
  };

  return defaults[step.id] ?? (detail
    ? {
        whatHappened: detail,
        whyItHappened: nl ? "Onderdeel van het campagneplan." : "Part of the campaign plan.",
        businessImpact: nl ? "Bijdraagt aan campagnedoel." : "Contributes to campaign goal.",
        decisionTaken: null,
      }
    : null);
}

function buildCampaignProgress(
  timeline: readonly CampaignBrainTimelineStep[],
  model: CampaignDetailViewModel,
  nl: boolean
): CampaignExperienceProgress {
  const steps: CampaignProgressStep[] = timeline.map((step) => ({
    id: step.id,
    label: step.label,
    state: mapBrainStateToProgress(step.state),
    expansion: buildProgressExpansion(step, model, nl),
  }));

  const doneCount = steps.filter((s) => s.state === "done").length;
  const waitingCount = steps.filter((s) => s.state === "waiting").length;
  const percent = Math.min(
    100,
    Math.round(((doneCount + waitingCount * 0.5) / steps.length) * 100)
  );

  let statusHeadline = nl ? "Campagne bijna klaar." : "Campaign almost ready.";
  if (percent >= 100) {
    statusHeadline = nl ? "Campagne live en optimaliserend." : "Campaign live and optimizing.";
  } else if (percent < 50) {
    statusHeadline = nl ? "Campagne in opbouw." : "Campaign in progress.";
  } else if (waitingCount > 0) {
    statusHeadline = nl ? "Campagne bijna klaar." : "Campaign almost ready.";
  }

  return { percent, statusHeadline, steps };
}

function buildExecutiveBrief(model: CampaignDetailViewModel, nl: boolean): CampaignExperienceModel["brief"] {
  const goal = model.goal.trim() || model.why.trim();
  const next = model.workflow.nextStep?.replace(/\.$/, "") ?? "";
  const deliverableCount = model.workflow.steps.find((s) => s.id === "deliverables_created")?.state === "done"
    ? 3
    : model.workflow.steps.filter((s) => s.state === "done").length;
  const approvalPending = model.workflow.approvalCenter.count > 0;

  let expectedImpact = nl ? "€8.400 extra omzet over zes weken." : "€8,400 additional revenue over six weeks.";
  if (model.resultsViewModel.hasSufficientData && model.optimizationMetrics.length) {
    expectedImpact = model.optimizationMetrics
      .slice(0, 2)
      .map((m) => `${m.label} ${m.value}`)
      .join(nl ? " · " : " · ");
  }

  const executiveSummary = nl
    ? `Deze campagne is ontworpen om bedrijven te bereiken vóór Q4-budgetbeslissingen.`
    : `This campaign is designed to capture companies before Q4 budgeting begins.`;

  const businessGoal = goal
    ? goal.replace(/\.$/, "")
    : nl
      ? "Groei in gekwalificeerde leads vóór het budgetseizoen"
      : "Grow qualified leads before budget season";

  const currentStatus = approvalPending
    ? nl
      ? `${deliverableCount} deliverables klaar voor publicatie. Één goedkeuring resterend.`
      : `${deliverableCount} deliverables complete and ready for publication. One approval remains.`
    : nl
      ? `Status: ${model.statusLabel}. Klaar voor de volgende fase.`
      : `Status: ${model.statusLabel}. Ready for the next phase.`;

  const nextDecision = next
    ? next
    : approvalPending
      ? nl
        ? "Keur de resterende deliverables goed om automatische deployment te starten."
        : "Approve remaining deliverables to start automatic deployment."
      : nl
        ? "Monitor prestaties en schaal het best presterende kanaal."
        : "Monitor performance and scale the top-performing channel.";

  const narrative = nl
    ? `${executiveSummary} ${currentStatus} Automatische deployment kan direct na goedkeuring starten. Verwachte impact: ${expectedImpact}`
    : `${executiveSummary} ${currentStatus} Automatic deployment can start immediately after approval. Expected impact: ${expectedImpact}`;

  return {
    narrative,
    sections: {
      executiveSummary,
      researchFindings: nl
        ? "Research bracht markt en concurrentie in kaart."
        : "Research mapped market and competition.",
      audienceInsight: businessGoal,
      strategicDecision: businessGoal,
      creativeDirection: currentStatus,
      expectedBusinessImpact: expectedImpact,
      nextRecommendation: nextDecision,
    },
  };
}

function buildRecommendation(
  model: CampaignDetailViewModel,
  nl: boolean
): CampaignExperienceModel["recommendation"] {
  const rec =
    model.resultsViewModel.emmaRecommendations[0] ??
    model.resultsViewModel.suggestedActions[0]?.label;

  if (!rec) {
    if (model.workflow.approvalCenter.count > 0) return null;
    if (model.lifecycleStatus === "published" && model.resultsViewModel.emmaNextOptimization) {
      return {
        headline: model.resultsViewModel.emmaNextOptimization,
        impact: model.resultsViewModel.emmaAnalysis,
        primaryLabel: nl ? "Bekijk optimalisatie" : "View optimization",
        href: null,
        impactMetrics: undefined,
      };
    }
    return null;
  }

  return {
    headline: rec,
    impact: model.resultsViewModel.emmaAnalysis || model.resultsViewModel.emmaWhy,
    primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
    href: model.performanceActionable ? `${model.detailHref}?view=results` : null,
    impactMetrics: model.resultsViewModel.suggestedActions.slice(0, 2).map((a) => ({
      id: a.id,
      label: a.label,
    })),
  };
}

export function buildCampaignExperienceModel(
  model: CampaignDetailViewModel,
  input: {
    locale?: string | null;
    updatedAtLabel?: string | null;
    domainInput?: MarketingPeerDomainInput;
    isDemo?: boolean;
  } = {}
): CampaignExperienceModel {
  const nl = input.locale === "nl";
  const metrics = buildPerformanceMetrics(model, nl);
  const isLive =
    model.lifecycleStatus === "published" ||
    model.workflow.steps.some(
      (s) => (s.id === "published" || s.id === "optimizing") && s.state === "active"
    ) ||
    /live|published|actief|running|optimalis/i.test(model.statusLabel);

  const performance =
    metrics.length > 0 && metrics[0]!.points.length >= 2
      ? {
          periodLabel: nl ? "Campagneperiode" : "Campaign period",
          title: nl ? "Campagneresultaten" : "Campaign performance",
          metrics,
          defaultMetricId: metrics[0]!.id,
        }
      : metrics.length > 0
        ? {
            periodLabel: nl ? "Campagneperiode" : "Campaign period",
            title: nl ? "Campagneresultaten" : "Campaign performance",
            metrics: metrics.filter((m) => m.points.length >= 2),
            defaultMetricId: metrics.find((m) => m.points.length >= 2)?.id ?? "leads",
          }
        : null;

  const brainTimeline = buildBrainTimeline(model, nl);

  const project =
    input.domainInput != null
      ? findCampaignProject(input.domainInput, model.projectId)
      : null;

  const brainOutput =
    project != null
      ? resolveCampaignBrainOutput({
          project,
          domainInput: input.domainInput!,
          locale: input.locale,
          isDemo: input.isDemo,
          workflowSteps: model.workflow.steps,
          statusLabel: model.statusLabel,
          recommendationHref: model.performanceActionable
            ? `${model.detailHref}?view=results`
            : null,
        })
      : null;

  const brainSlices = brainOutput
    ? mapCampaignExperienceFromBrain({
        brain: brainOutput,
        nl,
        performanceHref: model.performanceActionable ? `${model.detailHref}?view=results` : null,
      })
    : null;

  const progress = brainSlices?.progress ?? buildCampaignProgress(brainTimeline, model, nl);
  const brief = brainSlices?.brief ?? buildExecutiveBrief(model, nl);
  const recommendation = brainSlices?.recommendation ?? buildRecommendation(model, nl);
  const assets = brainSlices?.assets ?? buildCreativeAssets(model, nl);
  const activity = brainSlices?.activity ?? model.activityItems.map((item) => ({
    id: item.id,
    timestamp: item.timeLabel,
    timeLabel: item.timeLabel,
    message: item.description ? `${item.title} — ${item.description}` : item.title,
    href: null,
  }));

  return {
    peerId: model.peerId,
    projectId: model.projectId,
    backHref: officeHref(model.peerId, "desk"),
    header: {
      title: model.name,
      statusLabel: model.statusLabel,
      isLive,
      channelLabel: model.channels.join(nl ? " · " : " · ") || (nl ? "Multi-channel" : "Multi-channel"),
      objective: model.goal || model.why || (nl ? "Marketingcampagne" : "Marketing campaign"),
      ownerLabel: model.ownerLabel || (nl ? "Jij" : "You"),
      createdLabel: model.createdAtLabel,
      updatedLabel: input.updatedAtLabel ?? model.createdAtLabel,
    },
    brief,
    performance:
      performance && performance.metrics.length > 0
        ? performance
        : null,
    assets,
    progress,
    brainTimeline,
    recommendation,
    activity,
  };
}
