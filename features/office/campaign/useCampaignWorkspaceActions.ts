"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addDemoCompetitors,
  addDemoWebsiteUrl,
  approveAllDemoDrafts,
  getDemoCampaignSnapshot,
  publishDemoCampaign,
  scheduleDemoCampaign,
  setDemoDraftStatus,
  setDemoStepApproval,
  skipDemoCompetitorAnalysis,
  skipDemoWebsiteAnalysis,
} from "@/lib/office/demo/demo-campaign-store";
import { applyDemoCampaignOverlay } from "@/lib/office/demo/merge-demo-domain";
import { officeHref } from "@/lib/office/links";
import {
  buildDeliverableReviewModel,
  draftIdsPendingApproval,
} from "@/lib/office/deliverable/build-deliverable-review";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import { buildCampaignStepEvidenceAsync, isLiveBrainDeferredStep } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { buildLiveCampaignEvidenceAction } from "@/lib/office/campaign/live-campaign-evidence-action";
import { submitLiveCampaignStepApprovalAction } from "@/lib/office/campaign/live-campaign-approval-action";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import { CREATIVE_GENERATION_CLIENT_ACTION_TIMEOUT_MS } from "@/lib/brain/llm/creative-generation-llm-config";
import {
  buildCampaignContext,
} from "@/lib/office/campaign/campaign-context";
import { clearLiveStrategyRunForRetry, persistCampaignBrainOutputs, persistLiveCampaignSchedule } from "@/lib/office/campaign/live-campaign-context-store";
import {
  buildStrategyTriggerKey,
  shouldEnqueueLiveStrategyRun,
} from "@/lib/office/campaign/live-strategy-run-service";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import { customerSafeStrategyFailureMessage } from "@/lib/office/campaign/strategy-run-types";
import { triggerLiveStrategyRunViaServer, recoverStaleOptimisticStrategyRun } from "@/lib/office/campaign/live-strategy-run-client";
import { resumeAutomaticCampaignPipelineAction } from "@/lib/office/campaign/resume-automatic-campaign-pipeline-action";
import {
  evaluateAutomaticPipelineRecoveryOnMount,
  isAutomaticCampaignPastStrategyBootstrap,
} from "@/lib/office/campaign/live-strategy-run-service";
import { recoverStaleLiveStrategyRun } from "@/lib/office/campaign/live-campaign-context-store";
import { isInformationalWorkflowStep } from "@/lib/office/campaign/campaign-orchestration-types";
import { inferCampaignBrandName } from "@/lib/office/campaign/campaign-brand-boundary";
import {
  normalizeCampaignCompanyContext,
  type CampaignCompanyContextInput,
} from "@/lib/office/campaign/campaign-company-context-validation";
import {
  buildEvidenceMissingCtas,
  evidenceBlocksWorkflowAdvance,
} from "@/lib/office/campaign/evidence-readiness";
import type { BrainDevDiagnostics } from "@/lib/brain/integration/brain-dev-diagnostics";
import { EVIDENCE_NEXT_STEP, type EvidenceModalPhase } from "@/features/office/campaign/CampaignEvidenceModal";
import { tryBuildCachedCampaignEvidence } from "@/lib/office/campaign/cached-campaign-evidence";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import type { CampaignWorkflowStep, CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoCompetitorInput } from "@/lib/office/demo/demo-campaign-store";
import type { DemoCampaignDomainOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  resolveEpisodeApprovalBridgeStepId,
  type CampaignRuntimeProjection,
} from "@/lib/office/campaign/campaign-runtime-projection";
import { loadCampaignApprovalPackageAction } from "@/lib/office/campaign/load-campaign-approval-package-action";
import type { CampaignApprovalPackage } from "@/lib/brain/approval/campaign-approval-package-types";

type Workspace = ReturnType<typeof useMarketingWorkspace>;

