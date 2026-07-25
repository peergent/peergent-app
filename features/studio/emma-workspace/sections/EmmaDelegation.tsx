"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import type { EmmaDelegationViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import type { DelegationRecurrence, DelegationTask } from "@/lib/peer-experience/marketing/parse-delegation-intent";
import {
  buildClarifyingQuestions,
  finalizeDelegationTask,
  parseDelegationIntent,
} from "@/lib/peer-experience/marketing/parse-delegation-intent";
import { buildAssignmentSummary } from "@/lib/peer-experience/marketing/build-assignment-summary";
import { DELEGATION_QUICK_ACTIONS } from "@/lib/peer-experience/marketing/delegation-quick-actions";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

type DelegationPhase = "input" | "questions" | "recurrence" | "executing" | "done";

const RECURRENCE_OPTIONS: { id: DelegationRecurrence; label: string }[] = [
  { id: "once", label: "Run once" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
  { id: "custom", label: "Custom schedule" },
  { id: "trigger", label: "Automatic trigger" },
];

export type EmmaDelegationProps = {
  model: EmmaDelegationViewModel;
  peerName: string;
  brandName?: string;
  onExecuteTask?: (task: DelegationTask) => Promise<void>;
  busy?: boolean;
};

export default function EmmaDelegation({
  model,
  peerName,
  brandName = "Peergent",
  onExecuteTask,
  busy = false,
}: EmmaDelegationProps) {
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<DelegationPhase>("input");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");

  const parsedIntent = useMemo(
    () => (message.trim() ? parseDelegationIntent(message) : null),
    [message]
  );

  const questions = useMemo(
    () => (parsedIntent ? buildClarifyingQuestions(parsedIntent) : []),
    [parsedIntent]
  );

  const assignmentSummary = useMemo(
    () =>
      parsedIntent ? buildAssignmentSummary(parsedIntent, answers, brandName) : null,
    [parsedIntent, answers, brandName]
  );

  const beginWithMessage = (nextMessage: string) => {
    setMessage(nextMessage);
    const intent = parseDelegationIntent(nextMessage);
    const qs = buildClarifyingQuestions(intent);
    if (qs.length === 0) {
      setPhase("recurrence");
      return;
    }
    setPhase("questions");
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || !parsedIntent) return;
    beginWithMessage(trimmed);
  };

  const handleQuestionsContinue = () => {
    if (!parsedIntent) return;
    setPhase("recurrence");
  };

  const handleRecurrence = async (recurrence: DelegationRecurrence) => {
    if (!parsedIntent || !onExecuteTask) return;

    const task = finalizeDelegationTask(parsedIntent, answers, recurrence);
    setPhase("executing");
    setStatusMessage(`${peerName} is reviewing your assignment…`);

    try {
      await onExecuteTask(task);
      setPhase("done");
      setStatusMessage(
        "Got it. You'll find the project under Emma is working on. I'll let you know in Emma needs you when it's ready for review."
      );
      setMessage("");
      setAnswers({});
      window.setTimeout(() => setPhase("input"), 4000);
    } catch {
      setPhase("input");
      setStatusMessage("");
    }
  };

  const allAnswered = questions.every((q) => answers[q.id]?.trim());

  return (
    <EmmaWorkspaceSection id="delegation" title="What do you need?" className="emma-delegation-section">
      <EmmaCard className="emma-delegation">
        {phase === "input" && (
          <>
            <p className="emma-delegation__empty-prompt">{model.emptyPrompt}</p>
            <div className="emma-delegation__field">
              <input
                type="text"
                className="emma-delegation__input pg-focus-premium"
                placeholder={model.placeholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                disabled={busy}
                aria-label={model.promptLabel}
              />
              <button
                type="button"
                className="emma-delegation__send pg-focus-premium"
                onClick={handleSubmit}
                disabled={!message.trim() || busy}
                aria-label="Assign task"
              >
                <Send size={18} aria-hidden />
              </button>
            </div>
            <div className="emma-delegation__quick-actions">
              {DELEGATION_QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="emma-delegation__quick-action pg-focus-premium"
                  disabled={busy}
                  onClick={() => beginWithMessage(action.message)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "questions" && parsedIntent && (
          <div className="emma-delegation__followup">
            <p className="emma-voice">{questions[0]?.prompt}</p>
            {questions.map((question) => (
              <div key={question.id} className="emma-delegation__question">
                {question.options ? (
                  <div className="emma-delegation__chips">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={
                          answers[question.id] === option
                            ? "emma-delegation__chip emma-delegation__chip--active pg-focus-premium"
                            : "emma-delegation__chip pg-focus-premium"
                        }
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option }))
                        }
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="emma-delegation__answer pg-focus-premium"
                    value={answers[question.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              className="emma-delegation__continue pg-focus-premium"
              disabled={!allAnswered}
              onClick={handleQuestionsContinue}
            >
              Continue
            </button>
          </div>
        )}

        {phase === "recurrence" && assignmentSummary && (
          <div className="emma-delegation__followup">
            <p className="emma-voice">{assignmentSummary.headline}</p>
            <p className="emma-voice emma-voice--muted">Deliverables:</p>
            <ul className="emma-delegation__deliverables">
              {assignmentSummary.deliverables.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
            <p className="emma-voice emma-voice--muted">{assignmentSummary.objectiveLine}</p>
            <p className="emma-voice">Run once, or repeat automatically?</p>
            <div className="emma-delegation__chips">
              {RECURRENCE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="emma-delegation__chip pg-focus-premium"
                  onClick={() => void handleRecurrence(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {(phase === "executing" || phase === "done") && (
          <p className="emma-voice">{statusMessage}</p>
        )}
      </EmmaCard>
    </EmmaWorkspaceSection>
  );
}
