"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NewPeerModal from "@/components/NewPeerModal";
import AnalysisProgress from "@/components/website-intelligence/AnalysisProgress";
import AssessmentReport from "@/components/website-intelligence/AssessmentReport";
import { mapEmployeeTypeToPeerRole } from "@/lib/website-intelligence/map-recommendation-to-peer";
import {
  websiteAnalyzer,
  type WebsiteIntelligenceAssessment,
  type WorkforceRecommendation,
} from "@/lib/website-intelligence";
import { ArrowLeft, Globe2, ScanSearch } from "lucide-react";

type PagePhase = "input" | "analyzing" | "report";

type PeerModalInitialValues = {
  initialName: string;
  initialRole: string;
  initialWebsite: string;
  initialGoal: string;
};

export default function WebsiteIntelligencePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<PagePhase>("input");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<WebsiteIntelligenceAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerModalInitialValues, setPeerModalInitialValues] =
    useState<PeerModalInitialValues | null>(null);

  async function handleAnalyze() {
    setErrorMessage("");
    setAssessment(null);
    setCompletedStepIds([]);
    setActiveStepIndex(0);
    setPhase("analyzing");

    try {
      const result = await websiteAnalyzer.analyze(
        { url: websiteUrl },
        (stepId, stepIndex) => {
          setCompletedStepIds((current) =>
            current.includes(stepId) ? current : [...current, stepId]
          );
          setActiveStepIndex(stepIndex + 1);
        }
      );

      setAssessment(result);
      setActiveStepIndex(websiteAnalyzer.steps.length);
      setPhase("report");
    } catch (error) {
      setPhase("input");
      setActiveStepIndex(-1);
      setCompletedStepIds([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong during analysis."
      );
    }
  }

  function handleAnalyzeAnother() {
    setPhase("input");
    setAssessment(null);
    setCompletedStepIds([]);
    setActiveStepIndex(-1);
    setErrorMessage("");
  }

  function handleOpenCreatePeer(employee: WorkforceRecommendation) {
    if (!assessment) {
      return;
    }

    setPeerModalInitialValues({
      initialName: employee.name,
      initialRole: mapEmployeeTypeToPeerRole(employee.employeeType),
      initialWebsite: assessment.meta.url,
      initialGoal: employee.suggestedObjective,
    });
    setPeerModalOpen(true);
  }

  function handleClosePeerModal() {
    setPeerModalOpen(false);
    setPeerModalInitialValues(null);
  }

  function handlePeerCreated(peerId: string) {
    router.push(`/peers/${peerId}`);
  }

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <Sidebar />

        <section className="min-w-0 flex-1 p-5 md:p-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <header className="mt-6 max-w-5xl">
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Website Intelligence
            </h1>
          </header>

          {phase === "input" && (
            <section className="mt-8 max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60">
                  <Globe2 size={18} className="shrink-0 text-violet-400" />

                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleAnalyze();
                      }
                    }}
                    placeholder="https://company.com"
                    className="h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!websiteUrl.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ScanSearch size={18} />
                  Begin
                </button>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}
            </section>
          )}

          {phase === "analyzing" && (
            <div className="mt-8">
              <AnalysisProgress
                steps={websiteAnalyzer.steps}
                activeStepIndex={activeStepIndex}
                completedStepIds={completedStepIds}
                websiteUrl={websiteUrl}
              />
            </div>
          )}

          {phase === "report" && assessment && (
            <div className="mt-8">
              <AssessmentReport
                assessment={assessment}
                onAnalyzeAnother={handleAnalyzeAnother}
                onOpenCreatePeer={handleOpenCreatePeer}
              />
            </div>
          )}
        </section>
      </div>

      <NewPeerModal
        open={peerModalOpen}
        onClose={handleClosePeerModal}
        onCreated={handlePeerCreated}
        fromWebsiteIntelligence
        initialName={peerModalInitialValues?.initialName}
        initialRole={peerModalInitialValues?.initialRole}
        initialWebsite={peerModalInitialValues?.initialWebsite}
        initialGoal={peerModalInitialValues?.initialGoal}
      />
    </main>
  );
}