/** Derived open state for results panel — URL param or explicit user action. */
export function resolveOptimizationPanelOpen(
  viewParam: string | null,
  manualOpen: boolean
): boolean {
  return viewParam === "results" || manualOpen;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function freshDomainInput(
  domainInput: MarketingPeerDomainInput,
  isDemo: boolean
): MarketingPeerDomainInput {
  if (!isDemo) return domainInput;
  return applyDemoCampaignOverlay(
    domainInput as MarketingPeerDomainInput & DemoCampaignDomainOverlay,
    getDemoCampaignSnapshot()
  );
}

export function useCampaignWorkspaceActions(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  localePreference?: string | null;
  isDemo: boolean;
  workspace: Workspace;
  runtimeProjection?: CampaignRuntimeProjection | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { peerId, projectId, domainInput, localePreference, isDemo, workspace } = input;
  const nl = localePreference === "nl";

  const [evidenceStep, setEvidenceStep] = useState<CampaignWorkflowStep | null>(null);
  const [evidencePhase, setEvidencePhase] = useState<EvidenceModalPhase>("idle");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [evidenceProgressLabel, setEvidenceProgressLabel] = useState<string | null>(null);
  const [evidenceDevDiagnostics, setEvidenceDevDiagnostics] = useState<BrainDevDiagnostics | null>(
    null
  );
  const [localReviewDraftId, setLocalReviewDraftId] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [competitorModalOpen, setCompetitorModalOpen] = useState(false);
  const [companyContextModalOpen, setCompanyContextModalOpen] = useState(false);
  const [manualOptimizationOpen, setManualOptimizationOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reviewProgress, setReviewProgress] = useState<string | null>(null);
  const [approvalReviewOpen, setApprovalReviewOpen] = useState(false);
  const [approvalPackage, setApprovalPackage] = useState<CampaignApprovalPackage | null>(null);
  const [approvalPackageLoading, setApprovalPackageLoading] = useState(false);
  const [approvalPackageError, setApprovalPackageError] = useState<string | null>(null);
  const [approvalPhase, setApprovalPhase] = useState<"idle" | "processing" | "success" | "error">("idle");

  const reviewParam = searchParams.get("review");
  const viewParam = searchParams.get("view");
  const activeReviewDraftId = localReviewDraftId ?? reviewParam;
  const optimizationOpen = resolveOptimizationPanelOpen(viewParam, manualOptimizationOpen);

  const openOptimization = useCallback((open = true) => {
    setManualOptimizationOpen(open);
  }, []);

  const closeOptimization = useCallback(() => {
    setManualOptimizationOpen(false);
    if (searchParams.get("view") === "results") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("view");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const storedWebsiteUrl = isDemo
    ? getDemoCampaignSnapshot().campaignContexts[projectId]?.websiteUrl
    : (domainInput.projects.find((p) => p.id === projectId)?.campaignSetup?.websiteUrl ?? null);

  const liveProject = domainInput.projects.find((p) => p.id === projectId);
  const liveCampaignSetup = liveProject?.campaignSetup;
  const strategyTriggerKey = useMemo(() => {
    if (!liveCampaignSetup || liveCampaignSetup.strategyGeneratedAt) return null;
    return buildStrategyTriggerKey({
      peerId,
      projectId,
      contextVersion: liveCampaignSetup.campaignContextVersion ?? 0,
      capabilityVersion: getBrainCapability("strategy").version,
    });
  }, [liveCampaignSetup, peerId, projectId]);
  const strategyRunInFlightRef = useRef(false);
  const triggeredStrategyKeysRef = useRef(new Set<string>());
  const pipelineRecoveryAttemptedRef = useRef<string | null>(null);

  const syncLiveProject = useCallback(
    (updated: MarketingProject) => {
      workspace.applyLiveCampaignProjectUpdate(updated);
    },
    [workspace]
  );

  const triggerLiveStrategyRun = useCallback(
    (sourceDomain: MarketingPeerDomainInput) => {
      if (isDemo || strategyRunInFlightRef.current) return;
      const project = sourceDomain.projects.find((p) => p.id === projectId);
      if (!project || !shouldEnqueueLiveStrategyRun(project, sourceDomain, localePreference)) return;

      const triggerKey = buildStrategyTriggerKey({
        peerId,
        projectId,
        contextVersion: project.campaignSetup?.campaignContextVersion ?? 0,
        capabilityVersion: getBrainCapability("strategy").version,
      });
      if (triggeredStrategyKeysRef.current.has(triggerKey)) return;

      triggeredStrategyKeysRef.current.add(triggerKey);
      strategyRunInFlightRef.current = true;
      void triggerLiveStrategyRunViaServer({
        peerId,
        projectId,
        domainInput: sourceDomain,
        locale: localePreference,
        onProjectUpdate: syncLiveProject,
      })
        .then((result) => {
          if (result.project) syncLiveProject(result.project);
        })
        .catch(() => {
          const current = sourceDomain.projects.find((p) => p.id === projectId);
          if (!current) return;
          const recovered = recoverStaleLiveStrategyRun(peerId, projectId, {
            failureCode: "execution_error",
            failureMessageSafe: customerSafeStrategyFailureMessage(undefined, localePreference),
          });
          if (recovered) syncLiveProject(recovered);
        })
        .finally(() => {
          strategyRunInFlightRef.current = false;
        });
    },
    [isDemo, localePreference, peerId, projectId, syncLiveProject]
  );

  useEffect(() => {
    if (isDemo || !liveProject) return;
    if (liveProject.campaignSetup?.setupMode === "manual") return;

    const mountDecision = evaluateAutomaticPipelineRecoveryOnMount(liveProject);
    if (!mountDecision.eligible) return;

    const recoverySignature = [
      projectId,
      liveProject.campaignSetup?.strategyRun?.status ?? "unknown",
      liveProject.campaignSetup?.strategyGeneratedAt ?? "",
      mountDecision.decisionReason,
    ].join(":");

    if (pipelineRecoveryAttemptedRef.current === recoverySignature) return;
    pipelineRecoveryAttemptedRef.current = recoverySignature;

    void resumeAutomaticCampaignPipelineAction({
      peerId,
      projectId,
      project: liveProject,
      locale: localePreference,
      mountDecisionReason: mountDecision.decisionReason,
    }).then((result) => {
      if (result.resumed && result.stallReason) {
        pipelineRecoveryAttemptedRef.current = null;
      }
    });
  }, [
    isDemo,
    liveProject,
    liveProject?.campaignSetup?.strategyRun?.status,
    liveProject?.campaignSetup?.strategyGeneratedAt,
    localePreference,
    peerId,
    projectId,
  ]);

  useEffect(() => {
    if (isDemo || !liveProject || !strategyTriggerKey) return;
    if (
      isAutomaticCampaignPastStrategyBootstrap(liveProject) &&
      !liveProject.campaignSetup?.strategyGeneratedAt
    ) {
      return;
    }
    if (triggeredStrategyKeysRef.current.has(strategyTriggerKey)) return;
    const recovered =
      recoverStaleOptimisticStrategyRun(peerId, projectId, liveProject, localePreference) ??
      null;
    if (recovered) {
      syncLiveProject(recovered);
      return;
    }
    triggerLiveStrategyRun(domainInput);
  }, [
    domainInput,
    isDemo,
    liveProject,
    localePreference,
    peerId,
    projectId,
    strategyTriggerKey,
    syncLiveProject,
    triggerLiveStrategyRun,
  ]);

  const companyContextInitialValues = useMemo((): CampaignCompanyContextInput => {
    const setup = liveProject?.campaignSetup;
    const brand = setup?.campaignBrandContext;
    return {
      brandName: brand?.brandName ?? inferCampaignBrandName(liveProject?.title ?? "", setup),
      industry: brand?.industry ?? "",
      mission: brand?.mission ?? "",
      positioning: brand?.positioning ?? "",
      tone: brand?.tone ?? "",
      targetAudience: brand?.targetAudience ?? setup?.targetAudience ?? setup?.confirmedAudience ?? "",
      productsAndServices: brand?.productsAndServices ?? [],
      uniqueSellingPoints: brand?.uniqueSellingPoints ?? [],
    };
  }, [liveProject]);

  const handleRetryStrategy = useCallback(() => {
    if (isDemo) return;
    const cleared = clearLiveStrategyRunForRetry(peerId, projectId);
    if (!cleared) return;
    const triggerKey = buildStrategyTriggerKey({
      peerId,
      projectId,
      contextVersion: cleared.campaignSetup?.campaignContextVersion ?? 0,
      capabilityVersion: getBrainCapability("strategy").version,
    });
    triggeredStrategyKeysRef.current.delete(triggerKey);
    syncLiveProject(cleared);
    const nextDomain: MarketingPeerDomainInput = {
      ...domainInput,
      projects: domainInput.projects.map((p) => (p.id === projectId ? cleared : p)),
    };
    triggerLiveStrategyRun(nextDomain);
  }, [domainInput, isDemo, peerId, projectId, syncLiveProject, triggerLiveStrategyRun]);

  const handleViewCampaignContext = useCallback(() => {
    setCompanyContextModalOpen(true);
  }, []);

  const openReview = useCallback(
    (draftId: string) => {
      setLocalReviewDraftId(draftId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("review", draftId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeReview = useCallback(() => {
    setLocalReviewDraftId(null);
    setReviewProgress(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("review");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeEvidence = useCallback(() => {
    setEvidenceStep(null);
    setEvidencePhase("idle");
    setEvidenceError(null);
    setEvidenceProgressLabel(null);
    setEvidenceDevDiagnostics(null);
  }, []);

  const applyEvidenceBundleToStep = useCallback(
    (
      step: CampaignWorkflowStep,
      bundle: NonNullable<Awaited<ReturnType<typeof buildCampaignStepEvidenceAsync>>>,
      project: NonNullable<ReturnType<typeof domainInput.projects.find>>
    ): CampaignWorkflowStep => {
      const blocked = evidenceBlocksWorkflowAdvance(bundle.sections);
      const campaignContext = buildCampaignContext({
        project,
        domainInput,
        locale: localePreference,
      });
      return {
        ...step,
        evidenceTitle: bundle.title,
        evidenceIntro: bundle.intro,
        evidenceSections: bundle.sections,
        evidenceBlocked: blocked,
        evidenceMissingCtas: blocked
          ? buildEvidenceMissingCtas({
              sections: bundle.sections,
              campaignContext,
              locale: localePreference,
            })
          : undefined,
      };
    },
    [domainInput, localePreference]
  );

  const openEvidenceStep = useCallback(
    async (step: CampaignWorkflowStep, sourceDomain?: MarketingPeerDomainInput) => {
      if (!step.hasEvidence) return false;

      const domain = sourceDomain ?? freshDomainInput(domainInput, isDemo);
      const project = domain.projects.find((p) => p.id === projectId);
      if (!project) return false;

      setEvidenceError(null);
      setEvidenceDevDiagnostics(null);

      if (!isDemo && isLiveBrainDeferredStep(peerId, step.id)) {
        const cachedBundle = tryBuildCachedCampaignEvidence({
          stepId: step.id,
          peerId,
          project,
          domainInput: domain,
          locale: localePreference,
        });
        if (cachedBundle && cachedBundle.sections.length > 0) {
          setEvidencePhase("idle");
          setEvidenceProgressLabel(null);
          setEvidenceStep(applyEvidenceBundleToStep(step, cachedBundle, project));
          setEvidenceDevDiagnostics(cachedBundle.devDiagnostics ?? null);
          return true;
        }

        setEvidencePhase("loading");
        setEvidenceProgressLabel(
          nl ? "Emma verzamelt context" : "Emma is gathering context"
        );
        setEvidenceStep({
          ...step,
          evidenceIntro: undefined,
          evidenceSections: [],
          evidenceBlocked: false,
          evidenceMissingCtas: undefined,
        });

        try {
          const actionPromise = buildLiveCampaignEvidenceAction({
            peerId,
            projectId,
            stepId: step.id,
            project,
            domainInput: domain,
            locale: localePreference,
          });
          const actionResult = await (step.id === "deliverables_created"
            ? runWithBoundedTimeout(
                actionPromise,
                CREATIVE_GENERATION_CLIENT_ACTION_TIMEOUT_MS,
                "deliverables_client_action_timeout"
              )
            : actionPromise);

          if (!actionResult.ok) {
            setEvidencePhase("error");
            setEvidenceError(
              nl
                ? "Emma kon geen strategie genereren. Controleer je campagne-input."
                : "Emma could not generate strategy. Check your campaign input."
            );
            return false;
          }

          const bundle = actionResult.bundle;

          if (!bundle || bundle.sections.length === 0) {
            setEvidencePhase("error");
            setEvidenceError(
              nl
                ? "Emma kon geen strategie genereren. Controleer je campagne-input."
                : "Emma could not generate strategy. Check your campaign input."
            );
            return false;
          }

          setEvidenceStep(applyEvidenceBundleToStep(step, bundle, project));
          setEvidenceDevDiagnostics(bundle.devDiagnostics ?? null);
          if (bundle.capabilityOutputs && Object.keys(bundle.capabilityOutputs).length > 0) {
            const updated = persistCampaignBrainOutputs(peerId, projectId, bundle.capabilityOutputs);
            if (updated) syncLiveProject(updated);
          }
          setEvidencePhase("idle");
          return true;
        } catch {
          setEvidencePhase("error");
          setEvidenceError(
            nl ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again."
          );
          return false;
        }
      }

      setEvidencePhase("idle");
      setEvidenceProgressLabel(null);
      setEvidenceStep(step);
      return true;
    },
    [applyEvidenceBundleToStep, domainInput, isDemo, localePreference, nl, peerId, projectId, syncLiveProject]
  );

  const openStepById = useCallback(
    (stepId: CampaignWorkflowStepId, sourceDomain?: MarketingPeerDomainInput) => {
      const domain = sourceDomain ?? freshDomainInput(domainInput, isDemo);
      const project = domain.projects.find((p) => p.id === projectId);
      if (!project) return false;
      const workflow = buildCampaignWorkflowViewModel({
        peerId,
        project,
        domainInput: domain,
        locale: localePreference,
        isDemo,
        runtimeProjection: input.runtimeProjection,
      });
      const step = workflow.steps.find((s) => s.id === stepId);
      if (!step?.hasEvidence) return false;
      void openEvidenceStep(step, domain);
      return true;
    },
    [domainInput, isDemo, localePreference, openEvidenceStep, peerId, projectId, input.runtimeProjection]
  );

  const advanceEvidenceStep = useCallback(
    (currentStepId: CampaignWorkflowStepId) => {
      const nextId = EVIDENCE_NEXT_STEP[currentStepId as keyof typeof EVIDENCE_NEXT_STEP] as
        | CampaignWorkflowStepId
        | undefined;

      const finish = () => {
        closeEvidence();
        const domain = freshDomainInput(domainInput, isDemo);

        if (nextId === "waiting_for_approval") {
          const pendingIds = draftIdsPendingApproval(domain, projectId);
          if (pendingIds[0]) openReview(pendingIds[0]);
          return;
        }

        if (nextId) {
          const opened = openStepById(nextId, domain);
          if (!opened) {
            window.setTimeout(() => {
              openStepById(nextId, freshDomainInput(domainInput, isDemo));
            }, prefersReducedMotion() ? 0 : 300);
          }
        }
      };

      window.setTimeout(finish, prefersReducedMotion() ? 0 : 700);
    },
    [closeEvidence, domainInput, isDemo, openReview, openStepById, projectId]
  );

  const completeEvidenceStep = useCallback(
    (stepId: CampaignWorkflowStepId) => {
      if (evidencePhase === "processing") return;
      if (evidenceStep?.evidenceBlocked) return;

      if (isInformationalWorkflowStep(stepId)) {
        closeEvidence();
        return;
      }

      setEvidencePhase("processing");
      setEvidenceError(null);

      void (async () => {
        try {
          if (isDemo) {
            setDemoStepApproval(peerId, projectId, stepId, "approved");
            setEvidencePhase("success");
            if (
              stepId === "strategy_determined" ||
              stepId === "channels_selected" ||
              stepId === "deliverables_created"
            ) {
              window.setTimeout(() => closeEvidence(), prefersReducedMotion() ? 0 : 500);
            } else {
              advanceEvidenceStep(stepId);
            }
            return;
          }

          const domain = freshDomainInput(domainInput, isDemo);
          const project = domain.projects.find((p) => p.id === projectId);
          if (!project) throw new Error("approval_persist_failed");

          const bridgeStepId = resolveEpisodeApprovalBridgeStepId(
            input.runtimeProjection,
            stepId
          );

          const bridgeResult = await submitLiveCampaignStepApprovalAction({
            peerId,
            projectId,
            stepId: bridgeStepId,
            status: "approved",
            project,
            domainInput: domain,
            locale: localePreference === "nl" ? "nl" : "en",
          });

          if (!bridgeResult.ok) {
            throw new Error(bridgeResult.error);
          }

          syncLiveProject(bridgeResult.project);
          setEvidencePhase("success");
          if (
            stepId === "strategy_determined" ||
            stepId === "channels_selected" ||
            stepId === "deliverables_created"
          ) {
            window.setTimeout(() => closeEvidence(), prefersReducedMotion() ? 0 : 500);
          } else {
            advanceEvidenceStep(stepId);
          }
        } catch {
          setEvidencePhase("error");
          setEvidenceError(
            nl ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again."
          );
        }
      })();
    },
    [
      advanceEvidenceStep,
      closeEvidence,
      domainInput,
      evidencePhase,
      evidenceStep?.evidenceBlocked,
      isDemo,
      localePreference,
      nl,
      peerId,
      projectId,
      syncLiveProject,
      input.runtimeProjection,
    ]
  );

  const handleEvidencePrimary = useCallback(() => {
    const step = evidenceStep;
    if (!step || evidencePhase === "processing" || evidencePhase === "success") return;
    if (step.evidenceBlocked) return;
    completeEvidenceStep(step.id);
  }, [completeEvidenceStep, evidencePhase, evidenceStep]);

  const handleEvidenceMissingAction = useCallback(
    (action: import("@/lib/office/campaign/evidence-readiness").EvidenceMissingAction) => {
      if (action === "add_website") {
        closeEvidence();
        setWebsiteModalOpen(true);
        return;
      }
      if (action === "add_company" || action === "add_context") {
        closeEvidence();
        setCompanyContextModalOpen(true);
        return;
      }
      if (action === "later") {
        closeEvidence();
      }
    },
    [closeEvidence]
  );

  const handleSaveCompanyContext = useCallback(
    async (context: CampaignCompanyContextInput) => {
      const normalized = normalizeCampaignCompanyContext(context);
      const updated = workspace.updateCampaignBrandContext(projectId, normalized);
      if (!updated) {
        throw new Error("Failed to persist company context");
      }

      setCompanyContextModalOpen(false);
      setProgressMessage(
        nl ? "Emma verwerkt je campagnecontext…" : "Emma is processing your campaign context…"
      );

      const nextDomain: MarketingPeerDomainInput = {
        ...domainInput,
        projects: domainInput.projects.map((p) => (p.id === projectId ? updated : p)),
      };

      void triggerLiveStrategyRun(nextDomain);
      window.setTimeout(() => setProgressMessage(null), prefersReducedMotion() ? 0 : 2400);
    },
    [domainInput, nl, projectId, triggerLiveStrategyRun, workspace]
  );

  const handleApproveAll = useCallback(() => {
    const pendingIds = draftIdsPendingApproval(domainInput, projectId);
    if (pendingIds.length === 0) return;

    if (isDemo) {
      approveAllDemoDrafts(peerId, pendingIds, nl ? "Jij" : "You");
      return;
    }

    for (const draftId of pendingIds) {
      workspace.handleDraftStatus(draftId, "approved");
    }
  }, [domainInput, isDemo, nl, peerId, projectId, workspace]);

  const advanceAfter = useCallback((message: string, next: () => void) => {
    const delay = prefersReducedMotion() ? 0 : 600;
    setProgressMessage(message);
    window.setTimeout(() => {
      setProgressMessage(null);
      next();
    }, delay);
  }, []);

  const handleDeliverableApprove = useCallback(
    (draftId: string) => {
      const pendingBefore = draftIdsPendingApproval(domainInput, projectId);
      const total = pendingBefore.length;
      const reviewedIndex = pendingBefore.indexOf(draftId) + 1;

      if (isDemo) {
        setDemoDraftStatus(peerId, draftId, "approved", {
          action: "approved",
          by: nl ? "Jij" : "You",
        });
      } else {
        workspace.handleDraftStatus(draftId, "approved");
      }

      const remaining = pendingBefore.filter((id) => id !== draftId);
      const delay = prefersReducedMotion() ? 0 : 600;

      if (remaining.length > 0) {
        setReviewProgress(
          nl ? `${reviewedIndex} van ${total} beoordeeld` : `${reviewedIndex} of ${total} reviewed`
        );
        window.setTimeout(() => {
          openReview(remaining[0]!);
        }, delay);
        return;
      }

      closeReview();
      advanceAfter(
        nl
          ? "Alle onderdelen zijn klaar — ik zet de volgende stap klaar."
          : "All items reviewed — preparing the next step.",
        () => {
          setReviewProgress(null);
          document
            .querySelector("[data-testid='campaign-primary-cta']")
            ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
        }
      );
    },
    [advanceAfter, closeReview, domainInput, isDemo, nl, openReview, peerId, projectId, workspace]
  );

  const handleDeliverableChanges = useCallback(
    (draftId: string, notes: string) => {
      if (isDemo) {
        setDemoDraftStatus(peerId, draftId, "ready_for_review", {
          action: "changes_requested",
          by: nl ? "Jij" : "You",
          notes,
        });
      } else {
        workspace.handleDraftStatus(draftId, "rejected");
      }
      closeReview();
    },
    [closeReview, isDemo, nl, peerId, workspace]
  );

  const handleDeliverableReject = useCallback(
    (draftId: string, notes: string) => {
      if (isDemo) {
        setDemoDraftStatus(peerId, draftId, "rejected", {
          action: "rejected",
          by: nl ? "Jij" : "You",
          notes,
        });
      } else {
        workspace.handleDraftStatus(draftId, "rejected");
      }
      closeReview();
    },
    [closeReview, isDemo, nl, peerId, workspace]
  );

  const reviewModel = useMemo(() => {
    if (!activeReviewDraftId) return null;
    return buildDeliverableReviewModel({
      draftId: activeReviewDraftId,
      domainInput,
      locale: localePreference,
      approvalHistory: isDemo ? getDemoCampaignSnapshot().approvalHistory : undefined,
    });
  }, [activeReviewDraftId, domainInput, isDemo, localePreference]);

  const handleScheduleCampaign = useCallback(
    (scheduledAtIso?: string) => {
      if (!scheduledAtIso) {
        setScheduleModalOpen(true);
        return;
      }

      if (isDemo) {
        scheduleDemoCampaign(peerId, projectId, scheduledAtIso);
        setScheduleModalOpen(false);
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const project = domainInput.projects.find((p) => p.id === projectId);
      const channels =
        project?.campaignSetup?.selectedChannels?.map((c) => String(c)) ?? [];

      const updated = persistLiveCampaignSchedule(peerId, projectId, {
        scheduledAt: scheduledAtIso,
        timezone,
        channels,
      });
      if (!updated) return;
      syncLiveProject(updated);
      setScheduleModalOpen(false);
    },
    [domainInput.projects, isDemo, peerId, projectId, syncLiveProject]
  );

  const handleOpenScheduleModal = useCallback(() => {
    setScheduleModalOpen(true);
  }, []);

  const handlePublishCampaign = useCallback(() => {
    if (!isDemo) return;
    publishDemoCampaign(peerId, projectId);
  }, [isDemo, peerId, projectId]);

  const openCampaignApprovalReview = useCallback(async () => {
    if (isDemo) return;
    const domain = freshDomainInput(domainInput, isDemo);
    const project = domain.projects.find((p) => p.id === projectId);
    if (!project) return;

    setApprovalReviewOpen(true);
    setApprovalPackageLoading(true);
    setApprovalPackageError(null);
    setApprovalPhase("idle");

    try {
      const result = await loadCampaignApprovalPackageAction({
        peerId,
        projectId,
        project,
        domainInput: domain,
        locale: localePreference === "nl" ? "nl" : "en",
      });
      if (!result.ok) {
        setApprovalPackageError(result.error);
        setApprovalPackage(null);
        return;
      }
      setApprovalPackage(result.package);
    } catch {
      setApprovalPackageError(nl ? "Kon campagnepakket niet laden." : "Could not load campaign package.");
      setApprovalPackage(null);
    } finally {
      setApprovalPackageLoading(false);
    }
  }, [domainInput, isDemo, localePreference, nl, peerId, projectId]);

  const closeCampaignApprovalReview = useCallback(() => {
    if (approvalPhase === "processing") return;
    setApprovalReviewOpen(false);
    setApprovalPackage(null);
    setApprovalPackageError(null);
    setApprovalPhase("idle");
  }, [approvalPhase]);

  const handleApprovalPackageApprove = useCallback(() => {
    if (isDemo || !approvalPackage?.publicationReady) return;
    setApprovalPhase("processing");
    setApprovalPackageError(null);

    void (async () => {
      try {
        const domain = freshDomainInput(domainInput, isDemo);
        const project = domain.projects.find((p) => p.id === projectId);
        if (!project) throw new Error("project_not_found");

        const bridgeResult = await submitLiveCampaignStepApprovalAction({
          peerId,
          projectId,
          stepId: resolveEpisodeApprovalBridgeStepId(input.runtimeProjection, "waiting_for_approval"),
          status: "approved",
          project,
          domainInput: domain,
          locale: localePreference === "nl" ? "nl" : "en",
        });

        if (!bridgeResult.ok) {
          throw new Error(bridgeResult.error);
        }

        syncLiveProject(bridgeResult.project);
        setApprovalPhase("success");
        window.setTimeout(() => {
          closeCampaignApprovalReview();
        }, prefersReducedMotion() ? 0 : 700);
      } catch {
        setApprovalPhase("error");
        setApprovalPackageError(
          nl ? "Goedkeuring mislukt. Probeer het opnieuw." : "Approval failed. Please try again."
        );
      }
    })();
  }, [
    approvalPackage?.publicationReady,
    closeCampaignApprovalReview,
    domainInput,
    input.runtimeProjection,
    isDemo,
    localePreference,
    nl,
    peerId,
    projectId,
    syncLiveProject,
  ]);

  const handleApprovalRequestChanges = useCallback(() => {
    closeCampaignApprovalReview();
    setCompanyContextModalOpen(true);
  }, [closeCampaignApprovalReview]);

  const handleNextStepCta = useCallback(() => {
    const domain = freshDomainInput(domainInput, isDemo);
    const project = domain.projects.find((p) => p.id === projectId);
    if (!project) return;
    const workflow = buildCampaignWorkflowViewModel({
      peerId,
      project,
      domainInput: domain,
      locale: localePreference,
      isDemo,
      runtimeProjection: input.runtimeProjection,
    });
    const cta = workflow.nextStepCta;
    if (cta.action === "approve_campaign") {
      void openCampaignApprovalReview();
      return;
    }
    if (cta.action === "review" && cta.draftId) {
      openReview(cta.draftId);
      return;
    }
    if (cta.action === "open_optimization") {
      openOptimization();
      return;
    }
    if (cta.action === "schedule") {
      const pending = draftIdsPendingApproval(domain, projectId);
      if (pending.length > 0) {
        openReview(pending[0]!);
        return;
      }
      setScheduleModalOpen(true);
      return;
    }
    if (cta.action === "publish_demo") {
      if (isDemo) handlePublishCampaign();
      return;
    }
    if (cta.action === "view_published") {
      router.push(`${officeHref(peerId, "content")}?campaign=${projectId}`);
      return;
    }
    if (cta.action === "view_analytics") {
      openOptimization();
      return;
    }
    if (cta.action === "add_context") {
      setCompanyContextModalOpen(true);
      return;
    }
    if (cta.action === "add_website") {
      setWebsiteModalOpen(true);
      return;
    }
    if (cta.action === "add_competitors") {
      setCompetitorModalOpen(true);
      return;
    }
    if (cta.action === "retry_strategy") {
      handleRetryStrategy();
      return;
    }
    if (cta.action === "view_context") {
      handleViewCampaignContext();
      return;
    }
    if (cta.action === "continue" && !cta.stepId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[campaign-cta] Unmapped continue action — no handler or stepId.", cta);
      }
      return;
    }
    if (cta.stepId) {
      openStepById(cta.stepId, domain);
    }
  }, [
    domainInput,
    handlePublishCampaign,
    openOptimization,
    localePreference,
    openReview,
    openStepById,
    peerId,
    projectId,
    router,
    handleRetryStrategy,
    handleViewCampaignContext,
    setScheduleModalOpen,
    input.runtimeProjection,
    openCampaignApprovalReview,
  ]);

  const handleSkipWebsite = useCallback(() => {
    if (isDemo) {
      skipDemoWebsiteAnalysis(peerId, projectId);
      advanceAfter(
        nl ? "Emma verwerkt je keuze..." : "Emma is processing your choice...",
        () => openStepById("competitors_analyzed", freshDomainInput(domainInput, isDemo))
      );
      return;
    }

    const updated = workspace.updateCampaignWebsiteDecision(projectId, { kind: "skip" });
    if (!updated) return;
    setProgressMessage(nl ? "Website overgeslagen." : "Website skipped.");
    const nextDomain: MarketingPeerDomainInput = {
      ...domainInput,
      projects: domainInput.projects.map((p) => (p.id === projectId ? updated : p)),
    };
    void triggerLiveStrategyRun(nextDomain);
    window.setTimeout(() => setProgressMessage(null), prefersReducedMotion() ? 0 : 2400);
  }, [domainInput, isDemo, nl, openStepById, peerId, projectId, triggerLiveStrategyRun, workspace, advanceAfter]);

  const handleAddWebsiteUrl = useCallback(
    async (url: string) => {
      if (isDemo) {
        addDemoWebsiteUrl(peerId, projectId, url);
        setWebsiteModalOpen(false);
        advanceAfter(
          nl ? "Emma verwerkt je websitecontext..." : "Emma is processing your website context...",
          () => openStepById("website_analyzed", freshDomainInput(domainInput, isDemo))
        );
        return;
      }

      const updated = workspace.updateCampaignWebsiteDecision(projectId, { kind: "url", url });
      if (!updated) {
        throw new Error("Failed to persist website URL");
      }
      setWebsiteModalOpen(false);
      setProgressMessage(
        nl ? "Website opgeslagen als context." : "Website saved as context."
      );
      const nextDomain: MarketingPeerDomainInput = {
        ...domainInput,
        projects: domainInput.projects.map((p) => (p.id === projectId ? updated : p)),
      };
      void triggerLiveStrategyRun(nextDomain);
      window.setTimeout(() => setProgressMessage(null), prefersReducedMotion() ? 0 : 2400);
    },
    [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId, triggerLiveStrategyRun, workspace]
  );

  const handleSkipCompetitors = useCallback(() => {
    if (isDemo) {
      skipDemoCompetitorAnalysis(peerId, projectId);
      advanceAfter(
        nl ? "Emma verwerkt je keuze..." : "Emma is processing your choice...",
        () => openStepById("strategy_determined", freshDomainInput(domainInput, isDemo))
      );
      return;
    }

    const updated = workspace.updateCampaignCompetitorDecision(projectId, { kind: "skip" });
    if (!updated) return;
    setProgressMessage(nl ? "Concurrentieanalyse overgeslagen." : "Competitor analysis skipped.");
    const nextDomain: MarketingPeerDomainInput = {
      ...domainInput,
      projects: domainInput.projects.map((p) => (p.id === projectId ? updated : p)),
    };
    void triggerLiveStrategyRun(nextDomain);
    window.setTimeout(() => setProgressMessage(null), prefersReducedMotion() ? 0 : 2400);
  }, [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId, triggerLiveStrategyRun, workspace]);

  const handleAddCompetitors = useCallback(
    async (competitors: readonly DemoCompetitorInput[]) => {
      if (isDemo) {
        addDemoCompetitors(peerId, projectId, competitors);
        setCompetitorModalOpen(false);
        advanceAfter(
          nl ? "Emma vergelijkt je concurrenten..." : "Emma is comparing your competitors...",
          () => openStepById("competitors_analyzed", freshDomainInput(domainInput, isDemo))
        );
        return;
      }

      const updated = workspace.updateCampaignCompetitorDecision(projectId, {
        kind: "list",
        competitors,
      });
      if (!updated) {
        throw new Error("Failed to persist competitors");
      }
      setCompetitorModalOpen(false);
      setProgressMessage(
        nl ? "Concurrenten toegevoegd als context." : "Competitors added as context."
      );
      const nextDomain: MarketingPeerDomainInput = {
        ...domainInput,
        projects: domainInput.projects.map((p) => (p.id === projectId ? updated : p)),
      };
      void triggerLiveStrategyRun(nextDomain);
      window.setTimeout(() => setProgressMessage(null), prefersReducedMotion() ? 0 : 2400);
    },
    [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId, triggerLiveStrategyRun, workspace]
  );

  const handleEvidenceRequestChanges = useCallback(() => {
    if (!evidenceStep || !isDemo) return;
    setDemoStepApproval(peerId, projectId, evidenceStep.id, "changes_requested");
    closeEvidence();
  }, [closeEvidence, evidenceStep, isDemo, peerId, projectId]);

  const handleEvidenceReject = useCallback(() => {
    if (!evidenceStep || !isDemo) return;
    setDemoStepApproval(peerId, projectId, evidenceStep.id, "rejected");
    closeEvidence();
  }, [closeEvidence, evidenceStep, isDemo, peerId, projectId]);

  return {
    evidenceStep,
    evidencePhase,
    evidenceError,
    evidenceProgressLabel,
    evidenceDevDiagnostics,
    setEvidenceStep: openEvidenceStep,
    closeEvidence,
    openReview,
    closeReview,
    handleApproveAll,
    handleDeliverableApprove,
    handleDeliverableChanges,
    handleDeliverableReject,
    handleNextStepCta,
    handleRetryStrategy,
    handleViewCampaignContext,
    handleEvidencePrimary,
    handleEvidenceMissingAction,
    handleEvidenceRequestChanges,
    handleEvidenceReject,
    handleScheduleCampaign,
    handleOpenScheduleModal,
    handlePublishCampaign,
    handleSkipWebsite,
    handleAddWebsiteUrl,
    handleSkipCompetitors,
    handleAddCompetitors,
    websiteModalOpen,
    setWebsiteModalOpen,
    competitorModalOpen,
    setCompetitorModalOpen,
    companyContextModalOpen,
    setCompanyContextModalOpen,
    companyContextInitialValues,
    handleSaveCompanyContext,
    scheduleModalOpen,
    setScheduleModalOpen,
    optimizationOpen,
    setOptimizationOpen: openOptimization,
    closeOptimization,
    progressMessage,
    reviewProgress,
    reviewModel,
    activeReviewDraftId,
    storedWebsiteUrl,
    openStepById,
    approvalReviewOpen,
    approvalPackage,
    approvalPackageLoading,
    approvalPackageError,
    approvalPhase,
    closeCampaignApprovalReview,
    handleApprovalPackageApprove,
    handleApprovalRequestChanges,
  };
}
