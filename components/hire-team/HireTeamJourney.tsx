"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/components/account/AccountProvider";
import HireWelcome from "@/components/hire-team/HireWelcome";
import HireTeamIntro from "@/components/hire-team/HireTeamIntro";
import HirePreparing from "@/components/hire-team/HirePreparing";
import HirePersonalisation from "@/components/hire-team/HirePersonalisation";
import HireCreating from "@/components/hire-team/HireCreating";
import HireReady from "@/components/hire-team/HireReady";
import { createHireTeam } from "@/lib/hire-team/create-hire-team";
import {
  DEFAULT_PERSONALISATION,
  type HirePersonalisationAnswers,
  type HireTeamViewModel,
} from "@/lib/hire-team/hire-team-presenter";
import {
  clearHireJourney,
  createHireOperationId,
  saveHireJourney,
} from "@/lib/hire-team/hire-team-storage";
import type { HireBeat, HireJourneyPersistedState } from "@/lib/hire-team/types";
import { useReducedMotion } from "@/lib/hire-team/use-reduced-motion";
import { cn } from "@/lib/ui/cn";

type HireTeamJourneyProps = {
  model: HireTeamViewModel;
  assessmentKey: string;
  initialState?: HireJourneyPersistedState | null;
  animateEntry?: boolean;
  onBackToBrain: () => void;
};

function BeatShell({
  children,
  visible,
  wide,
}: {
  children: ReactNode;
  visible: boolean;
  wide?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col items-center px-2 transition-all ease-out",
        wide ? "max-w-3xl" : "max-w-xl",
        reducedMotion ? "duration-150" : "duration-[420ms]",
        visible
          ? "translate-y-0 opacity-100"
          : reducedMotion
            ? "opacity-0"
            : "translate-y-2 opacity-0"
      )}
    >
      {children}
    </div>
  );
}

