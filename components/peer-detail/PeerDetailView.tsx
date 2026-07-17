"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import Sidebar from "@/components/Sidebar";
import ApprovalQueue from "@/components/peer-detail/ApprovalQueue";
import AutonomyControl from "@/components/peer-detail/AutonomyControl";
import AvailabilityControl from "@/components/peer-detail/AvailabilityControl";
import CurrentWorkCard from "@/components/peer-detail/CurrentWorkCard";
import DecisionLog from "@/components/peer-detail/DecisionLog";
import EditPeerModal from "@/components/peer-detail/EditPeerModal";
import PeerDetailSkeleton from "@/components/peer-detail/PeerDetailSkeleton";
import PeerExperienceSection from "@/components/peer-detail/PeerExperienceSection";
import PeerExpertiseSection from "@/components/peer-detail/PeerExpertiseSection";
import PeerLearningSection from "@/components/peer-detail/PeerLearningSection";
import PeerPersonalitySection from "@/components/peer-detail/PeerPersonalitySection";
import PeerReputationSection from "@/components/peer-detail/PeerReputationSection";
import PeerWorkspaceHeader from "@/components/peer-detail/PeerWorkspaceHeader";
import {
  buildDefaultWorkspacePreferences,
  buildPeerWorkspaceViewModel,
  saveWorkspacePreferences,
  type AutonomyLevel,
  type AvailabilityMode,
  type PeerWorkspaceViewModel,
  type WorkspacePreferences,
} from "@/lib/peer-detail";
import { useReducedMotion } from "@/lib/hire-team/use-reduced-motion";
import type { PeerRow } from "@/lib/peer-display";
import { fetchOrganizationPeerById } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, RefreshCw } from "lucide-react";

type PageState = "loading" | "success" | "error" | "not-found";

