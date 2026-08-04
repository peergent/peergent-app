import type { CampaignContext } from "./campaign-context";
import {
  evaluateCampaignContextReadiness,
  strategyContextReady,
} from "./campaign-context-readiness";
import { evaluateStrategyContextReadiness } from "./strategy-context-readiness";
import type {
  CampaignOrchestrationPhase,
  CampaignOrchestrationState,
  CampaignPrimaryAction,
  ResearchStepState,
} from "./campaign-orchestration-types";
import type { CampaignWorkflowStepId } from "./workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import { capabilitiesInvalidatedByChange } from "./campaign-context-invalidation";
import {
  isActiveStrategyRunStatus,
  strategyRunStageLabel,
} from "./strategy-run-types";
import { strategyOutputCurrent } from "./live-strategy-run-service";

export type CampaignOrchestratorInput = {
  project: MarketingProject;
  campaignContext: CampaignContext;
  locale?: string | null;
  stepApprovals?: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
  strategyOutputReady?: boolean;
  pendingDeliverableCount?: number;
  approvedDeliverableCount?: number;
  isCampaignScheduled?: boolean;
  isCampaignPublished?: boolean;
  pendingDraftId?: string;
  lastInvalidationTrigger?: "brand_context" | "website" | "competitors" | "goal" | "audience" | null;
  isDemo?: boolean;
  publishingState?: import("./campaign-lifecycle").CampaignPublishingState;
};

function isNl(locale?: string | null): boolean {
  return locale === "nl";
}

function resolveCompanyUnderstandingState(
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>
): ResearchStepState {
  if (!readiness.essentialReady) return "waiting_for_context";
  return "completed";
}

function resolveWebsiteUnderstandingState(
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>
): ResearchStepState {
  if (readiness.websiteDecision === "skipped") return "skipped";
  if (readiness.websiteDecision === "missing") return "waiting_for_context";
  if (readiness.websiteSnapshotState === "url_only") return "completed";
  if (readiness.websiteSnapshotState === "crawl_available") return "completed";
  return "completed";
}

function resolveCompetitorUnderstandingState(
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>
): ResearchStepState {
  if (readiness.competitorDecision === "skipped") return "skipped";
  if (readiness.competitorDecision === "missing") return "waiting_for_context";
  return "completed";
}

function resolvePhase(input: {
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>;
  strategyOutputReady: boolean;
  strategyApproved: boolean;
  pendingDeliverableCount: number;
}): CampaignOrchestrationPhase {
  if (input.pendingDeliverableCount > 0) return "awaiting_customer";
  if (!input.readiness.essentialReady) return "collect_context";
  if (
    input.readiness.websiteDecision === "missing" ||
    input.readiness.competitorDecision === "missing"
  ) {
    return "collect_context";
  }
  if (!input.strategyOutputReady || !input.strategyApproved) {
    if (input.strategyOutputReady && !input.strategyApproved) return "awaiting_customer";
    return "emma_working";
  }
  return "awaiting_customer";
}

