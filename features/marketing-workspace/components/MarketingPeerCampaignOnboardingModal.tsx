"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CampaignOnboardingResult } from "@/lib/peer-experience/marketing/campaign-onboarding";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignSetupChannel } from "@/lib/peer-experience/marketing/projects/types";
import MarketingVisionModal from "./MarketingVisionModal";
import {
  campaignOnboardingStepHasErrors,
  channelOptionLabel,
  createCampaignOnboardingFormState,
  deliverableOptionLabel,
  deliverableOptionsForChannels,
  summarizeOnboardingState,
  toCampaignOnboardingInput,
  validateCampaignOnboardingStep,
  type CampaignOnboardingFormState,
} from "../lib/campaign-onboarding-form";

export type MarketingPeerCampaignOnboardingModalProps = {
  open: boolean;
  project: MarketingProject;
  peerName: string;
  campaignGoal: string;
  approvalModeLabel: string;
  onClose: () => void;
  onSkipForNow: () => void;
  onComplete: (
    projectId: string,
    input: ReturnType<typeof toCampaignOnboardingInput>
  ) => Promise<CampaignOnboardingResult>;
  presentation?: "default" | "v17";
};

type Step = 1 | 2 | 3 | 4 | 5;

function toggleSelection<T extends string>(current: T[], value: T, exclusive?: T): T[] {
  if (exclusive && value === exclusive) {
    return current.includes(value) ? [] : [value];
  }
  const withoutExclusive = exclusive ? current.filter((v) => v !== exclusive) : current;
  if (withoutExclusive.includes(value)) {
    return withoutExclusive.filter((v) => v !== value);
  }
  return [...withoutExclusive, value];
}

