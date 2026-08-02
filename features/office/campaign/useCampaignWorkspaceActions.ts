"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { EVIDENCE_NEXT_STEP } from "@/features/office/campaign/CampaignEvidenceModal";
import type { EvidenceModalPhase } from "@/features/office/campaign/CampaignEvidenceModal";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { useMarketingWorkspace } from "@/hooks/useMarketingWorkspace";
import type { CampaignWorkflowStep, CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoCompetitorInput } from "@/lib/office/demo/demo-campaign-store";
import type { DemoCampaignDomainOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";

type Workspace = ReturnType<typeof useMarketingWorkspace>;

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
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { peerId, projectId, domainInput, localePreference, isDemo, workspace } = input;
  const nl = localePreference === "nl";

  const [evidenceStep, setEvidenceStep] = useState<CampaignWorkflowStep | null>(null);
  const [evidencePhase, setEvidencePhase] = useState<EvidenceModalPhase>("idle");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [localReviewDraftId, setLocalReviewDraftId] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [websiteModalOpen, setWebsiteModalOpen] = useState(false);
  const [competitorModalOpen, setCompetitorModalOpen] = useState(false);
  const [optimizationOpen, setOptimizationOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [reviewProgress, setReviewProgress] = useState<string | null>(null);

  const reviewParam = searchParams.get("review");
  const viewParam = searchParams.get("view");
  const activeReviewDraftId = localReviewDraftId ?? reviewParam;

  useEffect(() => {
    if (viewParam === "results") {
      setOptimizationOpen(true);
    }
  }, [viewParam]);

  const closeOptimization = useCallback(() => {
    setOptimizationOpen(false);
    if (searchParams.get("view") === "results") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("view");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const storedWebsiteUrl = isDemo
    ? getDemoCampaignSnapshot().campaignContexts[projectId]?.websiteUrl
    : null;

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
  }, []);

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
      });
      const step = workflow.steps.find((s) => s.id === stepId);
      if (!step?.hasEvidence) return false;
      setEvidencePhase("idle");
      setEvidenceError(null);
      setEvidenceStep(step);
      return true;
    },
    [domainInput, isDemo, localePreference, peerId, projectId]
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
      setEvidencePhase("processing");
      setEvidenceError(null);

      try {
        if (isDemo) {
          setDemoStepApproval(peerId, projectId, stepId, "approved");
        }
        setEvidencePhase("success");
        advanceEvidenceStep(stepId);
      } catch {
        setEvidencePhase("error");
        setEvidenceError(
          nl ? "Er ging iets mis. Probeer het opnieuw." : "Something went wrong. Please try again."
        );
      }
    },
    [advanceEvidenceStep, evidencePhase, isDemo, nl, peerId, projectId]
  );

  const handleEvidencePrimary = useCallback(() => {
    const step = evidenceStep;
    if (!step || evidencePhase === "processing" || evidencePhase === "success") return;
    completeEvidenceStep(step.id);
  }, [completeEvidenceStep, evidencePhase, evidenceStep]);

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
      if (!isDemo) return;
      if (!scheduledAtIso) {
        setScheduleModalOpen(true);
        return;
      }
      scheduleDemoCampaign(peerId, projectId, scheduledAtIso);
    },
    [isDemo, peerId, projectId]
  );

  const handleOpenScheduleModal = useCallback(() => {
    setScheduleModalOpen(true);
  }, []);

  const handlePublishCampaign = useCallback(() => {
    if (!isDemo) return;
    publishDemoCampaign(peerId, projectId);
  }, [isDemo, peerId, projectId]);

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
    });
    const cta = workflow.nextStepCta;
    if (cta.action === "review" && cta.draftId) {
      openReview(cta.draftId);
      return;
    }
    if (cta.action === "open_optimization") {
      setOptimizationOpen(true);
      return;
    }
    if (cta.action === "schedule") {
      const pending = draftIdsPendingApproval(domain, projectId);
      if (pending.length > 0) {
        openReview(pending[0]!);
        return;
      }
      if (isDemo) {
        setScheduleModalOpen(true);
      }
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
      setOptimizationOpen(true);
      return;
    }
    if (cta.stepId) {
      openStepById(cta.stepId, domain);
    }
  }, [
    domainInput,
    handlePublishCampaign,
    handleScheduleCampaign,
    isDemo,
    localePreference,
    openReview,
    openStepById,
    peerId,
    projectId,
    router,
  ]);

  const handleSkipWebsite = useCallback(() => {
    if (!isDemo) return;
    skipDemoWebsiteAnalysis(peerId, projectId);
    advanceAfter(
      nl ? "Emma verwerkt je keuze..." : "Emma is processing your choice...",
      () => openStepById("competitors_analyzed", freshDomainInput(domainInput, isDemo))
    );
  }, [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId]);

  const handleAddWebsiteUrl = useCallback(
    (url: string) => {
      if (!isDemo) return;
      addDemoWebsiteUrl(peerId, projectId, url);
      advanceAfter(
        nl ? "Emma verwerkt je websitecontext..." : "Emma is processing your website context...",
        () => openStepById("website_analyzed", freshDomainInput(domainInput, isDemo))
      );
    },
    [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId]
  );

  const handleSkipCompetitors = useCallback(() => {
    if (!isDemo) return;
    skipDemoCompetitorAnalysis(peerId, projectId);
    advanceAfter(
      nl ? "Emma verwerkt je keuze..." : "Emma is processing your choice...",
      () => openStepById("strategy_determined", freshDomainInput(domainInput, isDemo))
    );
  }, [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId]);

  const handleAddCompetitors = useCallback(
    (competitors: readonly DemoCompetitorInput[]) => {
      if (!isDemo) return;
      addDemoCompetitors(peerId, projectId, competitors);
      advanceAfter(
        nl ? "Emma vergelijkt je concurrenten..." : "Emma is comparing your competitors...",
        () => openStepById("competitors_analyzed", freshDomainInput(domainInput, isDemo))
      );
    },
    [advanceAfter, domainInput, isDemo, nl, openStepById, peerId, projectId]
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
    setEvidenceStep,
    closeEvidence,
    openReview,
    closeReview,
    handleApproveAll,
    handleDeliverableApprove,
    handleDeliverableChanges,
    handleDeliverableReject,
    handleNextStepCta,
    handleEvidencePrimary,
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
    scheduleModalOpen,
    setScheduleModalOpen,
    optimizationOpen,
    setOptimizationOpen,
    closeOptimization,
    progressMessage,
    reviewProgress,
    reviewModel,
    activeReviewDraftId,
    storedWebsiteUrl,
    openStepById,
  };
}
