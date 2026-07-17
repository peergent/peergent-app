"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import {
  CRM_OPTIONS,
  HANDOVER_OPTIONS,
  isEmailLike,
  isValidEmail,
  LANGUAGE_OPTIONS,
  type HirePersonalisationAnswers,
} from "@/lib/hire-team/hire-team-presenter";
import {
  hireBtnFull,
  hireChoiceBase,
  hireChoiceIdle,
  hireChoiceSelected,
  hireOptionBase,
  hireOptionIdle,
  hireOptionSelected,
  hireQuestion,
} from "@/lib/hire-team/hire-ui";
import { cn } from "@/lib/ui/cn";

type HirePersonalisationProps = {
  questionIndex: number;
  answers: HirePersonalisationAnswers;
  onAnswersChange: (value: Partial<HirePersonalisationAnswers>) => void;
  onContinue: (patch?: Partial<HirePersonalisationAnswers>) => void;
  onSkip: () => void;
  onBack: () => void;
};

export default function HirePersonalisation({
  questionIndex,
  answers,
  onAnswersChange,
  onContinue,
  onSkip,
  onBack,
}: HirePersonalisationProps) {
  const advancingRef = useRef(false);

  useEffect(() => {
    advancingRef.current = false;
  }, [questionIndex]);

  const emailInvalid =
    answers.leadRecipient.trim().length > 0 &&
    isEmailLike(answers.leadRecipient) &&
    !isValidEmail(answers.leadRecipient);

  function selectOption(value: Partial<HirePersonalisationAnswers>) {
    if (advancingRef.current) return;
    advancingRef.current = true;
    onAnswersChange(value);
    window.setTimeout(() => onContinue(value), 380);
  }

  return (
    <div className="w-full max-w-xl">
      <div className="mb-10 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={onBack}
          className="pg-focus-premium rounded-md text-xs text-slate-600 transition hover:text-slate-400"
        >
          ← Back
        </button>
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={cn(
                "h-0.5 w-3 rounded-full transition duration-300",
                dot <= questionIndex ? "bg-violet-400/50" : "bg-white/[0.06]"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="pg-focus-premium rounded-md text-xs text-slate-700 transition hover:text-slate-500"
        >
          Skip for now
        </button>
      </div>

      {questionIndex === 0 && (
        <>
          <h2 id="hire-q" className={hireQuestion}>
            What CRM do you use?
          </h2>
          <div
            className="mt-10 flex flex-wrap justify-center gap-2.5"
            role="radiogroup"
            aria-labelledby="hire-q"
          >
            {CRM_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={answers.crm === option}
                onClick={() => selectOption({ crm: option })}
                className={cn(
                  hireOptionBase,
                  answers.crm === option ? hireOptionSelected : hireOptionIdle
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      {questionIndex === 1 && (
        <>
          <h2 id="hire-q" className={hireQuestion}>
            Who should receive qualified leads?
          </h2>
          <label htmlFor="lead-recipient" className="sr-only">
            Who should receive qualified leads?
          </label>
          <input
            id="lead-recipient"
            type="text"
            autoFocus
            value={answers.leadRecipient}
            onChange={(e) => onAnswersChange({ leadRecipient: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !emailInvalid) onContinue();
            }}
            placeholder="name@company.com"
            className="pg-focus-premium mt-10 w-full min-w-0 rounded-[18px] border border-white/[0.07] bg-white/[0.025] px-5 py-3.5 text-[15px] text-white outline-none placeholder:text-slate-600 focus:border-violet-500/25"
          />
          {emailInvalid && (
            <p className="mt-2.5 text-center text-xs text-slate-500">
              Enter a valid email address
            </p>
          )}
          <button
            type="button"
            onClick={() => onContinue()}
            disabled={emailInvalid}
            className={cn("mt-10", hireBtnFull)}
          >
            Continue
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </>
      )}

      {questionIndex === 2 && (
        <>
          <h2 id="hire-q" className={hireQuestion}>
            When should Sales Peer hand over to your team?
          </h2>
          <div
            className="mt-10 flex flex-col gap-2"
            role="radiogroup"
            aria-labelledby="hire-q"
          >
            {HANDOVER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={answers.handover === option}
                onClick={() => selectOption({ handover: option })}
                className={cn(
                  hireChoiceBase,
                  answers.handover === option ? hireChoiceSelected : hireChoiceIdle
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      {questionIndex === 3 && (
        <>
          <h2 id="hire-q" className={hireQuestion}>
            What language should your team use?
          </h2>
          <div
            className="mt-10 flex flex-wrap justify-center gap-2.5"
            role="radiogroup"
            aria-labelledby="hire-q"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={answers.language === option}
                onClick={() => selectOption({ language: option })}
                className={cn(
                  hireOptionBase,
                  answers.language === option ? hireOptionSelected : hireOptionIdle
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
