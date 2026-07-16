"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NewPeerModal from "@/components/NewPeerModal";
import AnalysisProgress from "@/components/website-intelligence/AnalysisProgress";
import IntelligenceReport from "@/components/website-intelligence/IntelligenceReport";
import { mapEmployeeTypeToPeerRole } from "@/lib/website-intelligence/map-recommendation-to-peer";
import {
  websiteAnalyzer,
  type RecommendedEmployee,
  type WebsiteIntelligenceReport,
} from "@/lib/website-intelligence";
import { ArrowLeft, Globe2, ScanSearch, Sparkles } from "lucide-react";

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
  const [report, setReport] = useState<WebsiteIntelligenceReport | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerModalInitialValues, setPeerModalInitialValues] =
    useState<PeerModalInitialValues | null>(null);

  async function handleAnalyze() {
    setErrorMessage("");
    setReport(null);
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

      setReport(result);
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
    setReport(null);
    setCompletedStepIds([]);
    setActiveStepIndex(-1);
    setErrorMessage("");
  }

  function handleOpenCreatePeer(employee: RecommendedEmployee) {
    if (!report) {
      return;
    }

    setPeerModalInitialValues({
      initialName: employee.name,
      initialRole: mapEmployeeTypeToPeerRole(employee.employeeType),
      initialWebsite: report.url,
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
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#081028] to-[#140b2e] text-white">
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

          <header className="mt-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              <Sparkles size={14} />
              Flagship feature
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              Website Intelligence
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
              Analyze any company website and discover which AI employees your
              business should hire first. Peergent reads your digital presence
              and turns it into a workforce plan.
            </p>
          </header>

          {phase === "input" && (
            <section className="mt-8 overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-[#0b1120]/95 via-[#0d1430]/95 to-violet-950/30 p-6 shadow-2xl shadow-violet-950/20 md:p-8">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div>
                  <p className="text-sm font-medium text-violet-400">
                    Start your analysis
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    Enter a company website
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    We&apos;ll inspect the site structure, customer touchpoints,
                    and automation opportunities — then recommend the AI
                    employees that fit best.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ScanSearch size={18} />
                      Analyze
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {errorMessage}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    What you&apos;ll receive
                  </p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-300">
                    <li>Business and industry profile</li>
                    <li>Website-driven growth insights</li>
                    <li>Automation opportunity scoring</li>
                    <li>Recommended AI employee lineup</li>
                  </ul>
                </div>
              </div>
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

          {phase === "report" && report && (
            <div className="mt-8">
              <IntelligenceReport
                report={report}
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
