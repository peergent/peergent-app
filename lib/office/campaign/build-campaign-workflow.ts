import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";
import { officeHref } from "../links";
import { resolveProjectIdForDraft } from "../attribution";
import { buildCampaignStepEvidence, isLiveBrainDeferredStep } from "./build-campaign-workflow-evidence";
import { buildCampaignContext } from "./campaign-context";
import { isCampaignScheduled as resolveCampaignScheduled } from "./campaign-schedule-state";
import {
  isCampaignPublished as resolveCampaignPublished,
  resolveCampaignPublishingState,
  resolvePublishedStepState,
  workflowStatusHintForStep,
} from "./campaign-lifecycle";
import { buildOptimizationMetrics } from "./campaign-optimization";
import {
  CampaignIntelligenceOrchestrator,
  orchestrationPrimaryActionToCta,
} from "./campaign-intelligence-orchestrator";
import { strategyOutputCurrent } from "./live-strategy-run-service";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import {
  executionModeFromApprovalMode,
  type CampaignApprovalItem,
  type CampaignDeliverable,
  type CampaignDeliverableStatus,
  type CampaignWorkflowStep,
  type CampaignWorkflowStepId,
  type CampaignWorkflowStepState,
  type CampaignWorkflowViewModel,
} from "./workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";

function channelLabel(channel: string, isNl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    instagram: { en: "Instagram", nl: "Instagram" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    email: { en: "Email", nl: "E-mail" },
    blog: { en: "Blog", nl: "Blog" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
  };
  return map[channel]?.[isNl ? "nl" : "en"] ?? channel;
}

function deliverableStatus(
  draft: MarketingContentDraft,
  isNl: boolean
): { status: CampaignDeliverableStatus; label: string } {
  switch (draft.status) {
    case "ready_for_review":
      return {
        status: "ready_for_review",
        label: isNl ? "Wacht op goedkeuring" : "Waiting for approval",
      };
    case "approved":
      return { status: "approved", label: isNl ? "Goedgekeurd" : "Approved" };
    case "ready_to_publish":
      return { status: "scheduled", label: isNl ? "Ingepland" : "Scheduled" };
    case "published":
      return { status: "published", label: isNl ? "Gepubliceerd" : "Published" };
    case "rejected":
      return { status: "rejected", label: isNl ? "Afgewezen" : "Rejected" };
    default:
      return { status: "draft", label: isNl ? "In productie" : "In production" };
  }
}

function stepLabels(isNl: boolean): Record<CampaignWorkflowStepId, string> {
  return isNl
    ? {
        business_analyzed: "Bedrijf geanalyseerd",
        website_analyzed: "Website geanalyseerd",
        competitors_analyzed: "Concurrenten geanalyseerd",
        strategy_determined: "Strategie bepaald",
        channels_selected: "Kanalen gekozen",
        deliverables_created: "Deliverables gemaakt",
        waiting_for_approval: "Wacht op goedkeuring",
        scheduled: "Ingepland",
        published: "Gepubliceerd",
        optimizing: "Optimaliseren",
      }
    : {
        business_analyzed: "Business analyzed",
        website_analyzed: "Website analyzed",
        competitors_analyzed: "Competitors analyzed",
        strategy_determined: "Strategy determined",
        channels_selected: "Channels selected",
        deliverables_created: "Deliverables created",
        waiting_for_approval: "Waiting for approval",
        scheduled: "Scheduled",
        published: "Published",
        optimizing: "Optimizing",
      };
}

function executionModeLabel(
  mode: ReturnType<typeof executionModeFromApprovalMode>,
  setupMode: "automatic" | "manual" | undefined,
  isNl: boolean
): string {
  const modeText =
    mode === "manual"
      ? isNl
        ? "Emma wacht op jou vóór elke stap"
        : "Emma waits before each step"
      : mode === "fully_automatic"
        ? isNl
          ? "Emma voert alles uit — jij volgt mee"
          : "Emma runs everything — you monitor"
        : isNl
          ? "Emma maakt, jij keurt goed"
          : "Emma creates, you approve";

  if (setupMode === "automatic") {
    return isNl
      ? `Automatische campagne — ${modeText}`
      : `Automatic campaign — ${modeText}`;
  }
  if (setupMode === "manual") {
    return isNl ? `Handmatige campagne — ${modeText}` : `Manual campaign — ${modeText}`;
  }
  return modeText;
}

function resolveStepState(
  stepId: CampaignWorkflowStepId,
  ctx: {
    hasDrafts: boolean;
    pendingCount: number;
    approvedCount: number;
    publishedCount: number;
    readyToPublishCount: number;
    isCampaignScheduled: boolean;
    isCampaignPublished: boolean;
    isDemo?: boolean;
    publishingState?: import("./campaign-lifecycle").CampaignPublishingState;
    scheduledCount: number;
    projectStatus: ReturnType<typeof deriveProjectStatus>;
    isNewCampaign: boolean;
    stepApprovals?: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
    deliverablesUnlocked?: boolean;
    campaignContext?: ReturnType<typeof buildCampaignContext>;
  }
): CampaignWorkflowStepState {
  if (ctx.stepApprovals) {
    return resolveStepStateWithApprovals(stepId, ctx);
  }

  const researchDone = !ctx.isNewCampaign || ctx.hasDrafts;
  const strategyDone = researchDone;
  const channelsDone = ctx.hasDrafts;
  const deliverablesDone = ctx.hasDrafts;
  const hasPending = ctx.pendingCount > 0;
  const hasPublished = ctx.publishedCount > 0;
  const monitoring = ctx.projectStatus === "monitoring_results";

  const done = new Set<CampaignWorkflowStepId>();
  if (researchDone) {
    done.add("business_analyzed");
    done.add("website_analyzed");
    done.add("competitors_analyzed");
  }
  if (strategyDone) done.add("strategy_determined");
  if (channelsDone) done.add("channels_selected");
  if (deliverablesDone) done.add("deliverables_created");
  if (!hasPending && deliverablesDone && !hasPublished) {
    done.add("waiting_for_approval");
  }
  if (ctx.scheduledCount > 0 || ctx.projectStatus === "scheduled") done.add("scheduled");
  if (hasPublished) done.add("published");
  if (monitoring) done.add("optimizing");

  let active: CampaignWorkflowStepId | null = null;
  if (hasPending) active = "waiting_for_approval";
  else if (ctx.projectStatus === "preparing" || ctx.projectStatus === "planning") {
    active = ctx.hasDrafts ? "deliverables_created" : "strategy_determined";
  } else if (ctx.projectStatus === "waiting_for_review") active = "waiting_for_approval";
  else if (ctx.projectStatus === "scheduled") active = "scheduled";
  else if (ctx.projectStatus === "publishing") active = "published";
  else if (monitoring) active = "optimizing";
  else if (hasPublished && !monitoring) active = "published";

  if (done.has(stepId)) return "done";
  if (active === stepId) return "active";
  return "upcoming";
}

function resolveStepStateWithApprovals(
  stepId: CampaignWorkflowStepId,
  ctx: {
    hasDrafts: boolean;
    pendingCount: number;
    approvedCount: number;
    publishedCount: number;
    readyToPublishCount: number;
    isCampaignScheduled: boolean;
    isCampaignPublished: boolean;
    isDemo?: boolean;
    publishingState?: import("./campaign-lifecycle").CampaignPublishingState;
    projectStatus: ReturnType<typeof deriveProjectStatus>;
    stepApprovals?: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
    deliverablesUnlocked?: boolean;
    campaignContext?: ReturnType<typeof buildCampaignContext>;
  }
): CampaignWorkflowStepState {
  const approvals = ctx.stepApprovals ?? {};
  const cc = ctx.campaignContext;

  const researchSteps: CampaignWorkflowStepId[] = [
    "business_analyzed",
    "website_analyzed",
    "competitors_analyzed",
  ];
  const preScheduleSteps: CampaignWorkflowStepId[] = [
    ...researchSteps,
    "strategy_determined",
    "channels_selected",
    "deliverables_created",
    "waiting_for_approval",
  ];

  if (ctx.isCampaignPublished) {
    if (stepId === "optimizing") return "active";
    if (preScheduleSteps.includes(stepId) || stepId === "scheduled" || stepId === "published") {
      return "done";
    }
  }

  if (ctx.isCampaignScheduled && !ctx.isCampaignPublished) {
    if (preScheduleSteps.includes(stepId) || stepId === "scheduled") return "done";
    if (stepId === "published") {
      return resolvePublishedStepState({
        isCampaignScheduled: true,
        isCampaignPublished: false,
        isDemo: false,
        publishingState: "not_configured",
      });
    }
  }

  if (approvals[stepId] === "approved") {
    if (stepId === "website_analyzed" && cc?.websiteState === "skipped") return "skipped";
    if (stepId === "competitors_analyzed" && cc?.competitorContextState === "skipped") {
      return "skipped";
    }
    return "done";
  }

  // Competitors step complete when supplied or simulated (not when skipped — handled above)
  if (
    stepId === "competitors_analyzed" &&
    cc &&
    cc.competitorContextState !== "skipped" &&
    (cc.competitorContextState === "simulated_analysis_complete" ||
      cc.competitorContextState === "simulated" ||
      cc.competitorContextState === "real_analysis_complete" ||
      cc.competitorContextState === "available")
  ) {
    return "done";
  }

  if (
    !ctx.isCampaignScheduled &&
    ctx.pendingCount === 0 &&
    (ctx.approvedCount > 0 || approvals.deliverables_created === "approved") &&
    (stepId === "deliverables_created" || stepId === "waiting_for_approval")
  ) {
    return "done";
  }

  if (
    approvals.deliverables_created === "approved" &&
    ctx.pendingCount === 0 &&
    stepId === "waiting_for_approval"
  ) {
    return "done";
  }

  if (ctx.pendingCount > 0 && stepId === "waiting_for_approval") return "active";

  const gateOrder: CampaignWorkflowStepId[] = [
    "business_analyzed",
    "website_analyzed",
    "competitors_analyzed",
    "strategy_determined",
    "channels_selected",
    "deliverables_created",
    "waiting_for_approval",
    "scheduled",
    "published",
    "optimizing",
  ];

  const applicableGate = gateOrder.filter((step) => {
    if (
      step === "competitors_analyzed" &&
      cc?.isSeedCampaign &&
      cc.competitorContextState === "missing"
    ) {
      return false;
    }
    return true;
  });

  let activeStep: CampaignWorkflowStepId | null = null;

  if (ctx.pendingCount > 0) {
    activeStep = "waiting_for_approval";
  } else if (ctx.isCampaignPublished) {
    activeStep = "optimizing";
  } else if (ctx.isCampaignScheduled) {
    if (ctx.isDemo && ctx.publishingState && ctx.publishingState !== "not_configured") {
      activeStep = "published";
    }
  } else if (ctx.approvedCount > 0 && ctx.deliverablesUnlocked && ctx.pendingCount === 0) {
    activeStep = "scheduled";
  } else if (
    approvals.deliverables_created === "approved" &&
    ctx.deliverablesUnlocked &&
    ctx.pendingCount === 0
  ) {
    activeStep = "scheduled";
  } else {
    for (const step of applicableGate) {
      if (approvals[step] === "approved") continue;
      activeStep = step;
      break;
    }
  }

  if (stepId === activeStep) return "active";
  const stepIndex = applicableGate.indexOf(stepId);
  const activeIndex = activeStep ? applicableGate.indexOf(activeStep) : -1;
  if (activeIndex >= 0 && stepIndex >= 0 && stepIndex < activeIndex) return "done";
  return "upcoming";
}

function buildNextStep(input: {
  pendingCount: number;
  approvedCount: number;
  isCampaignScheduled: boolean;
  isCampaignPublished: boolean;
  publishingState?: import("./campaign-lifecycle").CampaignPublishingState;
  activeStepId?: CampaignWorkflowStepId;
  locale?: string | null;
}): string {
  const isNl = input.locale === "nl";
  if (input.pendingCount > 0) {
    return isNl
      ? `Emma wacht op jouw goedkeuring — ${input.pendingCount} onderdeel${input.pendingCount > 1 ? "en" : ""}.`
      : `Emma is waiting for your approval — ${input.pendingCount} deliverable${input.pendingCount > 1 ? "s" : ""}.`;
  }
  if (input.isCampaignPublished) {
    return isNl
      ? "Campagne is live — bekijk gepubliceerde content en resultaten."
      : "Campaign is live — view published content and results.";
  }
  if (input.isCampaignScheduled) {
    if (input.publishingState === "not_configured" || !input.publishingState) {
      return isNl
        ? "Campagne is ingepland. Automatische publicatie is nog niet gekoppeld."
        : "Campaign is scheduled. Automatic publishing is not connected yet.";
    }
    return isNl
      ? "Campagne is ingepland — publicatie kan starten wanneer je klaar bent."
      : "Campaign is scheduled — publication can start when you are ready.";
  }
  if (input.approvedCount > 0 && input.pendingCount === 0) {
    return isNl
      ? "Alles is goedgekeurd — plan de campagne in voor publicatie."
      : "Everything is approved — schedule the campaign for publication.";
  }
  if (input.activeStepId === "strategy_determined") {
    return isNl ? "Emma heeft de strategie klaar — beoordeel en keur goed." : "Emma prepared the strategy — review and approve.";
  }
  if (input.activeStepId === "channels_selected") {
    return isNl ? "Emma heeft kanalen gekozen — beoordeel de keuze." : "Emma selected channels — review the plan.";
  }
  return isNl
    ? "Emma werkt aan de volgende stap van deze campagne."
    : "Emma is working on the next step of this campaign.";
}

function buildNextStepCta(input: {
  pendingCount: number;
  approvedCount: number;
  publishedCount: number;
  isCampaignScheduled: boolean;
  isCampaignPublished: boolean;
  isDemo: boolean;
  pendingDraftId?: string;
  activeStepId?: CampaignWorkflowStepId;
  locale?: string | null;
  websiteMissing?: boolean;
  optimizationHasData?: boolean;
}): CampaignWorkflowViewModel["nextStepCta"] {
  const isNl = input.locale === "nl";

  if (input.isCampaignPublished || input.publishedCount > 0) {
    if (input.optimizationHasData) {
      return {
        label: isNl ? "Bekijk resultaten →" : "View results →",
        action: "open_optimization",
        stepId: "optimizing",
      };
    }
    return {
      label: isNl ? "Resultaten worden verzameld" : "Results are being collected",
      action: "continue",
      stepId: "optimizing",
    };
  }

  if (input.isDemo && input.isCampaignScheduled && input.publishedCount === 0) {
    return {
      label: isNl ? "Nu publiceren" : "Publish now",
      action: "publish_demo",
      stepId: "published",
    };
  }

  if (input.pendingCount > 0 && input.pendingDraftId) {
    return {
      label: isNl
        ? `Beoordeel ${input.pendingCount} onderdeel${input.pendingCount > 1 ? "en" : ""}`
        : `Review ${input.pendingCount} deliverable${input.pendingCount > 1 ? "s" : ""}`,
      action: "review",
      draftId: input.pendingDraftId,
    };
  }

  if (
    input.pendingCount === 0 &&
    input.approvedCount > 0 &&
    !input.isCampaignScheduled
  ) {
    return {
      label: isNl ? "Campagne inplannen" : "Schedule campaign",
      action: "schedule",
      stepId: "scheduled",
    };
  }

  if (input.isCampaignScheduled && !input.isCampaignPublished && !input.isDemo) {
    return {
      label: isNl ? "Planning wijzigen" : "Edit schedule",
      action: "schedule",
      stepId: "scheduled",
    };
  }

  if (input.activeStepId === "website_analyzed" && input.websiteMissing) {
    return {
      label: isNl ? "Website toevoegen" : "Add website",
      action: "continue",
      stepId: "website_analyzed",
    };
  }

  if (input.activeStepId === "strategy_determined") {
    return {
      label: isNl ? "Beoordeel strategie" : "Review strategy",
      action: "continue",
      stepId: "strategy_determined",
    };
  }

  if (input.activeStepId === "channels_selected") {
    return {
      label: isNl ? "Beoordeel kanaalkeuze" : "Review channel selection",
      action: "continue",
      stepId: "channels_selected",
    };
  }

  if (input.isCampaignScheduled && !input.isDemo) {
    return {
      label: isNl ? "Bekijk planning" : "View schedule",
      action: "continue",
      stepId: "scheduled",
    };
  }

  if (input.activeStepId === "optimizing") {
    if (input.optimizationHasData) {
      return {
        label: isNl ? "Bekijk resultaten →" : "View results →",
        action: "open_optimization",
        stepId: "optimizing",
      };
    }
    return {
      label: isNl ? "Resultaten worden verzameld" : "Results are being collected",
      action: "continue",
      stepId: "optimizing",
    };
  }

  if (input.publishedCount > 0) {
    return {
      label: isNl ? "Bekijk resultaten →" : "View results →",
      action: "open_optimization",
      stepId: "optimizing",
    };
  }

  return {
    label: isNl ? "Ga verder" : "Continue",
    action: "continue",
    stepId: input.activeStepId ?? "waiting_for_approval",
  };
}

const STEP_ORDER: readonly CampaignWorkflowStepId[] = [
  "business_analyzed",
  "website_analyzed",
  "competitors_analyzed",
  "strategy_determined",
  "channels_selected",
  "deliverables_created",
  "waiting_for_approval",
  "scheduled",
  "published",
  "optimizing",
];

export function buildCampaignWorkflowViewModel(input: {
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  isDemo?: boolean;
}): CampaignWorkflowViewModel {
  const { peerId, project, domainInput } = input;
  const isNl = input.locale === "nl";
  const isDemo = input.isDemo ?? peerId === "demo";
  const labels = stepLabels(isNl);
  const overlay = readDemoCampaignOverlay(domainInput);

  const drafts = domainInput.drafts.filter(
    (d) => resolveProjectIdForDraft(d, domainInput.workUnits) === project.id
  );

  const pendingDrafts = drafts.filter((d) => d.status === "ready_for_review");
  const publishedDrafts = drafts.filter((d) => d.status === "published");
  const approvedDrafts = drafts.filter((d) => d.status === "approved");
  const readyToPublishDrafts = drafts.filter((d) => d.status === "ready_to_publish");

  const stepApprovals = overlay.demoCampaignStepApprovals?.[project.id];
  const liveStepApprovals = project.campaignSetup?.stepApprovals;
  const effectiveStepApprovals: Partial<
    Record<CampaignWorkflowStepId, DemoStepApprovalStatus>
  > | undefined = stepApprovals ?? (liveStepApprovals && Object.keys(liveStepApprovals).length > 0
    ? liveStepApprovals
    : undefined);
  const isCampaignScheduled = resolveCampaignScheduled(project, domainInput, isDemo);
  const isCampaignPublished = resolveCampaignPublished(project, domainInput, isDemo);
  const publishingState = resolveCampaignPublishingState({
    project,
    domainInput,
    connections: domainInput.connections,
    isCampaignPublished,
    isDemo,
  });
  const storedContext = overlay.demoCampaignContexts?.[project.id];
  const campaignContext =
    storedContext ?? buildCampaignContext({ project, domainInput, locale: input.locale });

  const orchestration = !isDemo
    ? CampaignIntelligenceOrchestrator.evaluate({
        project,
        campaignContext,
        locale: input.locale,
        stepApprovals: effectiveStepApprovals,
        strategyOutputReady: strategyOutputCurrent(project),
        pendingDeliverableCount: pendingDrafts.length,
        approvedDeliverableCount: approvedDrafts.length,
        isCampaignScheduled,
        isCampaignPublished,
        isDemo,
        publishingState,
        pendingDraftId: pendingDrafts[0]?.id,
      })
    : null;

  const projectStatus = deriveProjectStatus(
    project,
    domainInput.workUnits,
    domainInput.drafts,
    new Set()
  );

  const isNewCampaign =
    project.origin === "campaign_wizard" &&
    drafts.length === 0 &&
    projectStatus === "planning" &&
    !effectiveStepApprovals;

  const deliverablesUnlocked =
    Boolean(effectiveStepApprovals) &&
    (effectiveStepApprovals?.channels_selected === "approved" ||
      drafts.some((d) => d.status === "ready_for_review" || d.status === "approved"));

  const ctx = {
    hasDrafts: drafts.length > 0 && deliverablesUnlocked,
    pendingCount: pendingDrafts.length,
    approvedCount: approvedDrafts.length,
    publishedCount: publishedDrafts.length,
    readyToPublishCount: readyToPublishDrafts.length,
    isCampaignScheduled,
    isCampaignPublished,
    isDemo,
    publishingState,
    scheduledCount: readyToPublishDrafts.length,
    projectStatus,
    isNewCampaign,
    stepApprovals: effectiveStepApprovals,
    deliverablesUnlocked,
    campaignContext,
  };

  const steps: CampaignWorkflowStep[] = STEP_ORDER.map((stepId) => {
    const evidence = buildCampaignStepEvidence({
      stepId,
      peerId,
      project,
      domainInput,
      locale: input.locale,
    });
    const state: CampaignWorkflowStepState = orchestration
      ? CampaignIntelligenceOrchestrator.resolveWorkflowStepState(stepId, orchestration, {
          pendingDeliverableCount: pendingDrafts.length,
          isCampaignScheduled,
          isCampaignPublished,
          hasDrafts: drafts.length > 0 && deliverablesUnlocked,
          stepApprovals: effectiveStepApprovals,
          isDemo,
          publishingState,
        })
      : resolveStepState(stepId, ctx);
    const statusHint = workflowStatusHintForStep({
      stepId,
      state,
      isCampaignScheduled,
      isCampaignPublished,
      publishingState,
      locale: input.locale,
    });
    const brainDeferred = isLiveBrainDeferredStep(peerId, stepId);
    const hasEvidence =
      (Boolean(evidence?.sections.length) || brainDeferred) &&
      (state === "done" || state === "active" || state === "skipped") &&
      stepId !== "waiting_for_approval" &&
      stepId !== "scheduled" &&
      stepId !== "published" &&
      stepId !== "optimizing";

    return {
      id: stepId,
      label: labels[stepId],
      state,
      statusHint,
      hasEvidence,
      evidenceTitle: evidence?.title ?? labels[stepId],
      evidenceIntro: evidence?.intro,
      evidenceSections: evidence?.sections ?? [],
    };
  });

  const deliverables: CampaignDeliverable[] = drafts.map((draft) => {
    const { status, label: statusLabel } = deliverableStatus(draft, isNl);
    const channel = draft.channel ?? "content";
    return {
      id: draft.id,
      draftId: draft.id,
      label: draft.title || channelLabel(channel, isNl),
      channelLabel: channelLabel(channel, isNl),
      status,
      statusLabel,
      objective: draft.objective,
      previewHref: `${officeHref(peerId, "content")}?preview=${draft.id}`,
      detailHref: `/office/${peerId}/content/${draft.id}`,
      reviewable: draft.status === "ready_for_review",
    };
  });

  const approvalItems: CampaignApprovalItem[] = pendingDrafts.map((draft) => {
    const channel = draft.channel ?? "content";
    return {
      id: draft.id,
      draftId: draft.id,
      label: draft.title || channelLabel(channel, isNl),
      channelLabel: channelLabel(channel, isNl),
      description: draft.objective,
      previewHref: `${officeHref(peerId, "content")}?preview=${draft.id}`,
      detailHref: `/office/${peerId}/content/${draft.id}`,
    };
  });

  const executionMode = executionModeFromApprovalMode(
    project.campaignSetup?.approvalMode
  );

  const activeStep = orchestration?.activeCustomerStepId ?? steps.find((s) => s.state === "active")?.id;
  const websiteMissing =
    orchestration?.readiness.websiteDecision === "missing" &&
    activeStep === "website_analyzed";

  const rawChannels = [
    ...new Set(drafts.map((d) => d.channel).filter(Boolean) as string[]),
  ];
  const { hasSufficientData: optimizationHasData } = buildOptimizationMetrics({
    channels: rawChannels,
    locale: input.locale,
    isPublished: isCampaignPublished,
  });

  return {
    executionMode,
    executionModeLabel: executionModeLabel(
      executionMode,
      project.campaignSetup?.setupMode,
      isNl
    ),
    nextStep: buildNextStep({
      pendingCount: pendingDrafts.length,
      approvedCount: approvedDrafts.length,
      isCampaignScheduled,
      isCampaignPublished,
      publishingState,
      activeStepId: activeStep,
      locale: input.locale,
    }),
    nextStepCta: orchestration
      ? orchestrationPrimaryActionToCta(
          orchestration.primaryAction,
          project.campaignSetup?.strategyRun
        )
      : buildNextStepCta({
          pendingCount: pendingDrafts.length,
          approvedCount: approvedDrafts.length,
          publishedCount: publishedDrafts.length,
          isCampaignScheduled,
          isCampaignPublished,
          isDemo,
          pendingDraftId: pendingDrafts[0]?.id,
          activeStepId: activeStep,
          locale: input.locale,
          websiteMissing,
          optimizationHasData,
        }),
    steps,
    deliverables,
    approvalCenter: {
      count: approvalItems.length,
      items: approvalItems,
    },
  };
}