function buildPrimaryAction(input: CampaignOrchestratorInput & {
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>;
  strategyApproved: boolean;
  channelsApproved: boolean;
  deliverablesApproved: boolean;
  strategyOutputReady: boolean;
}): CampaignPrimaryAction {
  const nl = isNl(input.locale);
  const pendingCount = input.pendingDeliverableCount ?? 0;

  if (input.isCampaignPublished) {
    return {
      kind: "view_results",
      label: nl ? "Bekijk resultaten →" : "View results →",
      stepId: "optimizing",
    };
  }

  if (pendingCount > 0 && input.pendingDraftId) {
    return {
      kind: "review_deliverables",
      label: nl
        ? `Beoordeel ${pendingCount} onderdeel${pendingCount > 1 ? "en" : ""}`
        : `Review ${pendingCount} deliverable${pendingCount > 1 ? "s" : ""}`,
      stepId: "waiting_for_approval",
      draftId: input.pendingDraftId,
    };
  }

  if (
    pendingCount === 0 &&
    !input.isCampaignScheduled &&
    ((input.approvedDeliverableCount ?? 0) > 0 || input.deliverablesApproved)
  ) {
    return {
      kind: "schedule",
      label: nl ? "Campagne inplannen" : "Schedule campaign",
      stepId: "scheduled",
    };
  }

  if (input.isCampaignScheduled && !input.isCampaignPublished) {
    return {
      kind: "view_schedule",
      label: nl ? "Planning wijzigen" : "Edit schedule",
      stepId: "scheduled",
    };
  }

  if (!input.readiness.essentialReady) {
    return {
      kind: "add_context",
      label: nl ? "Campagnecontext aanvullen" : "Complete campaign context",
    };
  }

  if (input.readiness.websiteDecision === "missing") {
    return {
      kind: "add_website",
      label: nl ? "Website toevoegen" : "Add website",
      stepId: "website_analyzed",
    };
  }

  if (input.readiness.competitorDecision === "missing") {
    return {
      kind: "add_competitors",
      label: nl ? "Concurrenten toevoegen" : "Add competitors",
      stepId: "competitors_analyzed",
    };
  }

  if (input.strategyOutputReady && !input.strategyApproved) {
    return {
      kind: "review_strategy",
      label: nl ? "Beoordeel strategie" : "Review strategy",
      stepId: "strategy_determined",
    };
  }

  if (input.strategyApproved && !input.channelsApproved) {
    return {
      kind: "review_channels",
      label: nl ? "Beoordeel kanaalkeuze" : "Review channel selection",
      stepId: "channels_selected",
    };
  }

  if (input.strategyApproved && input.channelsApproved && !input.deliverablesApproved) {
    return {
      kind: "review_deliverables",
      label: nl ? "Beoordeel campagneonderdelen" : "Review deliverables",
      stepId: "deliverables_created",
    };
  }

  if (!input.strategyOutputReady && strategyContextReady(input.readiness)) {
    const run = input.project.campaignSetup?.strategyRun;
    if (run?.status === "failed") {
      return {
        kind: "retry_strategy",
        label: nl ? "Opnieuw proberen" : "Try again",
        stepId: "strategy_determined",
        failureMessageSafe:
          run.failureMessageSafe ??
          (nl ? "De strategie kon niet worden gemaakt." : "The strategy could not be generated."),
      };
    }
    if (run?.status === "waiting_for_input") {
      const strategyReadiness = evaluateStrategyContextReadiness(input.campaignContext);
      return {
        kind: "view_context",
        label: nl ? "Campagnecontext aanvullen" : "Complete campaign context",
        failureMessageSafe: strategyReadiness.customerSafeMessage,
      };
    }
    const runStatus = isActiveStrategyRunStatus(run?.status) ? run!.status : "queued";
    return {
      kind: "strategy_working",
      label: nl ? "Emma werkt aan je strategie…" : "Emma is working on your strategy…",
      strategyRunStatus: runStatus,
      strategyRunStageLabel:
        run?.stageLabel ?? strategyRunStageLabel(runStatus, input.locale),
    };
  }

  return {
    kind: "continue",
    label: nl ? "Ga verder" : "Continue",
  };
}