export default function PeerDetailView() {
  const params = useParams<{ id: string }>();
  const peerId = params.id;
  const reducedMotion = useReducedMotion();
  const { organizationId } = useAccount();

  const [peer, setPeer] = useState<PeerRow | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<WorkspacePreferences | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [dismissedApprovals, setDismissedApprovals] = useState<string[]>([]);

  const fetchPeer = useCallback(async () => {
    if (!peerId) {
      setPageState("not-found");
      return;
    }

    setErrorMessage("");

    try {
      const supabase = createClient();
      const row = await fetchOrganizationPeerById(
        supabase,
        peerId,
        organizationId
      );

      if (!row) {
        setPeer(null);
        setPageState("not-found");
        return;
      }

      setPeer(row);

    const defaults = buildDefaultWorkspacePreferences(row);
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(`peergent-peer-workspace:${peerId}`);
        if (raw) {
          const stored = JSON.parse(raw) as Partial<WorkspacePreferences>;
          setPreferences({ ...defaults, ...stored });
        } else {
          setPreferences(defaults);
        }
      } catch {
        setPreferences(defaults);
      }
    } else {
      setPreferences(defaults);
    }

    setPageState("success");
  } catch (error) {
    console.error("Supabase fetch error:", error);
    setErrorMessage(
      error instanceof Error ? error.message : "Failed to load workspace."
    );
    setPageState("error");
  }
  }, [peerId, organizationId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPeer() {
      setPageState("loading");
      await fetchPeer();
      if (cancelled) {
        return;
      }
    }

    void loadPeer();

    return () => {
      cancelled = true;
    };
  }, [fetchPeer]);

  const workspace: PeerWorkspaceViewModel | null = useMemo(() => {
    if (!peer || !preferences) {
      return null;
    }

    const model = buildPeerWorkspaceViewModel(peer, preferences);
    return {
      ...model,
      approvals: model.approvals.filter(
        (item) => !dismissedApprovals.includes(item.id)
      ),
    };
  }, [peer, preferences, dismissedApprovals]);

  const persistPreferences = useCallback(
    (next: WorkspacePreferences) => {
      setPreferences(next);
      if (peerId) {
        saveWorkspacePreferences(peerId, next);
      }
    },
    [peerId]
  );

  const handleAvailabilityChange = (value: AvailabilityMode) => {
    if (!preferences) return;

    persistPreferences({
      ...preferences,
      availability: value,
      evenings: value === "24-7" ? true : preferences.evenings,
      weekends: value === "24-7" ? true : preferences.weekends,
    });
  };

  const handleAutonomyChange = (value: AutonomyLevel) => {
    if (!preferences) return;
    persistPreferences({ ...preferences, autonomy: value });
  };

  const handlePauseToggle = () => {
    if (!preferences) return;
    persistPreferences({ ...preferences, paused: !preferences.paused });
  };

  const announce = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleApprove = (id: string) => {
    setDismissedApprovals((current) => [...current, id]);
    announce("Approval recorded.");
  };

  const handleReview = (id: string) => {
    announce("Marked for review.");
    void id;
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[10%] top-[8%] h-[360px] w-[360px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 lg:p-10">
          <div aria-live="polite" className="sr-only">
            {statusMessage}
          </div>

          {pageState === "loading" && <PeerDetailSkeleton />}

          {pageState === "error" && (
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-red-200">
                Could not load workspace
              </h1>
              <p className="mt-3 text-sm text-red-300/90">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setPageState("loading");
                  void fetchPeer();
                }}
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
              >
                <RefreshCw size={16} aria-hidden />
                Try again
              </button>
            </div>
          )}

          {pageState === "not-found" && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1120]/90 p-8 text-center">
              <h1 className="text-2xl font-semibold">Colleague not found</h1>
              <p className="mt-3 text-sm text-slate-400">
                This workspace does not exist or may have been removed.
              </p>
              <Link
                href="/peers"
                className="pg-focus-premium mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
              >
                <ArrowLeft size={16} aria-hidden />
                Back to AI Team
              </Link>
            </div>
          )}

          {pageState === "success" && workspace && peer && preferences && (
            <div className="space-y-8">
              <PeerWorkspaceHeader
                model={workspace.header}
                peerRole={peer.role}
                paused={preferences.paused}
                onPauseToggle={handlePauseToggle}
                onMoreActions={() => setEditModalOpen(true)}
                reducedMotion={reducedMotion}
              />

              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div className="flex flex-col gap-8">
                  <CurrentWorkCard
                    model={workspace.currentWork}
                    reducedMotion={reducedMotion}
                  />

                  <div className="flex flex-col gap-8">
                    <div className="order-2 xl:order-1">
                      <DecisionLog entries={workspace.decisionLog} />
                    </div>
                    <div className="order-1 xl:order-2">
                      <ApprovalQueue
                        items={workspace.approvals}
                        onApprove={handleApprove}
                        onReview={handleReview}
                      />
                    </div>
                  </div>
                </div>

                <aside className="flex flex-col gap-7">
                  <PeerPersonalitySection
                    traits={workspace.profile.workingStyle}
                  />
                  <PeerExperienceSection items={workspace.profile.experience} />
                  <PeerExpertiseSection
                    areas={workspace.profile.expertise}
                    knowledgeHref={workspace.profile.knowledgeHref}
                    reducedMotion={reducedMotion}
                  />
                  <PeerLearningSection items={workspace.profile.learning} />
                  <PeerReputationSection signals={workspace.profile.reputation} />
                  <AvailabilityControl
                    options={workspace.availabilityOptions}
                    value={preferences.availability}
                    evenings={preferences.evenings}
                    weekends={preferences.weekends}
                    onChange={handleAvailabilityChange}
                    onEveningsChange={(evenings) =>
                      persistPreferences({ ...preferences, evenings })
                    }
                    onWeekendsChange={(weekends) =>
                      persistPreferences({ ...preferences, weekends })
                    }
                  />
                  <AutonomyControl
                    options={workspace.autonomyOptions}
                    value={preferences.autonomy}
                    onChange={handleAutonomyChange}
                  />
                </aside>
              </div>

              <EditPeerModal
                open={editModalOpen}
                peer={peer}
                onClose={() => setEditModalOpen(false)}
                onSuccess={fetchPeer}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