function CampaignOnboardingModalFlow({
  project,
  campaignGoal,
  approvalModeLabel,
  onClose,
  onSkipForNow,
  onComplete,
  onStepChange,
  onSubmittingChange,
}: {
  project: MarketingProject;
  campaignGoal: string;
  approvalModeLabel: string;
  onClose: () => void;
  onSkipForNow: () => void;
  onComplete: MarketingPeerCampaignOnboardingModalProps["onComplete"];
  onStepChange: (step: Step) => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<CampaignOnboardingFormState>(() =>
    createCampaignOnboardingFormState(project)
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateCampaignOnboardingStep>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    onStepChange(step);
  }, [onStepChange, step]);

  useEffect(() => {
    onSubmittingChange(submitting);
  }, [onSubmittingChange, submitting]);

  const deliverableOptions = deliverableOptionsForChannels(state.selectedChannels);

  const goBack = () => {
    if (submitting) return;
    setErrors({});
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  };

  const advanceFromStep = (from: 1 | 2 | 3 | 4) => {
    const stepErrors = validateCampaignOnboardingStep(from, state);
    setErrors(stepErrors);
    if (campaignOnboardingStepHasErrors(stepErrors)) return;
    setStep((from + 1) as Step);
  };

  const handleSave = useCallback(async () => {
    if (pendingRef.current || submitting) return;
    const stepErrors = validateCampaignOnboardingStep(4, state);
    setErrors(stepErrors);
    if (campaignOnboardingStepHasErrors(stepErrors)) {
      setStep(4);
      return;
    }

    pendingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const input = toCampaignOnboardingInput(state);
      const result = await onComplete(project.id, input);
      if (!result.ok) {
        setSubmitError("Campaign setup could not be saved. Try again.");
        return;
      }
      onClose();
    } catch {
      setSubmitError("Campaign setup could not be saved. Try again.");
    } finally {
      pendingRef.current = false;
      setSubmitting(false);
    }
  }, [onClose, onComplete, project.id, state, submitting]);

  const handleStepSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (step === 5) {
      void handleSave();
      return;
    }
    advanceFromStep(step as 1 | 2 | 3 | 4);
  };

  const summary = summarizeOnboardingState(state);

  return (
    <form onSubmit={handleStepSubmit} className="mw-campaign-onboarding-form">
        {step === 1 && (
          <>
            <p className="mw-modal-label">Who should this campaign reach?</p>
            <textarea
              className="mw-modal-input"
              rows={3}
              value={state.audience}
              onChange={(e) => setState((s) => ({ ...s, audience: e.target.value }))}
              data-testid="mw-onboarding-audience"
              aria-invalid={Boolean(errors.audience)}
            />
            {errors.audience ? (
              <p className="mw-field-error" role="alert">
                {errors.audience}
              </p>
            ) : null}
          </>
        )}

        {step === 2 && (
          <>
            <p className="mw-modal-label">Where should we reach them?</p>
            <div className="mw-onboarding-chip-grid" role="group" aria-label="Channels">
              {(
                [
                  "linkedin",
                  "instagram",
                  "email",
                  "blog",
                  "website_landing",
                  "meta_ads",
                  "google_ads",
                  "other",
                  "decide_later",
                ] as CampaignSetupChannel[]
              ).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  className={
                    state.selectedChannels.includes(channel)
                      ? "mw-onboarding-chip mw-onboarding-chip--selected pg-focus-premium"
                      : "mw-onboarding-chip pg-focus-premium"
                  }
                  aria-pressed={state.selectedChannels.includes(channel)}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      selectedChannels: toggleSelection(
                        s.selectedChannels,
                        channel,
                        "decide_later"
                      ),
                    }))
                  }
                >
                  {channelOptionLabel(channel)}
                </button>
              ))}
            </div>
            {state.selectedChannels.includes("other") ? (
              <input
                className="mw-modal-input"
                style={{ marginTop: 12 }}
                placeholder="Custom channel"
                value={state.customChannelLabel}
                onChange={(e) =>
                  setState((s) => ({ ...s, customChannelLabel: e.target.value }))
                }
                data-testid="mw-onboarding-custom-channel"
              />
            ) : null}
            {errors.channels ? (
              <p className="mw-field-error" role="alert">
                {errors.channels}
              </p>
            ) : null}
            {errors.customChannelLabel ? (
              <p className="mw-field-error" role="alert">
                {errors.customChannelLabel}
              </p>
            ) : null}
          </>
        )}

        {step === 3 && (
          <>
            <p className="mw-modal-label">What should I prepare?</p>
            <div className="mw-onboarding-chip-grid" role="group" aria-label="Deliverables">
              {deliverableOptions.map((deliverable) => (
                <button
                  key={deliverable}
                  type="button"
                  className={
                    state.selectedDeliverables.includes(deliverable)
                      ? "mw-onboarding-chip mw-onboarding-chip--selected pg-focus-premium"
                      : "mw-onboarding-chip pg-focus-premium"
                  }
                  aria-pressed={state.selectedDeliverables.includes(deliverable)}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      selectedDeliverables: toggleSelection(
                        s.selectedDeliverables,
                        deliverable,
                        "decide_later"
                      ),
                    }))
                  }
                >
                  {deliverableOptionLabel(deliverable)}
                </button>
              ))}
            </div>
            {state.selectedDeliverables.includes("other") ? (
              <input
                className="mw-modal-input"
                style={{ marginTop: 12 }}
                placeholder="Custom deliverable"
                value={state.customDeliverableLabel}
                onChange={(e) =>
                  setState((s) => ({ ...s, customDeliverableLabel: e.target.value }))
                }
              />
            ) : null}
            {errors.deliverables ? (
              <p className="mw-field-error" role="alert">
                {errors.deliverables}
              </p>
            ) : null}
            {errors.customDeliverableLabel ? (
              <p className="mw-field-error" role="alert">
                {errors.customDeliverableLabel}
              </p>
            ) : null}
          </>
        )}

        {step === 4 && (
          <>
            <p className="mw-modal-label">When should this campaign be ready?</p>
            <label className="mw-onboarding-radio">
              <input
                type="radio"
                name="timing"
                checked={state.timingDecision === "no_deadline"}
                onChange={() =>
                  setState((s) => ({ ...s, timingDecision: "no_deadline" }))
                }
              />
              No deadline yet
            </label>
            <label className="mw-onboarding-radio">
              <input
                type="radio"
                name="timing"
                checked={state.timingDecision === "dated"}
                onChange={() => setState((s) => ({ ...s, timingDecision: "dated" }))}
              />
              Target dates
            </label>
            {state.timingDecision === "dated" ? (
              <div className="mw-onboarding-date-row">
                <div>
                  <p className="mw-modal-label">Start date</p>
                  <input
                    type="date"
                    className="mw-modal-input"
                    value={state.startDate}
                    onChange={(e) => setState((s) => ({ ...s, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="mw-modal-label">Target end date</p>
                  <input
                    type="date"
                    className="mw-modal-input"
                    value={state.endDate}
                    onChange={(e) => setState((s) => ({ ...s, endDate: e.target.value }))}
                  />
                </div>
              </div>
            ) : null}
            {errors.timing ? (
              <p className="mw-field-error" role="alert">
                {errors.timing}
              </p>
            ) : null}
          </>
        )}

        {step === 5 && (
          <>
            <p className="mw-modal-label">Here is what I will prepare</p>
            <ul className="mw-campaign-meta" style={{ marginBottom: 12 }}>
              <li>Goal: {campaignGoal}</li>
              <li>Audience: {summary.audience}</li>
              <li>Channels: {summary.channels}</li>
              <li>Deliverables: {summary.deliverables}</li>
              <li>Timing: {summary.timing}</li>
              <li>Approvals: {approvalModeLabel}</li>
            </ul>
            <ul className="mw-campaign-meta">
              <li>Nothing will be published automatically.</li>
              <li>Approval settings remain active.</li>
              <li>You can review the campaign plan before starting work.</li>
            </ul>
          </>
        )}

        {submitError ? (
          <p className="mw-field-error" role="alert" style={{ marginTop: 12 }}>
            {submitError}
          </p>
        ) : null}

        <div className="mw-modal-actions" style={{ marginTop: 20 }}>
          {step > 1 && step < 5 ? (
            <button
              type="button"
              className="mw-modal-secondary pg-focus-premium"
              disabled={submitting}
              onClick={goBack}
            >
              Back
            </button>
          ) : null}
          {step === 5 ? (
            <button
              type="button"
              className="mw-modal-secondary pg-focus-premium"
              disabled={submitting}
              onClick={goBack}
            >
              Back
            </button>
          ) : null}
          {step < 5 ? (
            <button type="submit" className="mw-btn-primary pg-focus-premium" disabled={submitting}>
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className="mw-btn-primary pg-focus-premium"
              disabled={submitting}
              data-testid="mw-onboarding-save"
            >
              {submitting ? "Saving…" : "Save and prepare campaign"}
            </button>
          )}
          {step === 5 ? (
            <button
              type="button"
              className="mw-marketing-peer-onboarding-skip pg-focus-premium"
              disabled={submitting}
              onClick={onSkipForNow}
            >
              Skip for now
            </button>
          ) : null}
        </div>
      </form>
  );
}

export default function MarketingPeerCampaignOnboardingModal({
  open,
  project,
  peerName,
  campaignGoal,
  approvalModeLabel,
  onClose,
  onSkipForNow,
  onComplete,
  presentation = "default",
}: MarketingPeerCampaignOnboardingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  return (
    <MarketingVisionModal
      open={open}
      onClose={() => {
        if (submitting) return;
        onClose();
      }}
      title={`${peerName} — campaign setup`}
      subtitle={`Step ${step} of 5`}
      maxWidth={560}
      closeOnEscape={!submitting}
      closeOnOverlayClick={!submitting}
      presentation={presentation}
      testId="mw-campaign-onboarding-modal"
    >
      {open ? (
        <CampaignOnboardingModalFlow
          key={project.id}
          project={project}
          campaignGoal={campaignGoal}
          approvalModeLabel={approvalModeLabel}
          onClose={onClose}
          onSkipForNow={onSkipForNow}
          onComplete={onComplete}
          onStepChange={setStep}
          onSubmittingChange={setSubmitting}
        />
      ) : null}
    </MarketingVisionModal>
  );
}
