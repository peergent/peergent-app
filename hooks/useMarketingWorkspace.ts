"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import type { MarketingLinkedInPost } from "@/lib/marketing-intelligence/linkedin-post-generation";
import type { MarketingEmailCampaign } from "@/lib/marketing-intelligence/email-generation";
import type { CreativeBrief } from "@/lib/creative-brief";
import { isDraftablePlanActivity } from "@/lib/marketing-intelligence";
import {
  applyUnderstandingToWorkspace,
  createActivity,
  createConversationMessage,
  createReloadGuard,
  fetchMarketingProfile,
  fetchMarketingUnderstanding,
  findPublicationPackageForDraft,
  findDraftIdForTimelineNode,
  generateContentDraft,
  generateMarketingPlan,
  generateMarketingStrategy,
  loadMarketingWorkspaceState,
  markPublicationPackagePublished,
  patchMarketingWorkspaceState,
  prependActivity,
  prepareDraftForPublication,
  respondToConversation,
  type ActivityFeedItem,
  type ConversationMessage,
  type ConversationNextStep,
  type RecommendedAction,
} from "@/lib/marketing-workspace";
import { buildMarketingViewModel } from "@/lib/peer-experience";
import type { PrimaryAction } from "@/lib/peer-experience";
import type { PublicationPackage } from "@/lib/peer-workflow";
import { mergeApprovalOverlay, type ApprovalDeliverableOverlay } from "@/lib/peer-experience/marketing/approval/approval-overlay";
import type { ApprovalDeliverableContent, ApprovalMediaAsset } from "@/lib/peer-experience/marketing/approval/types";
import {
  cancelWorkUnit,
  createAutomationFromWorkUnit,
  createWorkUnit,
  deliverableKindFromChannel,
  mapRecurrenceToEngine,
  pauseWorkUnit,
  recordWorkUnitNote,
  resumeWorkUnit,
  transitionWorkUnit,
} from "@/lib/peer-workflow";
import { revertWorkUnitFromFailedExecution } from "@/lib/peer-workflow/work-unit-engine";
import type { WorkAutomation, WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  persistLiveCampaignWebsiteSkip,
  persistLiveCampaignWebsiteUrl,
  persistLiveCampaignCompetitors,
  persistLiveCampaignCompetitorSkip,
  persistLiveCampaignBrandContext,
  persistLiveCampaignBusinessAnalysisApproval,
  persistLiveCampaignStepApproval,
  persistLiveCampaignStrategyOutput,
  type LiveWebsiteDecision,
  type LiveCompetitorDecision,
  type LiveCampaignBrandContext,
  type LiveBusinessAnalysisDecision,
} from "@/lib/office/campaign/live-campaign-context-store";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";
import {
  applyCampaignOnboardingToProject,
  CampaignOnboardingValidationError,
  type CampaignOnboardingInput,
  type CampaignOnboardingResult,
} from "@/lib/peer-experience/marketing/campaign-onboarding";
import {
  createMarketingCampaignProject,
  createMarketingProject,
  type CreateMarketingCampaignProjectInput,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";
import { evaluateResponsibility } from "@/lib/peer-experience/marketing/responsibilities/evaluation-engine";
import { touchResponsibilityEvaluation } from "@/lib/peer-experience/marketing/responsibilities/responsibility-engine";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { InsightRotationState } from "@/lib/peer-experience/marketing/build-insights-engine";
import { dismissInsight } from "@/lib/peer-experience/marketing/build-insights-engine";
import { syncWorkUnitsWithMarketingState } from "@/lib/peer-experience/marketing/sync-work-units";
import { isChannelConnectedForPublishing } from "@/lib/integrations/types";
import { loadIntegrationConnections } from "@/lib/integrations/connection-store";
import { fetchOrganizationPeerById } from "@/lib/peers/queries";
import { knowledgeSectionHref } from "@/lib/knowledge";
import type { PeerRow } from "@/lib/peer-display";
import type { DelegationTask } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import {
  buildDelegationActivityTitle,
  findPlanActivityForDelegation,
} from "@/lib/peer-experience/marketing/resolve-delegation-plan-activity";
import { delegationTaskTitle } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import {
  CAMPAIGN_EXECUTION_ACTIVITY_TITLE,
  campaignExecutionWorkspaceResultFromError,
  executeMarketingCampaign,
  shouldAppendCampaignExecutionActivity,
  type CampaignExecutionWorkspaceResult,
  CampaignExecutionWorkspaceFeatureDisabledError,
} from "@/lib/peer-experience/marketing/campaign-execution";
import {
  executeMarketingWorkUnitInWorkspace,
  logMarketingWorkUnitExecutionFailure,
  marketingWorkUnitExecutionResultFromError,
  type MarketingWorkUnitExecutionResult,
} from "@/lib/peer-experience/marketing/runtime";
import {
  runCampaignContinuation,
  type CampaignContinuationResult,
} from "@/lib/peer-experience/marketing/campaign-continuation";
import {
  approveCampaignReviewItem,
  hasPendingRequiredCampaignReview,
  rejectCampaignReviewItem,
  requestCampaignReviewChanges,
  reviseCampaignReviewItem,
} from "@/lib/peer-experience/marketing/campaign-review-decisions/campaign-review-workspace-handlers";
import type {
  CampaignReviewDecision,
  CampaignReviewFeedback,
  CampaignReviewRejectionReason,
  CampaignReviewDecisionResult,
} from "@/lib/peer-experience/marketing/campaign-review-decisions";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { resolveCampaignTitle } from "@/lib/peer-experience/marketing/resolve-campaign-title";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { createClient } from "@/lib/supabase/client";

export type { MarketingWorkUnitExecutionResult } from "@/lib/peer-experience/marketing/runtime";

export type MarketingWorkspacePageState =
  | "loading"
  | "success"
  | "error"
  | "not-found"
  | "wrong-role";

type GeneratingAction =
  | "understanding"
  | "strategy"
  | "plan"
  | "draft"
  | "publication"
  | null;

export function useMarketingWorkspace(
  peerId: string | undefined,
  organizationId: string
) {
  const [peer, setPeer] = useState<PeerRow | null>(null);
  const [pageState, setPageState] = useState<MarketingWorkspacePageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(null);
  const [profileCounts, setProfileCounts] = useState({ goals: 0, content: 0 });
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null);
  const [creativeBriefByCampaignId, setCreativeBriefByCampaignId] = useState<
    Record<string, CreativeBrief>
  >({});
  const [linkedinPostByWorkUnitId, setLinkedinPostByWorkUnitId] = useState<
    Record<string, MarketingLinkedInPost>
  >({});
  const [emailByWorkUnitId, setEmailByWorkUnitId] = useState<
    Record<string, MarketingEmailCampaign>
  >({});
  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [drafts, setDrafts] = useState<MarketingContentDraft[]>([]);
  const [publicationPackages, setPublicationPackages] = useState<PublicationPackage[]>([]);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [generating, setGenerating] = useState<GeneratingAction>(null);
  const [generatingActivity, setGeneratingActivity] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedTimelineNodeId, setSelectedTimelineNodeId] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [pendingNextStep, setPendingNextStep] = useState<ConversationNextStep | null>(null);
  const [activeDelegation, setActiveDelegation] = useState<{
    title: string;
    needsVisual: boolean;
  } | null>(null);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [projects, setProjects] = useState<MarketingProject[]>([]);
  const [responsibilities, setResponsibilities] = useState<MarketingResponsibility[]>([]);
  const [automations, setAutomations] = useState<WorkAutomation[]>([]);
  const [insightRotation, setInsightRotation] = useState<InsightRotationState>({
    dismissedIds: [],
    lastIndex: -1,
    lastRotatedAt: new Date(0).toISOString(),
  });
  const [storedMetrics, setStoredMetrics] = useState<MetricSnapshot[]>([]);
  const [approvalOverlays, setApprovalOverlays] = useState<Record<string, ApprovalDeliverableOverlay>>({});
  const [campaignReviewDecisionByWorkUnitId, setCampaignReviewDecisionByWorkUnitId] = useState<
    Record<string, CampaignReviewDecision>
  >({});
  const [campaignReviewDecisionHistoryByWorkUnitId, setCampaignReviewDecisionHistoryByWorkUnitId] =
    useState<Record<string, readonly CampaignReviewDecision[]>>({});
  const [campaignArtifactVersionByWorkUnitId, setCampaignArtifactVersionByWorkUnitId] = useState<
    Record<string, number>
  >({});
  const [approvalPublishMessage, setApprovalPublishMessage] = useState<string | null>(null);
  const [activeWorkUnitId, setActiveWorkUnitId] = useState<string | null>(null);
  const [selectedWorkUnitId, setSelectedWorkUnitId] = useState<string | null>(null);
  const [taskDrawerTab, setTaskDrawerTab] = useState<
    import("@/lib/peer-experience/marketing/build-task-drawer-model").TaskDrawerTab
  >("overview");
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);

  const hasLoadedOnceRef = useRef(false);
  const pageStateRef = useRef(pageState);
  const generatingRef = useRef<GeneratingAction>(null);
  const reloadGuardRef = useRef(createReloadGuard());
  const reloadUnderstandingRef = useRef<(() => Promise<void>) | null>(null);
  const projectsRef = useRef(projects);
  const workUnitsRef = useRef(workUnits);
  const strategyRef = useRef(strategy);
  const creativeBriefByCampaignIdRef = useRef(creativeBriefByCampaignId);
  const linkedinPostByWorkUnitIdRef = useRef(linkedinPostByWorkUnitId);
  const emailByWorkUnitIdRef = useRef(emailByWorkUnitId);
  const campaignReviewDecisionByWorkUnitIdRef = useRef(campaignReviewDecisionByWorkUnitId);
  const campaignReviewDecisionHistoryByWorkUnitIdRef = useRef(
    campaignReviewDecisionHistoryByWorkUnitId
  );
  const campaignArtifactVersionByWorkUnitIdRef = useRef(campaignArtifactVersionByWorkUnitId);
  const workUnitExecutionInFlightRef = useRef<string | null>(null);
  const campaignContinuationInFlightRef = useRef(false);
  const campaignReviewActionInFlightRef = useRef<string | null>(null);
  const handleContinueCampaignRef = useRef<
    ((projectId: string) => Promise<CampaignContinuationResult>) | null
  >(null);
  const [campaignContinuationRunning, setCampaignContinuationRunning] = useState(false);

  projectsRef.current = projects;
  workUnitsRef.current = workUnits;
  strategyRef.current = strategy;
  creativeBriefByCampaignIdRef.current = creativeBriefByCampaignId;
  linkedinPostByWorkUnitIdRef.current = linkedinPostByWorkUnitId;
  emailByWorkUnitIdRef.current = emailByWorkUnitId;
  campaignReviewDecisionByWorkUnitIdRef.current = campaignReviewDecisionByWorkUnitId;
  campaignReviewDecisionHistoryByWorkUnitIdRef.current =
    campaignReviewDecisionHistoryByWorkUnitId;
  campaignArtifactVersionByWorkUnitIdRef.current = campaignArtifactVersionByWorkUnitId;

  pageStateRef.current = pageState;
  generatingRef.current = generating;

  const persistState = useCallback(
    (patch: {
      strategy?: MarketingStrategy | null;
      creativeBriefByCampaignId?: Record<string, CreativeBrief>;
      linkedinPostByWorkUnitId?: Record<string, MarketingLinkedInPost>;
      emailByWorkUnitId?: Record<string, MarketingEmailCampaign>;
      plan?: MarketingPlan | null;
      drafts?: MarketingContentDraft[];
      publicationPackages?: PublicationPackage[];
      activityFeed?: ActivityFeedItem[];
      conversation?: ConversationMessage[];
      workUnits?: WorkUnit[];
      projects?: MarketingProject[];
      responsibilities?: MarketingResponsibility[];
      automations?: WorkAutomation[];
      insightRotation?: InsightRotationState;
      metrics?: MetricSnapshot[];
      approvalOverlays?: Record<string, ApprovalDeliverableOverlay>;
      campaignReviewDecisionByWorkUnitId?: Record<string, CampaignReviewDecision>;
      campaignReviewDecisionHistoryByWorkUnitId?: Record<
        string,
        readonly CampaignReviewDecision[]
      >;
      campaignArtifactVersionByWorkUnitId?: Record<string, number>;
    }) => {
      if (!peerId) return;
      patchMarketingWorkspaceState(peerId, {
        ...(patch.strategy !== undefined
          ? { strategy: patch.strategy ?? undefined }
          : {}),
        ...(patch.creativeBriefByCampaignId !== undefined
          ? { creativeBriefByCampaignId: patch.creativeBriefByCampaignId }
          : {}),
        ...(patch.linkedinPostByWorkUnitId !== undefined
          ? { linkedinPostByWorkUnitId: patch.linkedinPostByWorkUnitId }
          : {}),
        ...(patch.emailByWorkUnitId !== undefined
          ? { emailByWorkUnitId: patch.emailByWorkUnitId }
          : {}),
        ...(patch.plan !== undefined ? { plan: patch.plan ?? undefined } : {}),
        ...(patch.drafts !== undefined ? { drafts: patch.drafts } : {}),
        ...(patch.publicationPackages !== undefined
          ? { publicationPackages: patch.publicationPackages }
          : {}),
        ...(patch.activityFeed !== undefined ? { activityFeed: patch.activityFeed } : {}),
        ...(patch.conversation !== undefined ? { conversation: patch.conversation } : {}),
        ...(patch.workUnits !== undefined ? { workUnits: patch.workUnits } : {}),
        ...(patch.projects !== undefined ? { projects: patch.projects } : {}),
        ...(patch.responsibilities !== undefined ? { responsibilities: patch.responsibilities } : {}),
        ...(patch.automations !== undefined ? { automations: patch.automations } : {}),
        ...(patch.insightRotation !== undefined
          ? { insightRotation: patch.insightRotation }
          : {}),
        ...(patch.metrics !== undefined ? { metrics: patch.metrics } : {}),
        ...(patch.approvalOverlays !== undefined
          ? { approvalOverlays: patch.approvalOverlays }
          : {}),
        ...(patch.campaignReviewDecisionByWorkUnitId !== undefined
          ? { campaignReviewDecisionByWorkUnitId: patch.campaignReviewDecisionByWorkUnitId }
          : {}),
        ...(patch.campaignReviewDecisionHistoryByWorkUnitId !== undefined
          ? {
              campaignReviewDecisionHistoryByWorkUnitId:
                patch.campaignReviewDecisionHistoryByWorkUnitId,
            }
          : {}),
        ...(patch.campaignArtifactVersionByWorkUnitId !== undefined
          ? { campaignArtifactVersionByWorkUnitId: patch.campaignArtifactVersionByWorkUnitId }
          : {}),
      });
    },
    [peerId]
  );

  const syncedWorkUnits = useMemo(
    () =>
      syncWorkUnitsWithMarketingState({
        workUnits,
        activeWorkUnitId,
        generating,
        generatingActivity,
        drafts,
      }),
    [workUnits, activeWorkUnitId, generating, generatingActivity, drafts]
  );

  const updateResponsibilities = useCallback(
    (next: MarketingResponsibility[]) => {
      setResponsibilities(next);
      persistState({ responsibilities: next });
    },
    [persistState]
  );

  const updateProjects = useCallback(
    (next: MarketingProject[]) => {
      setProjects(next);
      persistState({ projects: next });
    },
    [persistState]
  );

  const updateWorkUnits = useCallback(
    (next: WorkUnit[]) => {
      setWorkUnits(next);
      persistState({ workUnits: next });
    },
    [persistState]
  );

  const logActivity = useCallback(
    (item: ActivityFeedItem) => {
      setActivityFeed((prev) => {
        const next = prependActivity(prev, item);
        persistState({ activityFeed: next });
        return next;
      });
    },
    [persistState]
  );

  const loadWorkspace = useCallback(async () => {
    if (!peerId) {
      setPageState("not-found");
      return;
    }

    setErrorMessage("");
    setApiWarnings([]);

    try {
      const supabase = createClient();
      const row = await fetchOrganizationPeerById(supabase, peerId, organizationId);

      if (!row) {
        setPageState("not-found");
        return;
      }

      if (row.role !== "Marketing") {
        setPeer(row);
        setPageState("wrong-role");
        return;
      }

      setPeer(row);

      const stored = loadMarketingWorkspaceState(peerId);
      setStrategy(stored.strategy ?? null);
      setCreativeBriefByCampaignId(stored.creativeBriefByCampaignId ?? {});
      setLinkedinPostByWorkUnitId(stored.linkedinPostByWorkUnitId ?? {});
      setEmailByWorkUnitId(stored.emailByWorkUnitId ?? {});
      setPlan(stored.plan ?? null);
      setDrafts(stored.drafts ?? []);
      setPublicationPackages(stored.publicationPackages ?? []);
      setActivityFeed(stored.activityFeed ?? []);
      setConversation(stored.conversation ?? []);
      setWorkUnits(stored.workUnits ?? []);
      setProjects(stored.projects ?? []);
      setResponsibilities(stored.responsibilities ?? []);
      setAutomations(stored.automations ?? []);
      setInsightRotation(
        stored.insightRotation ?? {
          dismissedIds: [],
          lastIndex: -1,
          lastRotatedAt: new Date(0).toISOString(),
        }
      );
      setStoredMetrics(stored.metrics ?? []);
      setApprovalOverlays(stored.approvalOverlays ?? {});
      setCampaignReviewDecisionByWorkUnitId(stored.campaignReviewDecisionByWorkUnitId ?? {});
      setCampaignReviewDecisionHistoryByWorkUnitId(
        stored.campaignReviewDecisionHistoryByWorkUnitId ?? {}
      );
      setCampaignArtifactVersionByWorkUnitId(stored.campaignArtifactVersionByWorkUnitId ?? {});

      setGenerating("understanding");
      const [understandingResult, profileResult] = await Promise.all([
        fetchMarketingUnderstanding(),
        fetchMarketingProfile().catch(() => null),
      ]);

      setUnderstanding(understandingResult.understanding);
      if (profileResult?.profile) {
        setProfileCounts({
          goals: profileResult.profile.goals.length,
          content: profileResult.profile.contentItems.length,
        });
      }

      const nextFeed = applyUnderstandingToWorkspace(
        peerId,
        understandingResult.understanding,
        stored.activityFeed ?? []
      );
      setActivityFeed(nextFeed);

      hasLoadedOnceRef.current = true;
      setGenerating(null);
      setPageState("success");
    } catch (error) {
      setGenerating(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load marketing workspace."
      );
      setPageState("error");
    }
  }, [peerId, organizationId]);

  useEffect(() => {
    hasLoadedOnceRef.current = false;
    void loadWorkspace();
  }, [peerId, organizationId, loadWorkspace]);

  const reloadUnderstanding = useCallback(async () => {
    if (!peerId || pageStateRef.current !== "success") return;

    const activeGeneration = generatingRef.current;
    if (activeGeneration && activeGeneration !== "understanding") {
      return;
    }

    await reloadGuardRef.current.run(async () => {
      if (!activeGeneration) {
        setGenerating("understanding");
      }
      try {
        const stored = loadMarketingWorkspaceState(peerId);
        const [understandingResult, profileResult] = await Promise.all([
          fetchMarketingUnderstanding(),
          fetchMarketingProfile().catch(() => null),
        ]);
        const nextFeed = applyUnderstandingToWorkspace(
          peerId,
          understandingResult.understanding,
          stored.activityFeed ?? []
        );
        setActivityFeed(nextFeed);
        setUnderstanding(understandingResult.understanding);
        if (profileResult?.profile) {
          setProfileCounts({
            goals: profileResult.profile.goals.length,
            content: profileResult.profile.contentItems.length,
          });
        }
      } catch (error) {
        setApiWarnings([
          error instanceof Error ? error.message : "Failed to reload marketing understanding.",
        ]);
      } finally {
        if (!activeGeneration) {
          setGenerating(null);
        }
      }
    });
  }, [peerId]);

  reloadUnderstandingRef.current = reloadUnderstanding;

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible" && hasLoadedOnceRef.current) {
        void reloadUnderstandingRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
    };
  }, []);

  const viewModel = useMemo(
    () =>
      buildMarketingViewModel({
        generating,
        generatingActivity,
        understanding,
        strategy,
        plan,
        drafts,
        publicationPackages,
        selectedTimelineNodeId,
        profileCounts,
        activityFeed,
      }),
    [
      generating,
      generatingActivity,
      understanding,
      strategy,
      plan,
      drafts,
      publicationPackages,
      selectedTimelineNodeId,
      profileCounts,
      activityFeed,
    ]
  );

  const handleGenerateDraftWithHint = useCallback(
    async (planActivityReference: string, taskHint?: string) => {
      if (!peerId || !plan) return;

      const activity = plan.contentCalendar.find(
        (entry) =>
          entry.title.trim().toLowerCase() === planActivityReference.trim().toLowerCase()
      );
      if (!activity || !isDraftablePlanActivity(activity)) {
        setApiWarnings([
          `Draft creation is not supported for content type "${activity?.contentType ?? "unknown"}". Regenerate the plan to use a supported content type.`,
        ]);
        return;
      }

      setGenerating("draft");
      setGeneratingActivity(planActivityReference);
      setApiWarnings([]);
      try {
        const result = await generateContentDraft(
          peerId,
          plan,
          planActivityReference,
          taskHint
        );
        const nextDrafts = [
          ...drafts.filter(
            (draft) =>
              draft.planActivityReference.trim().toLowerCase() !==
              planActivityReference.trim().toLowerCase()
          ),
          result.draft,
        ];
        setDrafts(nextDrafts);
        setSelectedDraftId(result.draft.id);
        setApiWarnings(result.warnings);
        persistState({ drafts: nextDrafts });
        if (activeWorkUnitId) {
          const nextUnits = workUnits.map((unit) =>
            unit.id === activeWorkUnitId ? { ...unit, draftId: result.draft.id } : unit
          );
          updateWorkUnits(nextUnits);
        }
        logActivity(
          createActivity(
            "draft_generated",
            `Generated ${result.draft.title}`,
            result.draft.rationale.why.slice(0, 140),
            {
              relatedObject: result.draft.title,
              confidence: result.draft.confidence,
            }
          )
        );
        logActivity(
          createActivity(
            "waiting_approval",
            "Waiting for approval",
            `"${result.draft.title}" is ready for your review.`,
            { relatedObject: result.draft.title }
          )
        );
      } catch (error) {
        setApiWarnings([
          error instanceof Error ? error.message : "Draft generation failed.",
        ]);
      } finally {
        setGenerating(null);
        setGeneratingActivity(null);
        setActiveDelegation(null);
        setActiveWorkUnitId(null);
      }
    },
    [peerId, plan, drafts, persistState, logActivity, activeWorkUnitId, workUnits, updateWorkUnits]
  );

  const handleGenerateDraft = useCallback(
    async (planActivityReference: string) => {
      await handleGenerateDraftWithHint(planActivityReference);
    },
    [handleGenerateDraftWithHint]
  );

  const handleExecuteDelegation = useCallback(
    async (task: DelegationTask) => {
      if (!peerId) return;

      const title = delegationTaskTitle(task);
      setActiveDelegation({
        title,
        needsVisual: task.needsVisual,
      });
      setApiWarnings([]);

      const channelName =
        task.channel === "instagram"
          ? "Instagram"
          : task.channel === "linkedin"
            ? "LinkedIn"
            : task.channel;

      const deliverableKind = deliverableKindFromChannel(channelName);
      const project = createMarketingProject({
        peerId,
        title,
        goal: task.objectiveLabel ?? task.rawMessage,
        channel: channelName,
        deliverableKind,
        rawRequest: task.rawMessage,
        ownerLabel: "You",
        origin: "manual_assignment",
      });
      const nextProjects = [project, ...projects];
      updateProjects(nextProjects);

      let unit = createWorkUnit({
        peerId,
        projectId: project.id,
        role: "Marketing",
        title,
        deliverableKind,
        channel: channelName,
        objective: task.objectiveLabel,
        audience: task.audience,
        needsVisual: task.needsVisual,
        recurrence: mapRecurrenceToEngine(task.recurrence),
        automationTrigger:
          task.recurrence === "trigger" ? "blog_published" : null,
        rawRequest: task.rawMessage,
      });
      unit = transitionWorkUnit(unit, "understanding", "understanding_started", "Understanding your request");
      const nextUnits = [unit, ...workUnits];
      updateWorkUnits(nextUnits);
      setActiveWorkUnitId(unit.id);

      try {
        let nextStrategy = strategy;
        if (!nextStrategy) {
          setGenerating("strategy");
          const strategyResult = await generateMarketingStrategy(peerId, task.taskHint);
          nextStrategy = strategyResult.strategy;
          setStrategy(nextStrategy);
          setApiWarnings(strategyResult.warnings);
          persistState({ strategy: nextStrategy });
        }

        let nextPlan = plan;
        if (!nextPlan && nextStrategy) {
          setGenerating("plan");
          const planResult = await generateMarketingPlan(peerId, nextStrategy, task.taskHint);
          nextPlan = planResult.plan;
          setPlan(nextPlan);
          setApiWarnings(planResult.warnings);
          persistState({ plan: nextPlan });
        }

        if (!nextPlan) {
          setApiWarnings(["I need a campaign plan before I can create this content."]);
          return;
        }

        const activityRef = findPlanActivityForDelegation(nextPlan, task.channel);
        if (!activityRef) {
          setApiWarnings([
            "Your campaign plan doesn't have a draftable activity for this channel yet. Regenerate the plan or add a matching calendar item.",
          ]);
          return;
        }

        updateWorkUnits(
          nextUnits.map((u) =>
            u.id === unit.id
              ? { ...u, planActivityReference: activityRef }
              : u
          )
        );

        if (task.recurrence !== "once") {
          const automation = createAutomationFromWorkUnit(
            { ...unit, planActivityReference: activityRef },
            task.recurrence === "trigger" ? "Automatic trigger" : `${task.recurrence} schedule`
          );
          if (automation) {
            const nextAutomations = [...automations, automation];
            setAutomations(nextAutomations);
            persistState({ automations: nextAutomations });
            logActivity(
              createActivity(
                "plan_completed",
                "Automation scheduled",
                `${title} will run on a ${task.recurrence} basis.`,
                { relatedObject: title }
              )
            );
          }
        }

        await handleGenerateDraftWithHint(
          activityRef,
          `${task.taskHint} Activity title: ${buildDelegationActivityTitle(task)}.`
        );
      } catch (error) {
        setApiWarnings([
          error instanceof Error ? error.message : "Could not start this task.",
        ]);
        setActiveDelegation(null);
        setGenerating(null);
        setGeneratingActivity(null);
        setActiveWorkUnitId(null);
      }
    },
    [
      peerId,
      strategy,
      plan,
      workUnits,
      projects,
      automations,
      persistState,
      updateProjects,
      logActivity,
      handleGenerateDraftWithHint,
      updateWorkUnits,
    ]
  );

  const selectTimelineNode = useCallback(
    (nodeId: string) => {
      setSelectedTimelineNodeId(nodeId);
      const draftId = findDraftIdForTimelineNode(nodeId, drafts);
      if (draftId) {
        setSelectedDraftId(draftId);
      }
    },
    [drafts]
  );

  useEffect(() => {
    const validIds = new Set(viewModel.timeline.nodes.map((node) => node.id));
    if (selectedTimelineNodeId && !validIds.has(selectedTimelineNodeId)) {
      setSelectedTimelineNodeId(null);
    }
  }, [viewModel.timeline.nodes, selectedTimelineNodeId]);

  const selectedDraft = useMemo(() => {
    const timelineDraftId = viewModel.timeline.selectedNodeId
      ? findDraftIdForTimelineNode(viewModel.timeline.selectedNodeId, drafts)
      : undefined;
    const id = timelineDraftId ?? selectedDraftId;
    return drafts.find((draft) => draft.id === id) ?? drafts[0];
  }, [viewModel.timeline.selectedNodeId, selectedDraftId, drafts]);

  const handleGenerateStrategy = useCallback(async () => {
    if (!peerId) return;
    setGenerating("strategy");
    setApiWarnings([]);
    try {
      const result = await generateMarketingStrategy(peerId);
      setStrategy(result.strategy);
      setApiWarnings(result.warnings);
      persistState({ strategy: result.strategy });
      logActivity(
        createActivity(
          "strategy_completed",
          "Completed marketing strategy",
          result.strategy.summary.slice(0, 140),
          { confidence: result.strategy.confidence }
        )
      );
    } catch (error) {
      setApiWarnings([
        error instanceof Error ? error.message : "Strategy generation failed.",
      ]);
    } finally {
      setGenerating(null);
    }
  }, [peerId, persistState, logActivity]);

  const handleGeneratePlan = useCallback(async () => {
    if (!peerId || !strategy) return;
    setGenerating("plan");
    setApiWarnings([]);
    try {
      const result = await generateMarketingPlan(peerId, strategy);
      setPlan(result.plan);
      setApiWarnings(result.warnings);
      persistState({ plan: result.plan });
      logActivity(
        createActivity(
          "plan_completed",
          "Created marketing plan",
          result.plan.summary.slice(0, 140),
          { confidence: result.plan.confidence }
        )
      );
    } catch (error) {
      setApiWarnings([
        error instanceof Error ? error.message : "Plan generation failed.",
      ]);
    } finally {
      setGenerating(null);
    }
  }, [peerId, strategy, persistState, logActivity]);

  const handleDraftStatus = useCallback(
    (draftId: string, status: MarketingContentDraft["status"]) => {
      const draft = drafts.find((item) => item.id === draftId);
      const nextDrafts = drafts.map((item) =>
        item.id === draftId ? { ...item, status } : item
      );
      setDrafts(nextDrafts);
      persistState({ drafts: nextDrafts });
      const synced = syncWorkUnitsWithMarketingState({
        workUnits,
        activeWorkUnitId,
        generating,
        generatingActivity,
        drafts: nextDrafts,
      });
      updateWorkUnits(synced);
      if (draft) {
        if (status === "approved") {
          logActivity(
            createActivity(
              "draft_approved",
              "Draft approved",
              `"${draft.title}" was approved.`,
              { relatedObject: draft.title }
            )
          );
        } else if (status === "rejected") {
          logActivity(
            createActivity(
              "draft_rejected",
              "Draft rejected",
              `"${draft.title}" was marked as needing changes.`,
              { relatedObject: draft.title }
            )
          );
        } else if (status === "ready_for_review") {
          logActivity(
            createActivity(
              "waiting_approval",
              "Waiting for approval",
              `"${draft.title}" is marked ready for your review.`,
              { relatedObject: draft.title }
            )
          );
        }
      }
    },
    [drafts, persistState, logActivity, workUnits, activeWorkUnitId, generating, generatingActivity, updateWorkUnits]
  );

  const handlePreparePublication = useCallback(
    (draftId: string) => {
      const draft = drafts.find((item) => item.id === draftId);
      if (!draft || draft.status !== "approved") return;

      const connections = loadIntegrationConnections(organizationId);
      if (!isChannelConnectedForPublishing(connections, draft.channel ?? draft.contentType)) {
        setApiWarnings([
          "Connect the publishing channel before you can publish. Open Connected Channels to link your account.",
        ]);
        return;
      }

      setGenerating("publication");
      setGeneratingActivity(draft.planActivityReference);
      try {
        const prepared = prepareDraftForPublication(draft);
        const nextDrafts = drafts.map((item) =>
          item.id === draftId ? { ...item, status: "ready_to_publish" as const } : item
        );
        const nextPackages = [
          ...publicationPackages.filter((pkg) => pkg.draftId !== draftId),
          prepared,
        ];
        setDrafts(nextDrafts);
        setPublicationPackages(nextPackages);
        persistState({ drafts: nextDrafts, publicationPackages: nextPackages });
        updateWorkUnits(
          syncWorkUnitsWithMarketingState({
            workUnits,
            activeWorkUnitId,
            generating: "publication",
            generatingActivity: draft.planActivityReference,
            drafts: nextDrafts,
          })
        );
        logActivity(
          createActivity(
            "publication_prepared",
            "Prepared for publication",
            `"${draft.title}" is packaged for ${prepared.channel.replace(/_/g, " ")}.`,
            { relatedObject: draft.title }
          )
        );
        logActivity(
          createActivity(
            "publication_ready",
            "Ready to publish",
            `"${draft.title}" is ready — confirm when you have published it.`,
            { relatedObject: draft.title }
          )
        );
      } catch (error) {
        setApiWarnings([
          error instanceof Error ? error.message : "Publication preparation failed.",
        ]);
      } finally {
        setGenerating(null);
        setGeneratingActivity(null);
      }
    },
    [drafts, publicationPackages, persistState, logActivity, organizationId, workUnits, activeWorkUnitId, updateWorkUnits]
  );

  const handleMarkPublished = useCallback(
    (draftId: string) => {
      const draft = drafts.find((item) => item.id === draftId);
      const pkg = findPublicationPackageForDraft(publicationPackages, draftId);
      if (!draft || draft.status !== "ready_to_publish" || !pkg) return;

      const connections = loadIntegrationConnections(organizationId);
      if (!isChannelConnectedForPublishing(connections, draft.channel ?? draft.contentType)) {
        setApiWarnings([
          "Connect the publishing channel before confirming publication.",
        ]);
        return;
      }

      const publishedPackage = markPublicationPackagePublished(pkg);
      const nextDrafts = drafts.map((item) =>
        item.id === draftId ? { ...item, status: "published" as const } : item
      );
      const nextPackages = publicationPackages.map((item) =>
        item.draftId === draftId ? publishedPackage : item
      );
      setDrafts(nextDrafts);
      setPublicationPackages(nextPackages);
      persistState({ drafts: nextDrafts, publicationPackages: nextPackages });
      updateWorkUnits(
        syncWorkUnitsWithMarketingState({
          workUnits,
          activeWorkUnitId,
          generating: null,
          generatingActivity: null,
          drafts: nextDrafts,
        })
      );
      logActivity(
        createActivity(
          "published",
          "Marked as published",
          `"${draft.title}" was confirmed published on ${publishedPackage.channel.replace(/_/g, " ")}.`,
          { relatedObject: draft.title }
        )
      );
    },
    [drafts, publicationPackages, persistState, logActivity, organizationId, workUnits, activeWorkUnitId, updateWorkUnits]
  );

  const handlePauseWorkUnit = useCallback(
    (workUnitId: string) => {
      const unit = workUnits.find((u) => u.id === workUnitId);
      if (!unit) return;
      const next = workUnits.map((u) =>
        u.id === workUnitId ? (u.paused ? resumeWorkUnit(u) : pauseWorkUnit(u)) : u
      );
      updateWorkUnits(next);
      logActivity(
        createActivity(
          "plan_completed",
          unit.paused ? "Task resumed" : "Task paused",
          unit.paused
            ? "Emma resumed this task."
            : "Emma paused this task at your request."
        )
      );
    },
    [workUnits, updateWorkUnits, logActivity]
  );

  const handleCancelWorkUnit = useCallback(
    (workUnitId: string) => {
      const next = workUnits.map((u) => (u.id === workUnitId ? cancelWorkUnit(u) : u));
      updateWorkUnits(next);
      if (activeWorkUnitId === workUnitId) {
        setActiveWorkUnitId(null);
        setActiveDelegation(null);
      }
      logActivity(
        createActivity("plan_completed", "Task cancelled", "This task was cancelled.")
      );
    },
    [workUnits, updateWorkUnits, logActivity, activeWorkUnitId]
  );

  const handleDismissInsight = useCallback(
    (insightId: string) => {
      const next = dismissInsight(insightRotation, insightId);
      setInsightRotation(next);
      persistState({ insightRotation: next });
    },
    [insightRotation, persistState]
  );

  const patchApprovalOverlay = useCallback(
    (
      draftId: string,
      patch: Partial<Omit<ApprovalDeliverableOverlay, "draftId" | "updatedAt">>
    ) => {
      const nextOverlay = mergeApprovalOverlay(approvalOverlays[draftId], draftId, patch);
      const next = { ...approvalOverlays, [draftId]: nextOverlay };
      setApprovalOverlays(next);
      persistState({ approvalOverlays: next });
      return nextOverlay;
    },
    [approvalOverlays, persistState]
  );

  const noteWorkUnitForDraft = useCallback(
    (draftId: string, note: string) => {
      const unit = workUnits.find((u) => u.draftId === draftId);
      if (!unit) return;
      updateWorkUnits(
        workUnits.map((u) => (u.id === unit.id ? recordWorkUnitNote(u, note) : u))
      );
    },
    [workUnits, updateWorkUnits]
  );

  const handleSaveApprovalContent = useCallback(
    (draftId: string, content: ApprovalDeliverableContent) => {
      const nextDrafts = drafts.map((item) =>
        item.id === draftId
          ? {
              ...item,
              title: content.headline ?? item.title,
              body: content.caption ?? content.body ?? item.body,
              callToAction: content.callToAction ?? item.callToAction,
              keywords: content.hashtags?.map((h) => h.replace(/^#/, "")) ?? item.keywords,
            }
          : item
      );
      const nextOverlay = mergeApprovalOverlay(approvalOverlays[draftId], draftId, { content });
      const nextOverlays = { ...approvalOverlays, [draftId]: nextOverlay };
      setDrafts(nextDrafts);
      setApprovalOverlays(nextOverlays);
      persistState({ drafts: nextDrafts, approvalOverlays: nextOverlays });
      noteWorkUnitForDraft(draftId, "Caption edited by user");
    },
    [drafts, approvalOverlays, persistState, noteWorkUnitForDraft]
  );

  const handleSaveApprovalMedia = useCallback(
    (draftId: string, media: ApprovalMediaAsset[]) => {
      patchApprovalOverlay(draftId, { media });
      noteWorkUnitForDraft(draftId, "Media updated by user");
    },
    [patchApprovalOverlay, noteWorkUnitForDraft]
  );

  const handleApprovalFeedback = useCallback(
    (draftId: string, message: string) => {
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;

      const entry = { message, createdAt: new Date().toISOString() };
      const existing = approvalOverlays[draftId]?.feedback ?? [];
      patchApprovalOverlay(draftId, { feedback: [...existing, entry] });

      const nextDrafts = drafts.map((item) =>
        item.id === draftId ? { ...item, status: "ready_for_review" as const } : item
      );
      setDrafts(nextDrafts);
      persistState({ drafts: nextDrafts });
      updateWorkUnits(
        syncWorkUnitsWithMarketingState({
          workUnits,
          activeWorkUnitId,
          generating,
          generatingActivity,
          drafts: nextDrafts,
        })
      );
      noteWorkUnitForDraft(draftId, `Feedback from user: ${message.slice(0, 120)}`);
      logActivity(
        createActivity(
          "draft_rejected",
          "Feedback sent to Emma",
          message.slice(0, 140),
          { relatedObject: draft.title }
        )
      );
    },
    [
      drafts,
      approvalOverlays,
      patchApprovalOverlay,
      persistState,
      workUnits,
      activeWorkUnitId,
      generating,
      generatingActivity,
      updateWorkUnits,
      noteWorkUnitForDraft,
      logActivity,
    ]
  );

  const handleApproveAndSchedule = useCallback(
    (draftId: string, scheduledAt: string, timezone: string) => {
      const connections = loadIntegrationConnections(organizationId);
      const draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;
      if (!isChannelConnectedForPublishing(connections, draft.channel ?? draft.contentType)) {
        setApprovalPublishMessage("Connect the channel before scheduling.");
        return;
      }
      if (!scheduledAt) {
        setApprovalPublishMessage("Choose a valid schedule date.");
        return;
      }

      patchApprovalOverlay(draftId, {
        publishing: { mode: "scheduled", scheduledAt, timezone },
      });
      handleDraftStatus(draftId, "approved");
      noteWorkUnitForDraft(draftId, `Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      setApprovalPublishMessage(null);
      window.setTimeout(() => handlePreparePublication(draftId), 0);
    },
    [
      drafts,
      organizationId,
      patchApprovalOverlay,
      handleDraftStatus,
      noteWorkUnitForDraft,
      handlePreparePublication,
    ]
  );

  const handlePublishNowApproval = useCallback(
    (draftId: string) => {
      const connections = loadIntegrationConnections(organizationId);
      let draft = drafts.find((d) => d.id === draftId);
      if (!draft) return;
      if (!isChannelConnectedForPublishing(connections, draft.channel ?? draft.contentType)) {
        setApprovalPublishMessage("Connect the channel before publishing.");
        return;
      }

      let nextDrafts = [...drafts];
      let nextPackages = [...publicationPackages];

      if (draft.status !== "approved" && draft.status !== "ready_to_publish") {
        nextDrafts = nextDrafts.map((item) =>
          item.id === draftId ? { ...item, status: "approved" as const } : item
        );
        draft = nextDrafts.find((d) => d.id === draftId)!;
      }

      if (draft.status === "approved") {
        try {
          const prepared = prepareDraftForPublication(draft);
          nextDrafts = nextDrafts.map((item) =>
            item.id === draftId ? { ...item, status: "ready_to_publish" as const } : item
          );
          nextPackages = [
            ...nextPackages.filter((pkg) => pkg.draftId !== draftId),
            prepared,
          ];
          draft = nextDrafts.find((d) => d.id === draftId)!;
        } catch (error) {
          setApprovalPublishMessage(
            error instanceof Error ? error.message : "Could not prepare publication."
          );
          return;
        }
      }

      const pkg = findPublicationPackageForDraft(nextPackages, draftId);
      if (draft.status !== "ready_to_publish" || !pkg) {
        setApprovalPublishMessage("Publication could not be completed.");
        return;
      }

      const publishedPackage = markPublicationPackagePublished(pkg);
      nextDrafts = nextDrafts.map((item) =>
        item.id === draftId ? { ...item, status: "published" as const } : item
      );
      nextPackages = nextPackages.map((item) =>
        item.draftId === draftId ? publishedPackage : item
      );

      setDrafts(nextDrafts);
      setPublicationPackages(nextPackages);
      persistState({ drafts: nextDrafts, publicationPackages: nextPackages });
      updateWorkUnits(
        syncWorkUnitsWithMarketingState({
          workUnits,
          activeWorkUnitId,
          generating: null,
          generatingActivity: null,
          drafts: nextDrafts,
        })
      );
      noteWorkUnitForDraft(draftId, "Published by user");
      setApprovalPublishMessage("Publication confirmed.");
      logActivity(
        createActivity(
          "published",
          "Marked as published",
          `"${draft.title}" was confirmed published.`,
          { relatedObject: draft.title }
        )
      );
    },
    [
      drafts,
      publicationPackages,
      organizationId,
      persistState,
      workUnits,
      activeWorkUnitId,
      updateWorkUnits,
      noteWorkUnitForDraft,
      logActivity,
    ]
  );

  const openTaskDrawer = useCallback(
    (
      workUnitId: string,
      tab: import("@/lib/peer-experience/marketing/build-task-drawer-model").TaskDrawerTab = "overview"
    ) => {
      setSelectedWorkUnitId(workUnitId);
      setTaskDrawerTab(tab);
      setTaskDrawerOpen(true);
    },
    []
  );

  const handleWorkTaskAction = useCallback(
    (
      workUnitId: string,
      action: import("@/lib/peer-experience/marketing/emma-workspace-types").EmmaWorkTaskAction
    ) => {
      switch (action.kind) {
        case "pause":
          handlePauseWorkUnit(workUnitId);
          break;
        case "cancel":
          handleCancelWorkUnit(workUnitId);
          break;
        case "open_draft":
        case "open_images":
        case "open_captions":
          if (action.refId) {
            setSelectedWorkUnitId(workUnitId);
            setSelectedDraftId(action.refId);
            openTaskDrawer(workUnitId, "files");
            document.getElementById("needs-approval")?.scrollIntoView({ behavior: "smooth" });
          }
          break;
        case "view_activity":
          openTaskDrawer(workUnitId, "timeline");
          break;
      }
    },
    [handlePauseWorkUnit, handleCancelWorkUnit, openTaskDrawer]
  );

  const handleConversationSend = useCallback(
    (message: string) => {
      if (!peer) return;
      const userMsg = createConversationMessage("user", message);
      const { peerReply, nextStep } = respondToConversation(message, {
        peerName: peer.name,
        understanding,
        strategy,
        plan,
        drafts,
      });
      const nextConversation = [...conversation, userMsg, peerReply];
      setConversation(nextConversation);
      setPendingNextStep(nextStep ?? null);
      persistState({ conversation: nextConversation });
    },
    [peer, understanding, strategy, plan, drafts, conversation, persistState]
  );

  const executeRecommendedAction = useCallback(
    (action: RecommendedAction, scrollToDrafts?: () => void) => {
      switch (action.kind) {
        case "generate-strategy":
          void handleGenerateStrategy();
          break;
        case "generate-plan":
          void handleGeneratePlan();
          break;
        case "create-draft":
          if (action.planActivityReference) {
            void handleGenerateDraft(action.planActivityReference);
          }
          break;
        case "review-draft":
          if (action.draftId) {
            setSelectedDraftId(action.draftId);
            scrollToDrafts?.();
            break;
          }
          if (action.planActivityReference) {
            const draft = drafts.find(
              (item) =>
                item.planActivityReference.trim().toLowerCase() ===
                action.planActivityReference!.trim().toLowerCase()
            );
            if (draft) {
              setSelectedDraftId(draft.id);
              scrollToDrafts?.();
            }
          }
          break;
        case "prepare-publication":
          if (action.draftId) {
            handlePreparePublication(action.draftId);
            setSelectedDraftId(action.draftId);
            scrollToDrafts?.();
          }
          break;
        case "mark-published":
          if (action.draftId) {
            handleMarkPublished(action.draftId);
            setSelectedDraftId(action.draftId);
            scrollToDrafts?.();
          }
          break;
        case "fill-gaps":
          window.location.href = knowledgeSectionHref(
            action.knowledgeSection ?? "company-dna"
          );
          break;
      }
    },
    [
      drafts,
      handleGenerateDraft,
      handleGeneratePlan,
      handleGenerateStrategy,
      handleMarkPublished,
      handlePreparePublication,
    ]
  );

  const handlePrimaryAction = useCallback(
    (action: PrimaryAction, scrollToDrafts?: () => void) => {
      executeRecommendedAction(
        {
          id: `primary-${action.kind}`,
          title: action.label,
          description: "",
          priority: "high",
          kind: action.kind,
          planActivityReference: action.planActivityReference,
          draftId: action.draftId,
          knowledgeSection: action.knowledgeSection,
        },
        scrollToDrafts
      );
    },
    [executeRecommendedAction]
  );

  const handleDeleteAutomation = useCallback(
    (automationId: string) => {
      const next = automations.filter((a) => a.id !== automationId);
      setAutomations(next);
      persistState({ automations: next });
    },
    [automations, persistState]
  );

  const handleToggleAutomation = useCallback(
    (automationId: string) => {
      const next = automations.map((a) =>
        a.id === automationId ? { ...a, active: !a.active } : a
      );
      setAutomations(next);
      persistState({ automations: next });
    },
    [automations, persistState]
  );

  const handleApproveResponsibilityPlan = useCallback(
    async (responsibilityId: string) => {
      if (!peerId) return;

      const responsibility = responsibilities.find((r) => r.id === responsibilityId);
      if (!responsibility) return;

      const evaluation = evaluateResponsibility({
        responsibility,
        projects,
        plan,
        connections: [],
        peerName: peer?.name ?? "Emma",
      });

      if (evaluation.action !== "create_project" || !evaluation.proposedProject) {
        setApiWarnings([evaluation.planningMessage ?? evaluation.reason]);
        return;
      }

      const proposed = evaluation.proposedProject;
      const deliverableKind = deliverableKindFromChannel(proposed.channel);

      const project = createMarketingProject({
        peerId,
        title: proposed.title,
        goal: proposed.goal,
        channel: proposed.channel,
        deliverableKind: proposed.deliverableKind,
        rawRequest: proposed.rawRequest,
        ownerLabel: "Emma",
        responsibilityId: responsibility.id,
        origin: "responsibility",
      });

      let unit = createWorkUnit({
        peerId,
        projectId: project.id,
        role: "Marketing",
        title: proposed.title,
        deliverableKind,
        channel: proposed.channel,
        objective: proposed.goal,
        audience: null,
        needsVisual: responsibility.category === "instagram",
        recurrence: "once",
        rawRequest: proposed.rawRequest,
      });
      unit = transitionWorkUnit(
        unit,
        "planning",
        "planning_started",
        "Planning from responsibility evaluation"
      );

      updateProjects([project, ...projects]);
      updateWorkUnits([unit, ...workUnits]);
      updateResponsibilities(
        responsibilities.map((r) =>
          r.id === responsibilityId ? touchResponsibilityEvaluation(r) : r
        )
      );

      logActivity(
        createActivity(
          "plan_completed",
          `Project planned: ${project.title}`,
          evaluation.planningMessage ?? evaluation.reason,
          { relatedObject: project.title }
        )
      );
    },
    [
      peerId,
      responsibilities,
      projects,
      plan,
      peer,
      workUnits,
      updateProjects,
      updateWorkUnits,
      updateResponsibilities,
      logActivity,
    ]
  );

  const recordWorkspaceActivity = useCallback(
    (title: string, description: string) => {
      logActivity(createActivity("focus_updated", title, description));
    },
    [logActivity]
  );

  /** Empty campaign from Create Campaign wizard — no work units, drafts, or AI. */
  const handleCreateCampaign = useCallback(
    async (input: CreateMarketingCampaignProjectInput): Promise<{ projectId: string }> => {
      if (!peerId) {
        throw new Error("Workspace unavailable.");
      }
      const project = createMarketingCampaignProject(input);
      updateProjects([project, ...projects]);
      logActivity(
        createActivity(
          "focus_updated",
          `Campaign created: ${project.title}`,
          project.goal,
          { relatedObject: project.title }
        )
      );
      return { projectId: project.id };
    },
    [peerId, projects, updateProjects, logActivity]
  );

  const handleStartCampaignExecution = useCallback(
    async (projectId: string): Promise<CampaignExecutionWorkspaceResult> => {
      const executedAt = new Date().toISOString();
      if (!peerId) {
        return campaignExecutionWorkspaceResultFromError(
          new Error("Workspace unavailable."),
          executedAt,
          projectId
        );
      }

      const domainInput: MarketingPeerDomainInput = {
        peerId,
        organizationId,
        userName: "You",
        peerName: peer?.name ?? "Marketing",
        campaignTitle: resolveCampaignTitle(plan, strategy),
        generating,
        generatingActivity,
        understanding,
        strategy,
        plan,
        drafts,
        publicationPackages,
        activityFeed,
        workUnits: syncedWorkUnits,
        projects: projectsRef.current,
        responsibilities,
        automations,
        connections: loadIntegrationConnections(organizationId),
        storedMetrics,
        approvalOverlays,
        insightRotation,
        selectedWorkUnitId,
        activeWorkUnitId,
        selectedDraftId,
      };

      try {
        const result = await executeMarketingCampaign({
          projectId,
          domainInput,
          requestedBy: organizationId,
          executedAt,
          campaignWorkspaceEnabled: isMarketingCampaignWorkspaceEnabled(),
          getWorkspaceSnapshot: () => ({
            projects: projectsRef.current,
            workUnits: workUnitsRef.current,
          }),
          commitWorkspaceState: (next) => {
            const nextProjects = [...next.projects];
            const nextWorkUnits = [...next.workUnits];
            setProjects(nextProjects);
            setWorkUnits(nextWorkUnits);
            persistState({ projects: nextProjects, workUnits: nextWorkUnits });
          },
        });

        if (shouldAppendCampaignExecutionActivity(result.status)) {
          const project = projectsRef.current.find((p) => p.id === projectId);
          logActivity(
            createActivity(
              "plan_completed",
              CAMPAIGN_EXECUTION_ACTIVITY_TITLE,
              project?.goal ?? "Campaign execution work units were created.",
              { relatedObject: project?.title ?? projectId }
            )
          );
        }

        return result;
      } catch (error) {
        if (error instanceof CampaignExecutionWorkspaceFeatureDisabledError) {
          return {
            status: "restricted",
            campaignId: projectId,
            plannerStatus: "draft",
            executionStatus: "restricted",
            createdWorkUnitIds: [],
            updatedWorkUnitIds: [],
            campaignUpdated: false,
            warnings: [],
            nextAction: {
              label: "Campaign workspace disabled",
              reason: error.message,
            },
            executedAt,
          };
        }
        return campaignExecutionWorkspaceResultFromError(error, executedAt, projectId);
      }
    },
    [
      peerId,
      organizationId,
      peer,
      plan,
      strategy,
      generating,
      generatingActivity,
      understanding,
      drafts,
      publicationPackages,
      activityFeed,
      syncedWorkUnits,
      responsibilities,
      automations,
      storedMetrics,
      approvalOverlays,
      insightRotation,
      selectedWorkUnitId,
      activeWorkUnitId,
      selectedDraftId,
      persistState,
      logActivity,
    ]
  );

  const handleCompleteCampaignOnboarding = useCallback(
    async (
      projectId: string,
      input: CampaignOnboardingInput
    ): Promise<CampaignOnboardingResult> => {
      if (!peerId) {
        return {
          ok: false,
          projectId,
          code: "WORKSPACE_UNAVAILABLE",
          message: "Workspace unavailable.",
        };
      }

      const existing = projectsRef.current.find((p) => p.id === projectId);
      if (!existing) {
        return {
          ok: false,
          projectId,
          code: "PROJECT_NOT_FOUND",
          message: "Project not found.",
        };
      }
      if (existing.origin !== "campaign_wizard") {
        return {
          ok: false,
          projectId,
          code: "NOT_CAMPAIGN_WIZARD",
          message: "This project is not a campaign-wizard project.",
        };
      }
      if (existing.campaignSetup?.onboardingCompletedAt) {
        return {
          ok: false,
          projectId,
          code: "ALREADY_COMPLETED",
          message: "Campaign setup is already complete.",
        };
      }

      const completedAt = new Date().toISOString();
      try {
        const updated = applyCampaignOnboardingToProject(existing, input, completedAt);
        const nextProjects = projectsRef.current.map((p) =>
          p.id === projectId ? updated : p
        );
        updateProjects(nextProjects);
        logActivity(
          createActivity(
            "focus_updated",
            "Campaign setup saved",
            `${updated.title} — audience and deliverables captured for planning.`,
            { relatedObject: updated.title }
          )
        );
        return { ok: true, projectId, completedAt };
      } catch (error) {
        const message =
          error instanceof CampaignOnboardingValidationError
            ? error.message
            : "Invalid campaign setup.";
        return {
          ok: false,
          projectId,
          code: "INVALID_INPUT",
          message,
        };
      }
    },
    [peerId, updateProjects, logActivity]
  );

  const handleExecuteMarketingWorkUnit = useCallback(
    async (
      workUnitId: string,
      options?: {
        fromCampaignContinuation?: boolean;
        forceRegenerate?: boolean;
        reviewFeedbackTaskHint?: string;
      }
    ): Promise<MarketingWorkUnitExecutionResult> => {
      const assembledAt = new Date().toISOString();

      if (!peerId) {
        return {
          ok: false,
          code: "WorkspaceUnavailable",
          message: "Workspace unavailable.",
          workUnitId,
        };
      }

      if (
        !options?.fromCampaignContinuation &&
        campaignContinuationInFlightRef.current
      ) {
        return {
          ok: false,
          code: "ExecutionInProgress",
          message: "Marketing Peer is continuing your campaign...",
          workUnitId,
        };
      }

      if (workUnitExecutionInFlightRef.current) {
        return {
          ok: false,
          code: "ExecutionInProgress",
          message: "Another work unit is already executing.",
          workUnitId,
        };
      }

      workUnitExecutionInFlightRef.current = workUnitId;
      setActiveWorkUnitId(workUnitId);
      setApiWarnings([]);

      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id ?? organizationId;

        const domainInput: MarketingPeerDomainInput = {
          peerId,
          organizationId,
          userName: "You",
          peerName: peer?.name ?? "Marketing",
          campaignTitle: resolveCampaignTitle(plan, strategyRef.current),
          generating,
          generatingActivity,
          understanding,
          strategy: strategyRef.current,
          creativeBriefByCampaignId: creativeBriefByCampaignIdRef.current,
          linkedinPostByWorkUnitId: linkedinPostByWorkUnitIdRef.current,
          emailByWorkUnitId: emailByWorkUnitIdRef.current,
          plan,
          drafts,
          publicationPackages,
          activityFeed,
          workUnits: syncedWorkUnits,
          projects: projectsRef.current,
          responsibilities,
          automations,
          connections: loadIntegrationConnections(organizationId),
          storedMetrics,
          approvalOverlays,
          campaignReviewDecisionByWorkUnitId: campaignReviewDecisionByWorkUnitIdRef.current,
          campaignReviewDecisionHistoryByWorkUnitId:
            campaignReviewDecisionHistoryByWorkUnitIdRef.current,
          campaignArtifactVersionByWorkUnitId: campaignArtifactVersionByWorkUnitIdRef.current,
          insightRotation,
          selectedWorkUnitId,
          activeWorkUnitId: workUnitId,
          selectedDraftId,
        };

        const result = await executeMarketingWorkUnitInWorkspace({
          workUnitId,
          organizationId,
          userId,
          domainInput,
          assembledAt,
          campaignWorkspaceEnabled: isMarketingCampaignWorkspaceEnabled(),
          supabase,
          executionOptions: {
            forceRegenerate: options?.forceRegenerate,
            reviewFeedbackTaskHint: options?.reviewFeedbackTaskHint,
          },
          getWorkspaceSnapshot: () => ({
            workUnits: workUnitsRef.current,
            strategy: strategyRef.current,
            creativeBriefByCampaignId: creativeBriefByCampaignIdRef.current,
            linkedinPostByWorkUnitId: linkedinPostByWorkUnitIdRef.current,
          emailByWorkUnitId: emailByWorkUnitIdRef.current,
          }),
          commitWorkspaceState: (next) => {
            const nextUnits = [...next.workUnits];
            const nextBriefs = { ...next.creativeBriefByCampaignId };
            const nextPosts = { ...next.linkedinPostByWorkUnitId };
            const nextEmails = { ...next.emailByWorkUnitId };

            workUnitsRef.current = nextUnits;
            strategyRef.current = next.strategy;
            creativeBriefByCampaignIdRef.current = nextBriefs;
            linkedinPostByWorkUnitIdRef.current = nextPosts;
            emailByWorkUnitIdRef.current = nextEmails;

            setWorkUnits(nextUnits);
            setStrategy(next.strategy);
            setCreativeBriefByCampaignId(nextBriefs);
            setLinkedinPostByWorkUnitId(nextPosts);
            setEmailByWorkUnitId(nextEmails);
            persistState({
              workUnits: nextUnits,
              strategy: next.strategy ?? undefined,
              creativeBriefByCampaignId: nextBriefs,
              linkedinPostByWorkUnitId: nextPosts,
              emailByWorkUnitId: nextEmails,
            });
          },
        });

        if (result.ok) {
          const nextUnits = workUnitsRef.current.map((unit) =>
            unit.id === result.workUnit.id ? result.workUnit : unit
          );
          updateWorkUnits(nextUnits);

          if (result.kind === "campaign_strategy") {
            setStrategy(result.strategy);
            persistState({
              strategy: result.strategy,
              workUnits: nextUnits,
            });
            if (!result.idempotent) {
              const project = projectsRef.current.find(
                (p) => p.id === result.workUnit.projectId
              );
              logActivity(
                createActivity(
                  "strategy_completed",
                  "Campaign strategy executed",
                  result.output.summary.slice(0, 140),
                  { relatedObject: project?.title ?? result.workUnit.title }
                )
              );
            }
          } else if (result.kind === "creative_direction") {
            const briefProjectId = result.workUnit.projectId;
            if (briefProjectId) {
              const nextBriefs = {
                ...creativeBriefByCampaignIdRef.current,
                [briefProjectId]: result.brief,
              };
              setCreativeBriefByCampaignId(nextBriefs);
              persistState({
                creativeBriefByCampaignId: nextBriefs,
                workUnits: nextUnits,
              });
            }
            if (!result.idempotent) {
              const project = projectsRef.current.find((p) => p.id === result.workUnit.projectId);
              logActivity(
                createActivity(
                  "strategy_completed",
                  "Creative direction executed",
                  result.output.campaignConcept.slice(0, 140),
                  { relatedObject: project?.title ?? result.workUnit.title }
                )
              );
            }
          } else if (result.kind === "linkedin_post" && !result.idempotent) {
            const nextPosts = {
              ...linkedinPostByWorkUnitIdRef.current,
              [result.workUnitId]: result.post,
            };
            setLinkedinPostByWorkUnitId(nextPosts);
            persistState({
              linkedinPostByWorkUnitId: nextPosts,
              workUnits: nextUnits,
            });
            const project = projectsRef.current.find((p) => p.id === result.workUnit.projectId);
            logActivity(
              createActivity(
                "draft_generated",
                "LinkedIn post executed",
                result.output.hook.slice(0, 140),
                { relatedObject: project?.title ?? result.workUnit.title }
              )
            );
          } else if (result.kind === "email_campaign" && !result.idempotent) {
            const nextEmails = {
              ...emailByWorkUnitIdRef.current,
              [result.workUnitId]: result.email,
            };
            setEmailByWorkUnitId(nextEmails);
            persistState({
              emailByWorkUnitId: nextEmails,
              workUnits: nextUnits,
            });
            const project = projectsRef.current.find((p) => p.id === result.workUnit.projectId);
            logActivity(
              createActivity(
                "draft_generated",
                "Email prepared.",
                result.output.subject.slice(0, 140),
                { relatedObject: project?.title ?? result.workUnit.title }
              )
            );
          }

          if (result.warnings.length > 0) {
            setApiWarnings([...result.warnings]);
          }
        } else if (
          !result.ok &&
          "workUnit" in result &&
          result.workUnit
        ) {
          const failedUnit = result.workUnit;
          updateWorkUnits(
            workUnitsRef.current.map((unit) =>
              unit.id === failedUnit.id ? failedUnit : unit
            )
          );
          setApiWarnings([result.message]);
        } else if (!result.ok) {
          setApiWarnings([result.message]);
        }

        return result;
      } catch (error) {
        logMarketingWorkUnitExecutionFailure({
          failureStage: "update_work_unit",
          code: "WorkspaceUnavailable",
          workUnitId,
          internalMessage:
            error instanceof Error ? error.message : "Unhandled work unit execution error.",
          error,
        });
        const stuck = workUnitsRef.current.find((u) => u.id === workUnitId);
        if (stuck?.status === "creating") {
          const reverted = revertWorkUnitFromFailedExecution(
            stuck,
            error instanceof Error ? error.message : "Execution failed."
          );
          const nextUnits = workUnitsRef.current.map((unit) =>
            unit.id === reverted.id ? reverted : unit
          );
          updateWorkUnits(nextUnits);
          persistState({ workUnits: nextUnits });
        }
        return marketingWorkUnitExecutionResultFromError(error, workUnitId);
      } finally {
        workUnitExecutionInFlightRef.current = null;
        setActiveWorkUnitId(null);
      }
    },
    [
      peerId,
      organizationId,
      peer,
      plan,
      generating,
      generatingActivity,
      understanding,
      drafts,
      publicationPackages,
      activityFeed,
      syncedWorkUnits,
      responsibilities,
      automations,
      storedMetrics,
      approvalOverlays,
      insightRotation,
      selectedWorkUnitId,
      selectedDraftId,
      persistState,
      updateWorkUnits,
      logActivity,
    ]
  );

  const commitCampaignReviewState = useCallback(
    (patch: {
      campaignReviewDecisionByWorkUnitId?: Record<string, CampaignReviewDecision>;
      campaignReviewDecisionHistoryByWorkUnitId?: Record<
        string,
        readonly CampaignReviewDecision[]
      >;
      campaignArtifactVersionByWorkUnitId?: Record<string, number>;
      workUnits?: WorkUnit[];
      activityFeed?: ActivityFeedItem[];
    }) => {
      if (patch.campaignReviewDecisionByWorkUnitId !== undefined) {
        campaignReviewDecisionByWorkUnitIdRef.current = patch.campaignReviewDecisionByWorkUnitId;
        setCampaignReviewDecisionByWorkUnitId(patch.campaignReviewDecisionByWorkUnitId);
      }
      if (patch.campaignReviewDecisionHistoryByWorkUnitId !== undefined) {
        campaignReviewDecisionHistoryByWorkUnitIdRef.current =
          patch.campaignReviewDecisionHistoryByWorkUnitId;
        setCampaignReviewDecisionHistoryByWorkUnitId(
          patch.campaignReviewDecisionHistoryByWorkUnitId
        );
      }
      if (patch.campaignArtifactVersionByWorkUnitId !== undefined) {
        campaignArtifactVersionByWorkUnitIdRef.current = patch.campaignArtifactVersionByWorkUnitId;
        setCampaignArtifactVersionByWorkUnitId(patch.campaignArtifactVersionByWorkUnitId);
      }
      if (patch.workUnits !== undefined) {
        workUnitsRef.current = patch.workUnits;
        setWorkUnits(patch.workUnits);
      }
      if (patch.activityFeed !== undefined) {
        setActivityFeed(patch.activityFeed);
      }
      persistState({
        ...(patch.campaignReviewDecisionByWorkUnitId !== undefined
          ? { campaignReviewDecisionByWorkUnitId: patch.campaignReviewDecisionByWorkUnitId }
          : {}),
        ...(patch.campaignReviewDecisionHistoryByWorkUnitId !== undefined
          ? {
              campaignReviewDecisionHistoryByWorkUnitId:
                patch.campaignReviewDecisionHistoryByWorkUnitId,
            }
          : {}),
        ...(patch.campaignArtifactVersionByWorkUnitId !== undefined
          ? { campaignArtifactVersionByWorkUnitId: patch.campaignArtifactVersionByWorkUnitId }
          : {}),
        ...(patch.workUnits !== undefined ? { workUnits: patch.workUnits } : {}),
        ...(patch.activityFeed !== undefined ? { activityFeed: patch.activityFeed } : {}),
      });
    },
    [persistState]
  );

  const buildReviewHandlerDeps = useCallback(
    () => ({
      getSnapshot: () => ({
        peerId: peerId ?? "",
        organizationId,
        userId: organizationId,
        projects: projectsRef.current,
        workUnits: workUnitsRef.current,
        domainInput: {
          peerId: peerId ?? "",
          organizationId,
          userName: "You",
          peerName: peer?.name ?? "Marketing",
          campaignTitle: resolveCampaignTitle(plan, strategyRef.current),
          generating,
          generatingActivity,
          understanding,
          strategy: strategyRef.current,
          creativeBriefByCampaignId: creativeBriefByCampaignIdRef.current,
          linkedinPostByWorkUnitId: linkedinPostByWorkUnitIdRef.current,
          emailByWorkUnitId: emailByWorkUnitIdRef.current,
          plan,
          drafts,
          publicationPackages,
          activityFeed,
          workUnits: workUnitsRef.current,
          projects: projectsRef.current,
          responsibilities,
          automations,
          connections: loadIntegrationConnections(organizationId),
          storedMetrics,
          approvalOverlays,
          campaignReviewDecisionByWorkUnitId: campaignReviewDecisionByWorkUnitIdRef.current,
          campaignReviewDecisionHistoryByWorkUnitId:
            campaignReviewDecisionHistoryByWorkUnitIdRef.current,
          campaignArtifactVersionByWorkUnitId: campaignArtifactVersionByWorkUnitIdRef.current,
          insightRotation,
          selectedWorkUnitId,
          activeWorkUnitId,
          selectedDraftId,
        } satisfies MarketingPeerDomainInput,
      }),
      commit: commitCampaignReviewState,
      logActivity: (item: ActivityFeedItem) => {
        setActivityFeed((prev) => {
          const next = prependActivity(prev, item);
          persistState({ activityFeed: next });
          return next;
        });
      },
      createActivity,
      executeWorkUnit: handleExecuteMarketingWorkUnit,
      continueCampaign: (projectId: string) =>
        handleContinueCampaignRef.current?.(projectId) ?? Promise.resolve({
          ok: false,
          projectId,
          completedWorkUnits: [],
          stopReason: "execution_failed",
          stopMessage: "Campaign continuation is unavailable.",
          iterations: 0,
        }),
      reviewActionInFlight: campaignReviewActionInFlightRef,
    }),
    [
      peerId,
      organizationId,
      peer,
      plan,
      generating,
      generatingActivity,
      understanding,
      drafts,
      publicationPackages,
      activityFeed,
      responsibilities,
      automations,
      storedMetrics,
      approvalOverlays,
      insightRotation,
      selectedWorkUnitId,
      activeWorkUnitId,
      selectedDraftId,
      commitCampaignReviewState,
      persistState,
      handleExecuteMarketingWorkUnit,
    ]
  );

  const handleContinueCampaign = useCallback(
    async (projectId: string): Promise<CampaignContinuationResult> => {
      if (campaignContinuationInFlightRef.current) {
        return {
          ok: false,
          projectId,
          completedWorkUnits: [],
          stopReason: "execution_failed",
          stopMessage: "Campaign continuation is already in progress.",
          iterations: 0,
        };
      }

      if (workUnitExecutionInFlightRef.current) {
        return {
          ok: false,
          projectId,
          completedWorkUnits: [],
          stopReason: "execution_failed",
          stopMessage: "Another work unit is already executing.",
          iterations: 0,
        };
      }

      campaignContinuationInFlightRef.current = true;
      setCampaignContinuationRunning(true);

      try {
        return await runCampaignContinuation(projectId, {
          getOrchestratorInput: (campaignProjectId) => ({
            projectId: campaignProjectId,
            workUnits: workUnitsRef.current,
            strategy: strategyRef.current,
            creativeBriefByCampaignId: creativeBriefByCampaignIdRef.current,
          }),
          executeWorkUnit: (workUnitId) =>
            handleExecuteMarketingWorkUnit(workUnitId, {
              fromCampaignContinuation: true,
            }),
          getApprovalMode: (campaignProjectId) =>
            projectsRef.current.find((p) => p.id === campaignProjectId)
              ?.campaignSetup?.approvalMode,
          hasPendingRequiredReview: (campaignProjectId) =>
            hasPendingRequiredCampaignReview(buildReviewHandlerDeps().getSnapshot(), campaignProjectId),
        });
      } finally {
        campaignContinuationInFlightRef.current = false;
        setCampaignContinuationRunning(false);
      }
    },
    [handleExecuteMarketingWorkUnit, buildReviewHandlerDeps]
  );

  handleContinueCampaignRef.current = handleContinueCampaign;

  const handleApproveCampaignReviewItem = useCallback(
    async (input: {
      projectId: string;
      workUnitId: string;
      autoContinue?: boolean;
    }): Promise<CampaignReviewDecisionResult> => {
      return approveCampaignReviewItem(buildReviewHandlerDeps(), input);
    },
    [buildReviewHandlerDeps]
  );

  const handleRequestCampaignReviewChanges = useCallback(
    (input: {
      projectId: string;
      workUnitId: string;
      feedback: CampaignReviewFeedback;
    }): CampaignReviewDecisionResult => {
      return requestCampaignReviewChanges(buildReviewHandlerDeps(), input);
    },
    [buildReviewHandlerDeps]
  );

  const handleRejectCampaignReviewItem = useCallback(
    (input: {
      projectId: string;
      workUnitId: string;
      rejectionReason: CampaignReviewRejectionReason;
      message?: string;
    }): CampaignReviewDecisionResult => {
      return rejectCampaignReviewItem(buildReviewHandlerDeps(), input);
    },
    [buildReviewHandlerDeps]
  );

  const handleReviseCampaignReviewItem = useCallback(
    async (input: { projectId: string; workUnitId: string }) => {
      return reviseCampaignReviewItem(buildReviewHandlerDeps(), input);
    },
    [buildReviewHandlerDeps]
  );

  const updateCampaignWebsiteDecision = useCallback(
    (projectId: string, decision: LiveWebsiteDecision): MarketingProject | null => {
      if (!peerId) return null;
      const updated =
        decision.kind === "url"
          ? persistLiveCampaignWebsiteUrl(peerId, projectId, decision.url)
          : persistLiveCampaignWebsiteSkip(peerId, projectId);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const updateCampaignCompetitorDecision = useCallback(
    (projectId: string, decision: LiveCompetitorDecision): MarketingProject | null => {
      if (!peerId) return null;
      const updated =
        decision.kind === "list"
          ? persistLiveCampaignCompetitors(peerId, projectId, decision.competitors)
          : persistLiveCampaignCompetitorSkip(peerId, projectId);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const updateCampaignBrandContext = useCallback(
    (projectId: string, context: LiveCampaignBrandContext): MarketingProject | null => {
      if (!peerId) return null;
      const updated = persistLiveCampaignBrandContext(peerId, projectId, context);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const updateCampaignBusinessAnalysisDecision = useCallback(
    (projectId: string, decision: LiveBusinessAnalysisDecision): MarketingProject | null => {
      if (!peerId || decision.kind !== "approved") return null;
      const updated = persistLiveCampaignBusinessAnalysisApproval(peerId, projectId);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const updateCampaignStepApproval = useCallback(
    (
      projectId: string,
      stepId: CampaignWorkflowStepId,
      status: DemoStepApprovalStatus
    ): MarketingProject | null => {
      if (!peerId) return null;
      const updated = persistLiveCampaignStepApproval(peerId, projectId, stepId, status);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const markCampaignStrategyGenerated = useCallback(
    (projectId: string): MarketingProject | null => {
      if (!peerId) return null;
      const updated = persistLiveCampaignStrategyOutput(peerId, projectId);
      if (!updated) return null;
      const next = projectsRef.current.map((p) => (p.id === projectId ? updated : p));
      updateProjects(next);
      return updated;
    },
    [peerId, updateProjects]
  );

  const applyLiveCampaignProjectUpdate = useCallback(
    (updated: MarketingProject): MarketingProject => {
      const next = projectsRef.current.map((p) => (p.id === updated.id ? updated : p));
      updateProjects(next);
      return updated;
    },
    [updateProjects]
  );

  return {
    peer,
    pageState,
    isWorkspaceReady: pageState === "success",
    errorMessage,
    understanding,
    profileCounts,
    strategy,
    creativeBriefByCampaignId,
    linkedinPostByWorkUnitId,
    emailByWorkUnitId,
    plan,
    drafts,
    publicationPackages,
    apiWarnings,
    generating,
    generatingActivity,
    selectedDraftId,
    setSelectedDraftId,
    selectedDraft,
    activityFeed,
    conversation,
    pendingNextStep,
    setPendingNextStep,
    viewModel,
    selectTimelineNode,
    loadWorkspace,
    handleGenerateStrategy,
    handleGeneratePlan,
    handleGenerateDraft,
    handleDraftStatus,
    handlePreparePublication,
    handleMarkPublished,
    handleConversationSend,
    handlePrimaryAction,
    executeRecommendedAction,
    handleExecuteDelegation,
    handleCreateCampaign,
    handleCompleteCampaignOnboarding,
    handleStartCampaignExecution,
    handleExecuteMarketingWorkUnit,
    handleContinueCampaign,
    campaignContinuationRunning,
    campaignReviewDecisionByWorkUnitId,
    campaignReviewDecisionHistoryByWorkUnitId,
    campaignArtifactVersionByWorkUnitId,
    handleApproveCampaignReviewItem,
    handleRequestCampaignReviewChanges,
    handleRejectCampaignReviewItem,
    handleReviseCampaignReviewItem,
    activeDelegation,
    syncedWorkUnits,
    projects,
    responsibilities,
    activeWorkUnitId,
    automations,
    insightRotation,
    storedMetrics,
    handleWorkTaskAction,
    handleDismissInsight,
    approvalOverlays,
    handleSaveApprovalContent,
    handleSaveApprovalMedia,
    handleApprovalFeedback,
    handleApproveAndSchedule,
    handlePublishNowApproval,
    approvalPublishMessage,
    selectedWorkUnitId,
    setSelectedWorkUnitId,
    taskDrawerOpen,
    setTaskDrawerOpen,
    taskDrawerTab,
    setTaskDrawerTab,
    openTaskDrawer,
    handleToggleAutomation,
    handleDeleteAutomation,
    handleApproveResponsibilityPlan,
    updateResponsibilities,
    recordWorkspaceActivity,
    updateCampaignWebsiteDecision,
    updateCampaignCompetitorDecision,
    updateCampaignBrandContext,
    updateCampaignBusinessAnalysisDecision,
    updateCampaignStepApproval,
    markCampaignStrategyGenerated,
    applyLiveCampaignProjectUpdate,
  };
}