export default function HireTeamJourney({
  model,
  assessmentKey,
  initialState,
  animateEntry = false,
  onBackToBrain,
}: HireTeamJourneyProps) {
  const router = useRouter();
  const { organizationId } = useAccount();
  const reducedMotion = useReducedMotion();
  const hireOperationIdRef = useRef(
    initialState?.hireOperationId ?? createHireOperationId()
  );

  const [beat, setBeat] = useState<HireBeat>(initialState?.beat ?? "welcome");
  const [visible, setVisible] = useState(true);
  const [answers, setAnswers] = useState<HirePersonalisationAnswers>(
    initialState?.answers ?? DEFAULT_PERSONALISATION
  );
  const [questionIndex, setQuestionIndex] = useState(initialState?.questionIndex ?? 0);
  const [peerIds, setPeerIds] = useState({
    sales: initialState?.salesPeerId,
    marketing: initialState?.marketingPeerId,
  });
  const [createFailed, setCreateFailed] = useState(false);
  const [teamHovered, setTeamHovered] = useState(false);
  const creatingRef = useRef(false);
  const resumedCreateRef = useRef(false);
  const beatFocusRef = useRef<HTMLDivElement>(null);

  const persist = useCallback(
    (patch: Partial<HireJourneyPersistedState>) => {
      const next: HireJourneyPersistedState = {
        hireOperationId: hireOperationIdRef.current,
        assessmentKey,
        beat,
        questionIndex,
        answers,
        salesPeerId: peerIds.sales,
        marketingPeerId: peerIds.marketing,
        hireComplete: beat === "ready",
        startedAt: initialState?.startedAt ?? Date.now(),
        ...patch,
      };
      saveHireJourney(next);
    },
    [assessmentKey, answers, beat, initialState?.startedAt, peerIds, questionIndex]
  );

  const goTo = useCallback(
    (next: HireBeat) => {
      setVisible(false);
      window.setTimeout(
        () => {
          setBeat(next);
          setVisible(true);
          persist({ beat: next });
        },
        reducedMotion ? 100 : 320
      );
    },
    [persist, reducedMotion]
  );

  const runCreate = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreateFailed(false);
    setBeat("creating");
    setVisible(true);
    persist({ beat: "creating" });

    const result = await createHireTeam({
      sales: model.salesRecommendation,
      marketing: model.marketingRecommendation,
      websiteUrl: model.websiteUrl,
      organizationId,
      existingSalesPeerId: peerIds.sales,
      existingMarketingPeerId: peerIds.marketing,
    });

    creatingRef.current = false;

    if (result.ok) {
      setPeerIds({ sales: result.salesPeerId, marketing: result.marketingPeerId });
      persist({
        beat: "ready",
        salesPeerId: result.salesPeerId,
        marketingPeerId: result.marketingPeerId,
        hireComplete: true,
      });
      goTo("ready");
    } else {
      setCreateFailed(true);
      if (result.salesPeerId) {
        setPeerIds((current) => ({ ...current, sales: result.salesPeerId }));
        persist({ beat: "creating", salesPeerId: result.salesPeerId });
      } else {
        persist({ beat: "creating" });
      }
    }
  }, [goTo, model, organizationId, peerIds.marketing, peerIds.sales, persist]);

  useEffect(() => {
    if (!initialState || resumedCreateRef.current) return;

    if (initialState.hireComplete && initialState.beat === "ready") {
      setBeat("ready");
      setPeerIds({
        sales: initialState.salesPeerId,
        marketing: initialState.marketingPeerId,
      });
      resumedCreateRef.current = true;
      return;
    }

    if (initialState.beat === "creating" && !initialState.hireComplete) {
      if (initialState.salesPeerId && initialState.marketingPeerId) {
        setBeat("ready");
        setPeerIds({
          sales: initialState.salesPeerId,
          marketing: initialState.marketingPeerId,
        });
        resumedCreateRef.current = true;
        return;
      }

      resumedCreateRef.current = true;
      void runCreate();
    }
  }, [initialState, runCreate]);

  useEffect(() => {
    if (!visible) return;
    const delay = reducedMotion ? 60 : 340;
    const timer = window.setTimeout(() => {
      beatFocusRef.current?.focus();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [beat, visible, reducedMotion]);

  function advanceQuestion(patch?: Partial<HirePersonalisationAnswers>) {
    const nextAnswers = patch ? { ...answers, ...patch } : answers;
    if (patch) setAnswers(nextAnswers);

    if (questionIndex >= 3) {
      persist({ answers: nextAnswers, questionIndex, beat: "creating" });
      void runCreate();
      return;
    }

    setVisible(false);
    window.setTimeout(() => {
      const nextIndex = questionIndex + 1;
      setQuestionIndex(nextIndex);
      setVisible(true);
      persist({ questionIndex: nextIndex, answers: nextAnswers });
    }, reducedMotion ? 60 : 260);
  }

  function skipQuestion() {
    advanceQuestion();
  }

  function backInPersonalisation() {
    if (questionIndex === 0) {
      goTo("preparing");
      return;
    }
    setVisible(false);
    window.setTimeout(() => {
      const nextIndex = questionIndex - 1;
      setQuestionIndex(nextIndex);
      setVisible(true);
      persist({ questionIndex: nextIndex });
    }, reducedMotion ? 60 : 260);
  }

  function handleMeetTeam() {
    clearHireJourney();
    router.push("/peers");
  }

  const showBrainBack = beat === "welcome" || beat === "intro";

  return (
    <div
      className={cn(
        "relative flex min-h-[min(720px,calc(100dvh-5rem))] flex-col justify-center overflow-x-hidden py-10 md:py-14",
        animateEntry && "pg-surface-reveal-up",
        showBrainBack && "pt-8 sm:pt-10"
      )}
    >
      <div
        ref={beatFocusRef}
        tabIndex={-1}
        className="sr-only outline-none"
        aria-live="polite"
      >
        {beat === "welcome" && "Welcome to hiring your AI team"}
        {beat === "intro" && "Meet your team"}
        {beat === "preparing" && "Preparing the team"}
        {beat === "personalisation" && "Personalisation question"}
        {beat === "creating" && "Welcoming your team"}
        {beat === "ready" && "Your AI team is ready"}
      </div>

      {showBrainBack && (
        <button
          type="button"
          onClick={onBackToBrain}
          className="absolute left-0 top-0 rounded-md text-xs text-slate-700 transition hover:text-slate-500"
        >
          ← Back to Business Brain
        </button>
      )}

      {beat === "welcome" && (
        <BeatShell visible={visible}>
          <HireWelcome
            model={model}
            reducedMotion={reducedMotion}
            onContinue={() => goTo("intro")}
          />
        </BeatShell>
      )}

      {beat === "intro" && (
        <BeatShell visible={visible} wide>
          <HireTeamIntro
            model={model}
            reducedMotion={reducedMotion}
            teamHovered={teamHovered}
            onTeamHover={setTeamHovered}
            onContinue={() => goTo("preparing")}
          />
        </BeatShell>
      )}

      {beat === "preparing" && (
        <BeatShell visible={visible}>
          <HirePreparing
            model={model}
            reducedMotion={reducedMotion}
            onContinue={() => goTo("personalisation")}
          />
        </BeatShell>
      )}

      {beat === "personalisation" && (
        <BeatShell visible={visible}>
          <HirePersonalisation
            questionIndex={questionIndex}
            answers={answers}
            onAnswersChange={(value) => setAnswers((c) => ({ ...c, ...value }))}
            onContinue={advanceQuestion}
            onSkip={skipQuestion}
            onBack={backInPersonalisation}
          />
        </BeatShell>
      )}

      {beat === "creating" && (
        <BeatShell visible={visible}>
          <HireCreating
            failed={createFailed}
            reducedMotion={reducedMotion}
            onRetry={() => void runCreate()}
          />
        </BeatShell>
      )}

      {beat === "ready" && (
        <BeatShell visible={visible}>
          <HireReady
            model={model}
            reducedMotion={reducedMotion}
            onMeetTeam={handleMeetTeam}
          />
        </BeatShell>
      )}
    </div>
  );
}
