"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Lightbulb,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAccount } from "@/components/account/AccountProvider";
import Sidebar from "@/components/Sidebar";
import WorkspacePanel from "@/components/peer-detail/WorkspacePanel";
import PeerRoleIcon from "@/components/peer/PeerRoleIcon";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import MarketingWorkspaceSkeleton from "@/components/marketing-workspace/MarketingWorkspaceSkeleton";
import ActivityFeedPanel from "@/components/marketing-workspace/experience/ActivityFeedPanel";
import ConversationPanel from "@/components/marketing-workspace/experience/ConversationPanel";
import CurrentFocusHero from "@/components/marketing-workspace/experience/CurrentFocusHero";
import ExplainabilitySection from "@/components/marketing-workspace/experience/ExplainabilitySection";
import OnboardingGuide from "@/components/marketing-workspace/experience/OnboardingGuide";
import PlanDeliverable from "@/components/marketing-workspace/experience/PlanDeliverable";
import StrategyDeliverable from "@/components/marketing-workspace/experience/StrategyDeliverable";
import type {
  MarketingContentDraft,
  MarketingPlan,
  MarketingStrategy,
  MarketingUnderstanding,
} from "@/lib/marketing-intelligence";
import {
  buildRecommendedActions,
  buildDraftExplainability,
  buildUnderstandingExplainability,
  buildWorkNarrative,
  createActivity,
  createConversationMessage,
  deriveOnboardingSteps,
  fetchMarketingProfile,
  fetchMarketingUnderstanding,
  generateContentDraft,
  generateMarketingPlan,
  generateMarketingStrategy,
  isOnboardingActive,
  loadMarketingWorkspaceState,
  prependActivity,
  respondToConversation,
  saveMarketingWorkspaceState,
  type ActivityFeedItem,
  type ArtifactSection,
  type ConversationMessage,
  type ConversationNextStep,
  type RecommendedAction,
} from "@/lib/marketing-workspace";
import { getRoleConfig } from "@/lib/peer-display";
import { fetchOrganizationPeerById } from "@/lib/peers/queries";
import type { PeerRow } from "@/lib/peer-display";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/ui/cn";

type PageState = "loading" | "success" | "error" | "not-found" | "wrong-role";
type GeneratingAction =
  | "understanding"
  | "strategy"
  | "plan"
  | "draft"
  | null;

function confidenceBadgeVariant(
  confidence: string
): "success" | "warning" | "neutral" {
  if (confidence === "high") return "success";
  if (confidence === "moderate") return "warning";
  return "neutral";
}