function resolveActiveCustomerStep(input: CampaignOrchestratorInput & {
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>;
  strategyApproved: boolean;
  channelsApproved: boolean;
  deliverablesApproved: boolean;
  strategyOutputReady: boolean;
}): CampaignWorkflowStepId | null {
  if ((input.pendingDeliverableCount ?? 0) > 0) return "waiting_for_approval";
  if (input.isCampaignPublished) return "optimizing";
  if (input.isCampaignScheduled) {
    if (input.isDemo && input.publishingState && input.publishingState !== "not_configured") {
      return "published";
    }
    return null;
  }

  if (!input.readiness.essentialReady) return null;

  if (input.readiness.websiteDecision === "missing") return "website_analyzed";
  if (input.readiness.competitorDecision === "missing") return "competitors_analyzed";

  if (input.strategyOutputReady && !input.strategyApproved) return "strategy_determined";
  if (input.strategyApproved && !input.channelsApproved) return "channels_selected";
  if (input.strategyApproved && input.channelsApproved && !input.deliverablesApproved) {
    return "deliverables_created";
  }

  if (
    input.deliverablesApproved &&
    (input.pendingDeliverableCount ?? 0) === 0 &&
    !input.isCampaignScheduled
  ) {
    return "scheduled";
  }

  if (!input.strategyOutputReady && strategyContextReady(input.readiness)) return null;

  return null;
}

function resolveResearchStepStateForWorkflow(
  stepId: CampaignWorkflowStepId,
  researchSteps: CampaignOrchestrationState["researchSteps"],
  readiness: ReturnType<typeof evaluateCampaignContextReadiness>
): "done" | "active" | "upcoming" | "skipped" {
  switch (stepId) {
    case "business_analyzed": {
      const state = researchSteps.companyUnderstanding;
      if (state === "waiting_for_context") return readiness.essentialReady ? "upcoming" : "active";
      if (state === "skipped") return "skipped";
      return "done";
    }
    case "website_analyzed": {
      if (readiness.websiteDecision === "skipped") return "skipped";
      if (readiness.websiteDecision === "missing") return "active";
      return "done";
    }
    case "competitors_analyzed": {
      if (readiness.competitorDecision === "skipped") return "skipped";
      if (readiness.competitorDecision === "missing") return "active";
      return "done";
    }
    default:
      return "upcoming";
  }
}

/** Framework-independent campaign intelligence orchestrator — single source of workflow truth. */
export class CampaignIntelligenceOrchestrator {
  static evaluate(input: CampaignOrchestratorInput): CampaignOrchestrationState {
    const readiness = evaluateCampaignContextReadiness(input.campaignContext);
    const approvals = input.stepApprovals ?? {};
    const strategyApproved = approvals.strategy_determined === "approved";
    const channelsApproved = approvals.channels_selected === "approved";
    const deliverablesApproved = approvals.deliverables_created === "approved";
    const strategyOutputReady = Boolean(
      input.strategyOutputReady ??
        (input.project.campaignSetup?.strategyGeneratedAt &&
          strategyOutputCurrent(input.project))
    );

    const strategyRun = input.project.campaignSetup?.strategyRun;

    const researchSteps = {
      companyUnderstanding: resolveCompanyUnderstandingState(readiness),
      websiteUnderstanding: resolveWebsiteUnderstandingState(readiness),
      competitorUnderstanding: resolveCompetitorUnderstandingState(readiness),
    };

    const strategyBlocked = !strategyContextReady(readiness);
    const phase = resolvePhase({
      readiness,
      strategyOutputReady,
      strategyApproved,
      pendingDeliverableCount: input.pendingDeliverableCount ?? 0,
    });

    const invalidatedCapabilities: BrainCapabilityId[] = input.lastInvalidationTrigger
      ? [...capabilitiesInvalidatedByChange(input.lastInvalidationTrigger)]
      : [];

    const primaryAction = buildPrimaryAction({
      ...input,
      readiness,
      strategyApproved,
      channelsApproved,
      deliverablesApproved,
      strategyOutputReady,
    });

    return {
      contextVersion: input.project.campaignSetup?.campaignContextVersion ?? 0,
      readiness,
      phase,
      researchSteps,
      strategyBlocked,
      strategyOutputReady,
      strategyApproved,
      channelsApproved,
      deliverablesUnlocked: channelsApproved,
      activeCustomerStepId: resolveActiveCustomerStep({
        ...input,
        readiness,
        strategyApproved,
        channelsApproved,
        deliverablesApproved,
        strategyOutputReady,
      }),
      primaryAction,
      strategyRunStatus: strategyRun?.status,
      invalidatedCapabilities,
      websiteDecision: readiness.websiteDecision,
      competitorDecision: readiness.competitorDecision,
    };
  }

