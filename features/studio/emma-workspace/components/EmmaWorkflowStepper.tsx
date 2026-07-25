"use client";

import { Check, Clock, Pencil, Square } from "lucide-react";
import type { EmmaPipelineStage } from "@/lib/peer-experience/marketing/emma-workspace-types";
import { cn } from "@/lib/ui/cn";

export type EmmaWorkflowStepperProps = {
  stages: EmmaPipelineStage[];
};

export default function EmmaWorkflowStepper({ stages }: EmmaWorkflowStepperProps) {
  return (
    <ol className="emma-workflow-stepper">
      {stages.map((stage) => (
        <li
          key={stage.id}
          className={cn(
            "emma-workflow-stepper__item",
            stage.status === "complete" && "emma-workflow-stepper__item--complete",
            stage.status === "active" && "emma-workflow-stepper__item--active",
            stage.status === "pending" && "emma-workflow-stepper__item--pending"
          )}
        >
          <div className="emma-workflow-stepper__icon" aria-hidden>
            {stage.status === "complete" && <Check size={12} strokeWidth={3} />}
            {stage.status === "active" && <Pencil size={12} strokeWidth={2.5} />}
            {stage.status === "pending" && <Square size={10} strokeWidth={2} />}
          </div>

          <div className="emma-workflow-stepper__content">
            <div className="emma-workflow-stepper__header">
              <div className="emma-workflow-stepper__labels">
                <span className="emma-workflow-stepper__label">{stage.label}</span>
                {stage.subtitle && (
                  <span className="emma-workflow-stepper__subtitle">{stage.subtitle}</span>
                )}
              </div>
              <span className="emma-workflow-stepper__value">
                {stage.status === "pending" && stage.waitLabel
                  ? stage.waitLabel
                  : stage.status === "active"
                    ? "In progress"
                    : stage.status === "complete"
                      ? "Complete"
                      : `${stage.progress}%`}
              </span>
            </div>
            <div className="emma-workflow-stepper__track">
              <div
                className="emma-workflow-stepper__fill"
                style={{ width: `${stage.progress}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export type EmmaWorkflowEtaProps = {
  etaMinutes: number;
};

export function EmmaWorkflowEta({ etaMinutes }: EmmaWorkflowEtaProps) {
  return (
    <p className="emma-current-work__eta">
      <Clock size={14} aria-hidden />
      Estimated completion: <strong>{etaMinutes} minutes</strong>
    </p>
  );
}