function formatGapLabel(gap: string): string {
  return gap
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export default function MarketingWorkspaceView() {
  const params = useParams<{ id: string }>();
  const peerId = params.id;
  const { organizationId } = useAccount();

  const [peer, setPeer] = useState<PeerRow | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [understanding, setUnderstanding] = useState<MarketingUnderstanding | null>(
    null
  );
  const [profileCounts, setProfileCounts] = useState({ goals: 0, content: 0 });
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null);
  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [drafts, setDrafts] = useState<MarketingContentDraft[]>([]);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [generating, setGenerating] = useState<GeneratingAction>(null);
  const [generatingActivity, setGeneratingActivity] = useState<string | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [pendingNextStep, setPendingNextStep] = useState<ConversationNextStep | null>(null);
  const [highlightSection, setHighlightSection] = useState<ArtifactSection | null>(null);

  const sectionRefs: Record<ArtifactSection, React.RefObject<HTMLDivElement | null>> = {
    understanding: useRef<HTMLDivElement>(null),
    strategy: useRef<HTMLDivElement>(null),
    plan: useRef<HTMLDivElement>(null),
    calendar: useRef<HTMLDivElement>(null),
    drafts: useRef<HTMLDivElement>(null),
  };

  const roleConfig = peer ? getRoleConfig(peer.role) : getRoleConfig("Marketing");

  const persistState = useCallback(
    (next: {
      strategy?: MarketingStrategy | null;
      plan?: MarketingPlan | null;
      drafts?: MarketingContentDraft[];
      activityFeed?: ActivityFeedItem[];
      conversation?: ConversationMessage[];
    }) => {
      if (!peerId) return;
      saveMarketingWorkspaceState(peerId, {
        strategy: (next.strategy ?? strategy) ?? undefined,
        plan: (next.plan ?? plan) ?? undefined,
        drafts: next.drafts ?? drafts,
        activityFeed: next.activityFeed ?? activityFeed,
        conversation: next.conversation ?? conversation,
      });
    },
    [peerId, strategy, plan, drafts, activityFeed, conversation]
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
      setPlan(stored.plan ?? null);
      setDrafts(stored.drafts ?? []);
      setActivityFeed(stored.activityFeed ?? []);
      setConversation(stored.conversation ?? []);

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

      let nextFeed = stored.activityFeed ?? [];
      if (understandingResult.understanding?.available) {
        if (!nextFeed.some((a) => a.activityType === "understanding_loaded")) {
          nextFeed = prependActivity(
            nextFeed,
            createActivity(
              "understanding_loaded",
              "Loaded marketing understanding",
              `${understandingResult.understanding.completeness}% of marketing dimensions covered.`
            )
          );
        }
        for (const gap of understandingResult.understanding.gaps.slice(0, 2)) {
          const gapKey = `gap-${gap}`;
          if (!nextFeed.some((a) => a.id.startsWith(gapKey) || a.relatedObject === gap)) {
            nextFeed = prependActivity(
              nextFeed,
              createActivity(
                "gap_detected",
                "Detected missing information",
                formatGapLabel(gap),
                { relatedObject: gap }
              )
            );
          }
        }
      }
      setActivityFeed(nextFeed);
      if (nextFeed !== stored.activityFeed) {
        saveMarketingWorkspaceState(peerId, {
          strategy: stored.strategy,
          plan: stored.plan,
          drafts: stored.drafts ?? [],
          activityFeed: nextFeed,
          conversation: stored.conversation ?? [],
        });
      }

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
    void loadWorkspace();
  }, [loadWorkspace]);

  const recommendedActions = useMemo(
    () => buildRecommendedActions({ understanding, strategy, plan, drafts }),
    [understanding, strategy, plan, drafts]
  );

  const narrative = useMemo(
    () =>
      buildWorkNarrative({
        generating,
        generatingActivity,
        understanding,
        strategy,
        plan,
        drafts,
        recommendedActions,
        apiWarnings,
      }),
    [
      generating,
      generatingActivity,
      understanding,
      strategy,
      plan,
      drafts,
      recommendedActions,
      apiWarnings,
    ]
  );

  const onboardingSteps = useMemo(
    () => deriveOnboardingSteps({ understanding, strategy, plan, drafts }),
    [understanding, strategy, plan, drafts]
  );

  const showOnboarding = isOnboardingActive(onboardingSteps);

  const scrollToSection = useCallback((section: ArtifactSection) => {
    sectionRefs[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightSection(section);
    window.setTimeout(() => setHighlightSection(null), 2000);
  }, []);

  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) ?? drafts[0];

  const handleGenerateStrategy = async () => {
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
  };

  const handleGeneratePlan = async () => {
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
  };

  const handleGenerateDraft = async (planActivityReference: string) => {
    if (!peerId || !plan) return;
    setGenerating("draft");
    setGeneratingActivity(planActivityReference);
    setApiWarnings([]);
    try {
      const result = await generateContentDraft(peerId, plan, planActivityReference);
      const nextDrafts = [
        ...drafts.filter(
          (d) =>
            d.planActivityReference.trim().toLowerCase() !==
            planActivityReference.trim().toLowerCase()
        ),
        result.draft,
      ];
      setDrafts(nextDrafts);
      setSelectedDraftId(result.draft.id);
      setApiWarnings(result.warnings);
      persistState({ drafts: nextDrafts });
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
    }
  };

  const handleDraftStatus = (draftId: string, status: MarketingContentDraft["status"]) => {
    const draft = drafts.find((d) => d.id === draftId);
    const nextDrafts = drafts.map((d) => (d.id === draftId ? { ...d, status } : d));
    setDrafts(nextDrafts);
    persistState({ drafts: nextDrafts });
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
  };

  const handleConversationSend = (message: string) => {
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
  };

  const handleConversationNextStep = (step: ConversationNextStep) => {
    setPendingNextStep(null);
    scrollToSection(step.section);
  };

  const handleRecommendedAction = (action: RecommendedAction) => {
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
        if (action.planActivityReference) {
          const draft = drafts.find(
            (d) =>
              d.planActivityReference.trim().toLowerCase() ===
              action.planActivityReference!.trim().toLowerCase()
          );
          if (draft) {
            setSelectedDraftId(draft.id);
            scrollToSection("drafts");
          }
        }
        break;
      case "fill-gaps":
        window.location.href = "/knowledge";
        break;
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[8%] top-[6%] h-[400px] w-[400px] rounded-full bg-fuchsia-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 lg:p-10">
          {pageState === "loading" && <MarketingWorkspaceSkeleton />}

          {pageState === "error" && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-red-200">
                Could not load marketing workspace
              </h1>
              <p className="mt-3 text-sm text-red-300/90">{errorMessage}</p>
              <button
                type="button"
                onClick={() => void loadWorkspace()}
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium"
              >
                <RefreshCw size={16} aria-hidden />
                Try again
              </button>
            </div>
          )}

          {pageState === "not-found" && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1120]/90 p-8 text-center">
              <h1 className="text-2xl font-semibold">Colleague not found</h1>
              <Link href="/peers" className="pg-focus-premium mt-6 inline-flex items-center gap-2 text-violet-400">
                <ArrowLeft size={16} /> Back to AI Team
              </Link>
            </div>
          )}

          {pageState === "wrong-role" && peer && (
            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-amber-100">
                Marketing workspace only
              </h1>
              <p className="mt-3 text-sm text-amber-200/80">
                {peer.name} is a {peer.role} peer. Open their standard workspace instead.
              </p>
              <Link
                href={`/peers/${peer.id}`}
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium"
              >
                Open peer workspace
              </Link>
            </div>
          )}

          {pageState === "success" && peer && (
            <div className="space-y-6">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                  <Avatar
                    icon={<PeerRoleIcon role="Marketing" size={22} />}
                    gradient={roleConfig.gradient}
                    size="lg"
                    presence={generating ? "idle" : "live"}
                  />
                  <div>
                    <h1 className="text-lg font-semibold md:text-xl">{peer.name}</h1>
                    <p className="text-sm text-fuchsia-400/85">{roleConfig.roleLabel}</p>
                  </div>
                </div>
                <Link
                  href="/peers"
                  className="pg-focus-premium inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
                >
                  <ArrowLeft size={14} /> AI Team
                </Link>
              </header>

              <CurrentFocusHero
                narrative={narrative}
                peerName={peer.name}
                generating={generating !== null}
                generatingLabel={
                  generating === "strategy"
                    ? "Developing marketing strategy…"
                    : generating === "plan"
                      ? "Building execution plan…"
                      : generating === "draft"
                        ? `Drafting: ${generatingActivity ?? "content"}…`
                        : generating === "understanding"
                          ? "Loading marketing understanding…"
                          : undefined
                }
                onPrimaryAction={handleRecommendedAction}
                onProgressNavigate={scrollToSection}
              />

              {showOnboarding && <OnboardingGuide steps={onboardingSteps} peerName={peer.name} />}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
                <div className="space-y-6">
                  <div
                    ref={sectionRefs.understanding}
                    className={cn(
                      "scroll-mt-6 rounded-[20px] transition",
                      highlightSection === "understanding" && "ring-2 ring-violet-500/40"
                    )}
                  >
                    <WorkspacePanel
                      title="Marketing understanding"
                      description="Verified business context I use for every recommendation."
                    >
                      {!understanding?.available ? (
                        <p className="text-sm text-slate-500">No understanding data yet.</p>
                      ) : (
                        <div className="space-y-4">
                          <Progress
                            value={understanding.completeness}
                            label="Knowledge completeness"
                          />
                          {understanding.brand.positioningStatement && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Positioning
                              </p>
                              <p className="mt-1 text-sm text-slate-300">
                                {understanding.brand.positioningStatement}
                              </p>
                            </div>
                          )}
                          {understanding.brand.toneOfVoice.summary && (
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Tone of voice
                              </p>
                              <p className="mt-1 text-sm text-slate-300">
                                {understanding.brand.toneOfVoice.summary}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <Metric label="Products" value={understanding.products.length} />
                            <Metric
                              label="Segments"
                              value={understanding.customerSegments.length}
                            />
                            <Metric label="Goals" value={profileCounts.goals} />
                            <Metric label="Content sources" value={profileCounts.content} />
                          </div>
                          <ExplainabilitySection
                            view={buildUnderstandingExplainability(understanding)}
                            defaultOpen
                          />
                        </div>
                      )}
                    </WorkspacePanel>
                  </div>

                  <div
                    ref={sectionRefs.strategy}
                    className={cn(
                      "scroll-mt-6 rounded-[20px] transition",
                      highlightSection === "strategy" && "ring-2 ring-violet-500/40"
                    )}
                  >
                    <WorkspacePanel
                      title="Marketing strategy"
                      description="Strategic deliverable — generated only when you trigger it."
                    >
                      {!strategy ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-500">
                            No strategy on file yet. Use the action above when you&apos;re ready.
                          </p>
                          <ActionButton
                            onClick={() => void handleGenerateStrategy()}
                            disabled={generating !== null || !understanding?.available}
                            icon={<Sparkles size={16} />}
                            label="Generate strategy"
                            loading={generating === "strategy"}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <StrategyDeliverable strategy={strategy} />
                          <ActionButton
                            onClick={() => void handleGenerateStrategy()}
                            disabled={generating !== null}
                            icon={<RefreshCw size={14} />}
                            label="Regenerate strategy"
                            variant="secondary"
                            loading={generating === "strategy"}
                          />
                        </div>
                      )}
                    </WorkspacePanel>
                  </div>

                  <div
                    ref={sectionRefs.plan}
                    className={cn(
                      "scroll-mt-6 rounded-[20px] transition",
                      highlightSection === "plan" && "ring-2 ring-violet-500/40"
                    )}
                  >
                    <WorkspacePanel
                      title="Marketing plan"
                      description="Execution plan and priorities from the approved strategy."
                    >
                      {!plan ? (
                        <div className="space-y-4">
                          <p className="text-sm text-slate-500">
                            {strategy
                              ? "No plan on file yet. Trigger Create plan when you're ready."
                              : "Generate a strategy first."}
                          </p>
                          <ActionButton
                            onClick={() => void handleGeneratePlan()}
                            disabled={generating !== null || !strategy}
                            icon={<Calendar size={16} />}
                            label="Create plan"
                            loading={generating === "plan"}
                          />
                        </div>
                      ) : (
                        <PlanDeliverable plan={plan} />
                      )}
                    </WorkspacePanel>
                  </div>

                  <div
                    ref={sectionRefs.calendar}
                    className={cn(
                      "scroll-mt-6 rounded-[20px] transition",
                      highlightSection === "calendar" && "ring-2 ring-violet-500/40"
                    )}
                  >
                    <WorkspacePanel
                      title="Content calendar"
                      description="Planned slots — drafts are created only when you trigger them."
                    >
                      {!plan?.contentCalendar.length ? (
                        <p className="text-sm text-slate-500">
                          Calendar appears after you create a marketing plan.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {plan.contentCalendar.map((entry) => {
                            const draft = drafts.find(
                              (d) =>
                                d.planActivityReference.trim().toLowerCase() ===
                                entry.title.trim().toLowerCase()
                            );
                            const isGeneratingThis =
                              generating === "draft" &&
                              generatingActivity?.trim().toLowerCase() ===
                                entry.title.trim().toLowerCase();

                            return (
                              <li
                                key={entry.title}
                                className={cn(
                                  "rounded-[16px] border p-4",
                                  draft
                                    ? "border-violet-500/20 bg-violet-500/[0.04]"
                                    : "border-white/[0.05] bg-white/[0.02]"
                                )}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <h3 className="text-sm font-medium text-white">
                                      {entry.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                      Week {entry.scheduledWeek}
                                      {entry.channel ? ` · ${entry.channel}` : ""} ·{" "}
                                      {entry.contentType.replace(/_/g, " ")}
                                    </p>
                                  </div>
                                  {draft ? (
                                    <Badge variant="success" size="sm">
                                      Draft on file
                                    </Badge>
                                  ) : (
                                    <Badge variant="neutral" size="sm">
                                      Not drafted
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-2 text-xs text-slate-600">{entry.rationale.why}</p>
                                {!draft && (
                                  <button
                                    type="button"
                                    onClick={() => void handleGenerateDraft(entry.title)}
                                    disabled={generating !== null}
                                    className="pg-focus-premium mt-3 inline-flex items-center gap-2 rounded-[12px] bg-violet-600 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                                  >
                                    {isGeneratingThis ? (
                                      <>Creating draft…</>
                                    ) : (
                                      <>
                                        <FileText size={12} /> Create draft
                                      </>
                                    )}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </WorkspacePanel>
                  </div>

                  <div
                    ref={sectionRefs.drafts}
                    className={cn(
                      "scroll-mt-6 rounded-[20px] transition",
                      highlightSection === "drafts" && "ring-2 ring-violet-500/40"
                    )}
                  >
                    <WorkspacePanel
                      title="Drafts"
                      description="Review and approve — nothing is published automatically."
                    >
                      {drafts.length === 0 ? (
                        <p className="rounded-[18px] border border-white/[0.05] bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-500">
                          No drafts on file. Create one from the content calendar.
                        </p>
                      ) : (
                        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                          <ul className="space-y-2">
                            {drafts.map((draft) => (
                              <li key={draft.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedDraftId(draft.id)}
                                  className={cn(
                                    "pg-focus-premium w-full rounded-[14px] border px-3 py-2.5 text-left text-sm transition",
                                    selectedDraft?.id === draft.id
                                      ? "border-violet-500/30 bg-violet-500/10 text-white"
                                      : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white"
                                  )}
                                >
                                  <span className="font-medium">{draft.title}</span>
                                  <span className="mt-0.5 block text-xs capitalize text-slate-600">
                                    {draft.contentType.replace(/_/g, " ")} ·{" "}
                                    {draft.status.replace(/_/g, " ")}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>

                          {selectedDraft && (
                            <article className="rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={confidenceBadgeVariant(selectedDraft.confidence)}
                                  size="sm"
                                >
                                  {selectedDraft.confidence}
                                </Badge>
                                <Badge variant="neutral" size="sm">
                                  {selectedDraft.status.replace(/_/g, " ")}
                                </Badge>
                              </div>

                              <h3 className="mt-4 text-lg font-semibold text-white">
                                {selectedDraft.title}
                              </h3>

                              {selectedDraft.targetAudience && (
                                <p className="mt-2 text-sm text-slate-500">
                                  Audience: {selectedDraft.targetAudience}
                                </p>
                              )}

                              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                                {selectedDraft.body}
                              </div>

                              {selectedDraft.callToAction && (
                                <p className="mt-4 text-sm font-medium text-violet-300/90">
                                  CTA: {selectedDraft.callToAction}
                                </p>
                              )}

                              <p className="mt-4 text-xs text-slate-600">
                                <Lightbulb size={12} className="mr-1 inline" />
                                {selectedDraft.rationale.why}
                              </p>

                              <ExplainabilitySection
                                view={buildDraftExplainability(selectedDraft)}
                                defaultOpen
                              />

                              {selectedDraft.warnings.length > 0 && (
                                <ul className="mt-3 space-y-1">
                                  {selectedDraft.warnings.map((w) => (
                                    <li key={w} className="text-xs text-amber-400/90">
                                      {w}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {(selectedDraft.status === "draft" ||
                                selectedDraft.status === "ready_for_review") && (
                                <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDraftStatus(selectedDraft.id, "approved")
                                    }
                                    className="pg-focus-premium rounded-[14px] bg-violet-600 px-4 py-2 text-xs font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDraftStatus(selectedDraft.id, "rejected")
                                    }
                                    className="pg-focus-premium rounded-[14px] border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300"
                                  >
                                    Needs changes
                                  </button>
                                </div>
                              )}
                            </article>
                          )}
                        </div>
                      )}
                    </WorkspacePanel>
                  </div>
                </div>

                <aside className="space-y-4">
                  <ActivityFeedPanel items={activityFeed} onNavigate={scrollToSection} />
                  <ConversationPanel
                    messages={conversation}
                    peerName={peer.name}
                    pendingNextStep={pendingNextStep}
                    onSend={handleConversationSend}
                    onNextStep={handleConversationNextStep}
                    onAction={handleRecommendedAction}
                    disabled={generating !== null}
                  />
                </aside>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  loading,
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "pg-focus-premium inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-medium disabled:opacity-50",
        variant === "primary"
          ? "bg-violet-600 text-white hover:bg-violet-500"
          : "border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white"
      )}
    >
      {icon}
      {loading ? "Working…" : label}
    </button>
  );
}