  static resolveWorkflowStepState(
    stepId: CampaignWorkflowStepId,
    orchestration: CampaignOrchestrationState,
    input: {
      pendingDeliverableCount: number;
      isCampaignScheduled: boolean;
      isCampaignPublished: boolean;
      hasDrafts: boolean;
      stepApprovals?: Partial<Record<CampaignWorkflowStepId, DemoStepApprovalStatus>>;
      isDemo?: boolean;
      publishingState?: import("./campaign-lifecycle").CampaignPublishingState;
    }
  ): "done" | "active" | "upcoming" | "skipped" {
    const { readiness, researchSteps } = orchestration;
    const approvals = input.stepApprovals ?? {};

    if (input.isCampaignPublished) {
      if (stepId === "optimizing") return "active";
      if (
        stepId === "business_analyzed" ||
        stepId === "website_analyzed" ||
        stepId === "competitors_analyzed" ||
        stepId === "strategy_determined" ||
        stepId === "channels_selected" ||
        stepId === "deliverables_created" ||
        stepId === "waiting_for_approval" ||
        stepId === "scheduled" ||
        stepId === "published"
      ) {
        return "done";
      }
    }

    if (input.isCampaignScheduled && !input.isCampaignPublished) {
      const preSchedule: CampaignWorkflowStepId[] = [
        "business_analyzed",
        "website_analyzed",
        "competitors_analyzed",
        "strategy_determined",
        "channels_selected",
        "deliverables_created",
        "waiting_for_approval",
        "scheduled",
      ];
      if (preSchedule.includes(stepId)) return "done";
      if (stepId === "published") {
        if (input.isDemo && input.publishingState && input.publishingState !== "not_configured") {
          return "active";
        }
        return "upcoming";
      }
    }

    if (
      stepId === "business_analyzed" ||
      stepId === "website_analyzed" ||
      stepId === "competitors_analyzed"
    ) {
      return resolveResearchStepStateForWorkflow(stepId, researchSteps, readiness);
    }

    if (input.pendingDeliverableCount > 0 && stepId === "waiting_for_approval") return "active";

    if (stepId === "strategy_determined") {
      if (approvals.strategy_determined === "approved") return "done";
      if (orchestration.strategyOutputReady && !orchestration.strategyApproved) return "active";
      if (orchestration.strategyBlocked) return "upcoming";
      if (!orchestration.strategyOutputReady && strategyContextReady(readiness)) return "upcoming";
      return "upcoming";
    }

    if (stepId === "channels_selected") {
      if (approvals.channels_selected === "approved") return "done";
      if (orchestration.strategyApproved && !orchestration.channelsApproved) return "active";
      if (orchestration.strategyApproved) return "active";
      return "upcoming";
    }

    if (stepId === "deliverables_created") {
      if (approvals.deliverables_created === "approved") return "done";
      if (orchestration.channelsApproved) return "active";
      return "upcoming";
    }

    if (stepId === "waiting_for_approval") {
      if (input.pendingDeliverableCount > 0) return "active";
      if (approvals.deliverables_created === "approved") return "done";
      if (approvals.waiting_for_approval === "approved") return "done";
      if (input.hasDrafts && input.pendingDeliverableCount === 0) return "done";
      return "upcoming";
    }

    if (stepId === "scheduled") {
      if (input.isCampaignScheduled) return "done";
      if (
        approvals.deliverables_created === "approved" &&
        input.pendingDeliverableCount === 0
      ) {
        return "active";
      }
      return "upcoming";
    }

    if (stepId === "published") {
      if (input.isCampaignPublished) return "done";
      if (input.isCampaignScheduled) {
        if (input.isDemo && input.publishingState && input.publishingState !== "not_configured") {
          return "active";
        }
        return "upcoming";
      }
      return "upcoming";
    }

    if (stepId === "optimizing") {
      if (input.isCampaignPublished) return "active";
      return "upcoming";
    }

    return "upcoming";
  }
}

