"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "@/components/account/AccountProvider";
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
  fetchLatestWebsiteIntelligenceAssessment,
  saveWebsiteIntelligenceAssessment,
  websiteAnalyzer,
  type WebsiteIntelligenceAssessment,
} from "@/lib/website-intelligence";
import { createClient } from "@/lib/supabase/client";
import { Globe2, ScanSearch } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type PagePhase = "input" | "analyzing" | "report" | "hiring";

export type WebsiteIntelligenceExperienceProps = {
  variant?: "legacy" | "v17";
  backHref?: string;
  backLabel?: string;
  title?: string;
  enableHireJourney?: boolean;
};

export default function WebsiteIntelligenceExperience({
  variant = "legacy",
  backHref,
  backLabel = "Back",
  title = "Website Intelligence",
  enableHireJourney = true,
}: WebsiteIntelligenceExperienceProps) {
  const isV17 = variant === "v17";
  const { account, loading: accountLoading } = useAccount();
  const supabase = useMemo(() => createClient(), []);
  const [phase, setPhase] = useState<PagePhase>("input");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<WebsiteIntelligenceAssessment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [hireExiting, setHireExiting] = useState(false);
  const [journeySeed, setJourneySeed] = useState<HireJourneyPersistedState | null>(null);
  const [hireAnimateEntry, setHireAnimateEntry] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreState() {
      setRestoring(true);
      setErrorMessage("");

      const sessionAssessment = loadAssessmentForHire();
      const savedJourney =
        enableHireJourney && sessionAssessment
          ? loadHireJourneyForAssessment(sessionAssessment)
          : null;

      if (savedJourney && sessionAssessment && enableHireJourney) {
        if (!cancelled) {
          setAssessment(sessionAssessment);
          setWebsiteUrl(sessionAssessment.meta.url);
          setJourneySeed(savedJourney);
          setHireAnimateEntry(false);
          setPhase("hiring");
          setRestoring(false);
        }
        return;
      }

      const organizationId = account?.organization?.id;
      if (organizationId) {
        try {
          const latest = await fetchLatestWebsiteIntelligenceAssessment(
            supabase,
            organizationId
          );

          if (cancelled) return;

          if (latest) {
            setAssessment(latest.assessment);
            setWebsiteUrl(latest.assessment.meta.url);
            saveAssessmentForHire(latest.assessment);
            setPhase("report");
            setRestoring(false);
            return;
          }
        } catch (error) {
          if (!cancelled) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Failed to restore the latest Website Intelligence assessment."
            );
          }
        }
      }

      if (sessionAssessment) {
        if (!cancelled) {
          setAssessment(sessionAssessment);
          setWebsiteUrl(sessionAssessment.meta.url);
          setPhase("report");
        }
      }

      if (!cancelled) setRestoring(false);
    }

    if (accountLoading) return;

    void restoreState();

    return () => {
      cancelled = true;
    };
  }, [account?.organization?.id, accountLoading, enableHireJourney, supabase]);

  const hireModel = useMemo(
    () => (assessment && enableHireJourney ? buildHireTeamViewModel(assessment) : null),
    [assessment, enableHireJourney]
  );

  const assessmentKey = assessment ? assessmentStorageKey(assessment) : "";

  async function handleAnalyze() {
    setErrorMessage("");
    setSaveMessage("");
    setAssessment(null);
    setCompletedStepIds([]);
    setActiveStepIndex(0);
    setPhase("analyzing");
    setAnalyzing(true);

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
      setWebsiteUrl(result.meta.url);
      saveAssessmentForHire(result);
      setActiveStepIndex(websiteAnalyzer.steps.length);
      setPhase("report");

      const organizationId = account?.organization?.id;
      if (!organizationId) {
        setSaveMessage(
          "Analysis completed, but no active organization was found to save this assessment."
        );
        return;
      }

      try {
        await saveWebsiteIntelligenceAssessment(supabase, organizationId, result);
        setSaveMessage("Assessment saved to your organization Business Brain.");
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? `Analysis completed, but saving failed: ${error.message}`
            : "Analysis completed, but saving the assessment failed."
        );
      }
    } catch (error) {
      setPhase("input");
      setActiveStepIndex(-1);
      setCompletedStepIds([]);
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong during analysis."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function handleAnalyzeAnother() {
    setPhase("input");
    setAssessment(null);
    setCompletedStepIds([]);
    setActiveStepIndex(-1);
    setErrorMessage("");
    setSaveMessage("");
    setJourneySeed(null);
  }

  function handleStartHireTeam() {
    if (!assessment || !enableHireJourney) return;

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

  const messageClass = (failed: boolean) =>
    isV17
      ? cn("v17-review-feedback", failed ? "v17-review-feedback--error" : "v17-review-feedback--success")
      : cn(
          "rounded-xl px-4 py-3 text-sm",
          failed
            ? "border border-amber-500/20 bg-amber-500/10 text-amber-100"
            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
        );

  return (
    <div
      className={isV17 ? "v17-website-scan" : undefined}
      data-testid={isV17 ? "v17-website-intelligence" : "website-intelligence-legacy"}
    >
      {backHref && phase !== "report" && phase !== "hiring" ? (
        <Link href={backHref} className="v17-detail-back pg-focus-premium">
          {backLabel}
        </Link>
      ) : null}

      {restoring ? (
        <p className="v17-page-support">{isV17 ? "Bezig met laden…" : "Loading your latest Website Intelligence assessment…"}</p>
      ) : null}

      {!restoring && phase === "input" ? (
        <section className={isV17 ? "v17-detail-card" : "mt-8 max-w-2xl"}>
          <header className={isV17 ? undefined : "mt-6 max-w-2xl"}>
            <h1 className={isV17 ? "v17-detail-card-title" : "text-xl font-semibold tracking-tight text-white"}>
              {title}
            </h1>
          </header>

          <div className={cn(isV17 ? "v17-website-scan-form" : "mt-8 flex flex-col gap-3 sm:flex-row")}>
            <div
              className={
                isV17
                  ? "v17-website-scan-input-wrap"
                  : "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 focus-within:border-violet-500/60"
              }
            >
              <Globe2 size={18} className="shrink-0" aria-hidden />
              <input
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleAnalyze();
                }}
                placeholder="https://company.com"
                className={isV17 ? "v17-field-input v17-website-scan-input" : "h-12 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={!websiteUrl.trim() || analyzing}
              className={
                isV17
                  ? "v17-btn v17-btn--primary pg-focus-premium"
                  : "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              <ScanSearch size={18} aria-hidden />
              {analyzing ? (isV17 ? "Bezig…" : "Analyzing…") : isV17 ? "Scannen" : "Begin"}
            </button>
          </div>

          {errorMessage ? (
            <p className={messageClass(true)} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </section>
      ) : null}

      {phase === "analyzing" ? (
        <div className={isV17 ? "v17-website-scan-progress" : "mt-16 flex min-h-[50vh] items-center"}>
          <AnalysisProgress
            steps={websiteAnalyzer.steps}
            activeStepIndex={activeStepIndex}
            completedStepIds={completedStepIds}
            websiteUrl={websiteUrl}
          />
        </div>
      ) : null}

      {(phase === "report" || hireExiting) && assessment ? (
        <div className={cn(hireExiting && "pointer-events-none scale-[0.98] opacity-0 transition-all duration-500")}>
          {saveMessage ? <div className={messageClass(saveMessage.includes("failed"))}>{saveMessage}</div> : null}
          {errorMessage ? (
            <div className={messageClass(true)} role="alert">
              {errorMessage}
            </div>
          ) : null}

          <AssessmentCanvas
            assessment={assessment}
            onAnalyzeAnother={handleAnalyzeAnother}
            onStartHireTeam={enableHireJourney ? handleStartHireTeam : () => {}}
          />
        </div>
      ) : null}

      {phase === "hiring" && hireModel && enableHireJourney ? (
        <HireTeamJourney
          model={hireModel}
          assessmentKey={assessmentKey}
          initialState={journeySeed}
          animateEntry={hireAnimateEntry}
          onBackToBrain={handleBackFromHiring}
        />
      ) : null}
    </div>
  );
}
