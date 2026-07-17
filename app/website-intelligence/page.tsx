"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AnalysisProgress from "@/components/website-intelligence/AnalysisProgress";
import AssessmentCanvas from "@/components/website-intelligence/AssessmentCanvas";
import HireTeamJourney from "@/components/hire-team/HireTeamJourney";
import { buildHireTeamViewModel } from "@/lib/hire-team/hire-team-presenter";
import {
  assessmentStorageKey,
  createHireOperationId,
  loadAssessmentForHire,
  loadHireJourneyForAssessment,
  saveAssessmentForHire,
  saveHireJourney,
} from "@/lib/hire-team/hire-team-storage";
import type { HireJourneyPersistedState } from "@/lib/hire-team/types";
import {
  websiteAnalyzer,
  type WebsiteIntelligenceAssessment,
} from "@/lib/website-intelligence";
import { ArrowLeft, Globe2, ScanSearch } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type PagePhase = "input" | "analyzing" | "report" | "hiring";

export default function WebsiteIntelligencePage() {
  const [phase, setPhase] = useState<PagePhase>("input");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<WebsiteIntelligenceAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hireExiting, setHireExiting] = useState(false);
  const [journeySeed, setJourneySeed] = useState<HireJourneyPersistedState | null>(null);
  const [hireAnimateEntry, setHireAnimateEntry] = useState(false);

  useEffect(() => {
    const savedAssessment = loadAssessmentForHire();
    if (!savedAssessment) return;

    const savedJourney = loadHireJourneyForAssessment(savedAssessment);
    if (savedJourney) {
      setAssessment(savedAssessment);
      setJourneySeed(savedJourney);
      setHireAnimateEntry(false);
      setPhase("hiring");
    }
  }, []);

  const hireModel = useMemo(
    () => (assessment ? buildHireTeamViewModel(assessment) : null),
    [assessment]
  );

  const assessmentKey = assessment ? assessmentStorageKey(assessment) : "";

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
      saveAssessmentForHire(result);
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
    setJourneySeed(null);
  }

  function handleStartHireTeam() {
    if (!assessment) return;

    saveAssessmentForHire(assessment);
    const operationId = createHireOperationId();
    const key = assessmentStorageKey(assessment);
    const initial = {
      hireOperationId: operationId,
      assessmentKey: key,
      beat: "welcome" as const,
      questionIndex: 0,
      answers: {
        crm: "",
        leadRecipient: "",
        handover: "",
        language: "",
      },
      hireComplete: false,
      startedAt: Date.now(),
    };
    saveHireJourney(initial);
    setJourneySeed(initial);
    setHireAnimateEntry(true);

    setHireExiting(true);
    window.setTimeout(() => {
      setPhase("hiring");
      setHireExiting(false);
    }, 480);
  }

  function handleBackFromHiring() {
    setPhase("report");
  }

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[20%] top-[8%] h-[480px] w-[480px] rounded-full bg-violet-600/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
        <div className={cn(phase === "hiring" && "opacity-60")}>
          <Sidebar />
        </div>

        <section className="relative min-w-0 flex-1 overflow-x-hidden p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-8 md:pb-[max(2rem,env(safe-area-inset-bottom))] lg:p-10">
          {phase !== "report" && phase !== "hiring" && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          )}

          {phase === "input" && (
            <>
              <header className="mt-6 max-w-2xl">
                <h1 className="text-xl font-semibold tracking-tight text-white">
                  Website Intelligence
                </h1>
              </header>

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
            </>
          )}

          {phase === "analyzing" && (
            <div className="mt-16 flex min-h-[50vh] items-center">
              <AnalysisProgress
                steps={websiteAnalyzer.steps}
                activeStepIndex={activeStepIndex}
                completedStepIds={completedStepIds}
                websiteUrl={websiteUrl}
              />
            </div>
          )}

          {(phase === "report" || hireExiting) && assessment && (
            <div
              className={cn(
                "transition-all duration-500 ease-out",
                hireExiting && "pointer-events-none scale-[0.98] opacity-0"
              )}
            >
              <AssessmentCanvas
                assessment={assessment}
                onAnalyzeAnother={handleAnalyzeAnother}
                onStartHireTeam={handleStartHireTeam}
              />
            </div>
          )}

          {phase === "hiring" && hireModel && (
            <HireTeamJourney
              model={hireModel}
              assessmentKey={assessmentKey}
              initialState={journeySeed}
              animateEntry={hireAnimateEntry}
              onBackToBrain={handleBackFromHiring}
            />
          )}
        </section>
      </div>
    </main>
  );
}