export function orchestrationPrimaryActionToCta(
  action: CampaignPrimaryAction,
  strategyRun?: import("./strategy-run-types").StrategyRunState
): {
  label: string;
  action:
    | "review"
    | "approve_strategy"
    | "approve_channels"
    | "approve_deliverables"
    | "schedule"
    | "publish_demo"
    | "view_published"
    | "view_analytics"
    | "open_optimization"
    | "continue"
    | "add_context"
    | "add_website"
    | "add_competitors"
    | "working"
    | "retry_strategy"
    | "view_context";
  draftId?: string;
  stepId?: CampaignWorkflowStepId;
  workingStage?: string;
  runStatus?: import("./strategy-run-types").StrategyRunStatus;
  failureMessage?: string;
  devDiagnostics?: {
    runId?: string;
    lastStatus?: string;
    provider?: string;
    failureCode?: string;
    fallbackUsed?: boolean;
    traceLastStage?: string;
  };
} {
  switch (action.kind) {
    case "add_context":
      return { label: action.label, action: "add_context" };
    case "add_website":
      return { label: action.label, action: "add_website", stepId: action.stepId };
    case "add_competitors":
      return { label: action.label, action: "add_competitors", stepId: action.stepId };
    case "review_strategy":
      return { label: action.label, action: "continue", stepId: action.stepId };
    case "review_channels":
      return { label: action.label, action: "continue", stepId: action.stepId };
    case "review_deliverables":
      return { label: action.label, action: "continue", stepId: action.stepId };
    case "schedule":
      return { label: action.label, action: "schedule", stepId: action.stepId };
    case "view_schedule":
      return { label: action.label, action: "schedule", stepId: action.stepId };
    case "view_results":
      return { label: action.label, action: "open_optimization", stepId: action.stepId };
    case "strategy_working":
      return {
        label: action.label,
        action: "working",
        workingStage: action.strategyRunStageLabel,
        runStatus: action.strategyRunStatus,
        devDiagnostics: buildStrategyDevDiagnostics(strategyRun),
      };
    case "retry_strategy":
      return {
        label: action.label,
        action: "retry_strategy",
        stepId: action.stepId,
        failureMessage: action.failureMessageSafe,
        devDiagnostics: buildStrategyDevDiagnostics(strategyRun),
      };
    case "view_context":
      return {
        label: action.label,
        action: "view_context",
        failureMessage: action.failureMessageSafe,
        devDiagnostics: buildStrategyDevDiagnostics(strategyRun),
      };
    default:
      return { label: action.label, action: "continue", stepId: action.stepId };
  }
}

function buildStrategyDevDiagnostics(
  strategyRun?: import("./strategy-run-types").StrategyRunState
) {
  if (process.env.NODE_ENV === "production" || !strategyRun) return undefined;
  return {
    runId: strategyRun.runId,
    lastStatus: strategyRun.status,
    provider: strategyRun.provider,
    failureCode: strategyRun.failureCode,
    fallbackUsed: strategyRun.fallbackUsed,
    traceLastStage: strategyRun.traceLastStage,
    triggerKey: strategyRun.devTriggerKey,
    actionInvocationCount: strategyRun.devActionInvocationCount,
    actionDurationMs: strategyRun.devActionDurationMs,
    inFlightReused: strategyRun.devInFlightReused,
    terminalState: strategyRun.devTerminalState,
    model: strategyRun.devModel,
    inputTokens: strategyRun.devInputTokens,
    outputTokens: strategyRun.devOutputTokens,
    initialProvider: strategyRun.initialProvider,
    finalProvider: strategyRun.finalProvider,
    fallbackReason: strategyRun.fallbackReason,
  };
}
