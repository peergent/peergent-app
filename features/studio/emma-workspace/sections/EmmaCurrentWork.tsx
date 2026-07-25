"use client";

import type { EmmaCurrentWorkViewModel } from "@/lib/peer-experience/marketing/emma-workspace-types";
import EmmaCard from "../components/EmmaCard";
import EmmaWorkflowStepper, { EmmaWorkflowEta } from "../components/EmmaWorkflowStepper";
import EmmaWorkspaceSection from "../components/EmmaWorkspaceSection";

export type EmmaCurrentWorkProps = {
  model: EmmaCurrentWorkViewModel;
};

export default function EmmaCurrentWork({ model }: EmmaCurrentWorkProps) {
  return (
    <EmmaWorkspaceSection
      id="current-work"
      title="Current Work"
      subtitle={model.sectionSubtitle}
    >
      <EmmaCard
        className={
          model.isActive ? "emma-current-work emma-current-work--active" : "emma-current-work"
        }
      >
        {model.campaignTitle && (
          <div className="emma-current-work__header">
            <h3 className="emma-current-work__title">{model.campaignTitle}</h3>
            {model.activeStageLabel && (
              <span className="emma-current-work__badge">{model.activeStageLabel}</span>
            )}
          </div>
        )}

        {model.stages.length > 0 ? (
          <EmmaWorkflowStepper stages={model.stages} />
        ) : (
          <p className="emma-current-work__idle emma-voice emma-voice--muted">
            {model.statusLine}
          </p>
        )}

        {model.etaMinutes != null && model.isActive && (
          <EmmaWorkflowEta etaMinutes={model.etaMinutes} />
        )}
      </EmmaCard>
    </EmmaWorkspaceSection>
  );
}
