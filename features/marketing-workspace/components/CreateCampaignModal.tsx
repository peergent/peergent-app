"use client";

import { useId, useState } from "react";
import type { CampaignApprovalMode } from "@/lib/campaign";
import MarketingVisionModal from "./MarketingVisionModal";
import {
  CREATE_CAMPAIGN_CHANNELS,
  CREATE_CAMPAIGN_DELIVERABLES,
  CREATE_CAMPAIGN_PRIMARY_GOALS,
  createCampaignFormHasErrors,
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
  validateCreateCampaignForm,
  type CreateCampaignFormValues,
  type CreateCampaignExecutionMode,
  type CreateCampaignPrimaryGoalId,
  type CreateCampaignSetupMode,
} from "../lib/create-campaign-form";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import { getV17CreateCampaignCopy } from "@/lib/i18n/v17-create-campaign-copy";
import type { CampaignSetupChannel } from "@/lib/peer-experience/marketing/projects/types";
import type { CampaignSetupDeliverable } from "@/lib/peer-experience/marketing/projects/types";
import {
  CAMPAIGN_DURATION_PRESETS,
  buildDurationAtCreation,
  type CampaignDurationPreset,
} from "@/lib/office/campaign/campaign-duration";

const APPROVAL_OPTIONS: readonly { value: CampaignApprovalMode; label: string }[] = [
  { value: "approval_before_publication", label: "Approve before publication" },
  { value: "approval_before_generation", label: "Approve before generation" },
  { value: "no_approval_required", label: "Automatic after generation" },
  { value: "blocked_manual_only", label: "Manual execution only" },
];

export type CreateCampaignModalProps = {
  open: boolean;
  onClose: () => void;
  setupMode?: CreateCampaignSetupMode;
  peerId: string;
  ownerLabel: string;
  peerName: string;
  onCreate: (input: CreateMarketingCampaignProjectInput) => Promise<{ projectId: string }>;
  presentation?: "default" | "v17";
  localePreference?: string | null;
  externalError?: string | null;
};

function toggleGoal(
  current: CreateCampaignPrimaryGoalId[],
  goalId: CreateCampaignPrimaryGoalId
): CreateCampaignPrimaryGoalId[] {
  if (current.includes(goalId)) {
    return current.filter((id) => id !== goalId);
  }
  return [...current, goalId];
}

function toggleChannel(current: CampaignSetupChannel[], channel: CampaignSetupChannel): CampaignSetupChannel[] {
  if (current.includes(channel)) return current.filter((c) => c !== channel);
  return [...current, channel];
}

function toggleDeliverable(
  current: CampaignSetupDeliverable[],
  deliverable: CampaignSetupDeliverable
): CampaignSetupDeliverable[] {
  if (current.includes(deliverable)) return current.filter((d) => d !== deliverable);
  return [...current, deliverable];
}

function applyDurationPreset(preset: CampaignDurationPreset) {
  const duration = buildDurationAtCreation(preset);
  return {
    durationPreset: preset,
    startDate: duration.startDate,
    endDate: duration.endDate ?? "",
  };
}

function CreateCampaignModalContent({
  open,
  onClose,
  setupMode = "automatic",
  peerId,
  ownerLabel,
  peerName,
  onCreate,
  presentation = "default",
  localePreference,
  externalError,
}: CreateCampaignModalProps) {
  const formId = useId();
  const isV17 = presentation === "v17";
  const nl = localePreference === "nl";
  const isAutomatic = setupMode === "automatic";
  const v17Copy = getV17CreateCampaignCopy(localePreference);
  const [values, setValues] = useState<CreateCampaignFormValues>(() =>
    createEmptyCreateCampaignForm(setupMode)
  );
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateCreateCampaignForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validateCreateCampaignForm(values);
    setFieldErrors(errors);
    if (createCampaignFormHasErrors(errors)) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const input = toCreateMarketingCampaignProjectInput(peerId, ownerLabel, values);
      await onCreate(input);
      setValues(createEmptyCreateCampaignForm(setupMode));
      setFieldErrors({});
      onClose();
    } catch {
      setSubmitError(isV17 ? v17Copy.submitError : "We could not create this campaign. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isAutomatic
    ? nl
      ? "Laat Emma een campagne bedenken"
      : "Let Emma design a campaign"
    : nl
      ? "Zelf campagne opzetten"
      : "Set up campaign yourself";

  const modalSubtitle = isAutomatic
    ? nl
      ? "Vertel Emma wat je wilt bereiken. Zij bepaalt de rest."
      : "Tell Emma what you want to achieve. She decides the rest."
    : isV17
      ? v17Copy.subtitle(peerName)
      : `Set up a campaign for ${peerName}.`;

  const submitLabel = isAutomatic
    ? nl
      ? "Start automatisch"
      : "Start automatic"
    : nl
      ? "Start handmatig"
      : "Start manual";

  return (
    <MarketingVisionModal
      open={open}
      onClose={handleClose}
      title={isV17 ? modalTitle : "Create campaign"}
      subtitle={isV17 ? modalSubtitle : `Set up a campaign for ${peerName}. No content will be generated yet.`}
      maxWidth={560}
      closeOnEscape={!submitting}
      closeOnOverlayClick={!submitting}
      presentation={isV17 ? "v17" : "default"}
      testId="create-campaign-modal"
      footer={
        isV17 ? (
          <div className="pg-v13-form-actions">
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost pg-focus-premium"
              onClick={handleClose}
              disabled={submitting}
            >
              {v17Copy.cancel}
            </button>
            <button
              type="submit"
              form={formId}
              className="pg-v13-btn pg-focus-premium"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (nl ? "Bezig…" : "Working…") : submitLabel}
            </button>
          </div>
        ) : undefined
      }
    >
      <form
        id={formId}
        onSubmit={(e) => void handleSubmit(e)}
        className={isV17 ? "pg-v13-form" : "mw-create-campaign-form"}
      >
        <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"}>
          {isV17 ? v17Copy.nameLabel : "Campaign name"} <span aria-hidden="true">*</span>
        </p>
        <input
          className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          aria-required
          aria-invalid={Boolean(fieldErrors.name)}
          disabled={submitting}
        />
        {fieldErrors.name ? (
          <p className="mw-field-error" role="alert">
            {fieldErrors.name}
          </p>
        ) : null}

        {isAutomatic ? (
          <>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
              {nl ? "Doel" : "Goal"} <span aria-hidden="true">*</span>
            </p>
            <textarea
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              rows={3}
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              disabled={submitting}
              placeholder={
                nl
                  ? "Bijv. installateurs bereiken vóór het warmtepompseizoen"
                  : "E.g. reach installers before heat pump season"
              }
            />
            {fieldErrors.description ? (
              <p className="mw-field-error" role="alert">
                {fieldErrors.description}
              </p>
            ) : null}

            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
              {nl ? "Bedrijfscontext" : "Business context"}{" "}
              <span className="pg-v13-form-hint">({nl ? "optioneel" : "optional"})</span>
            </p>
            <textarea
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              rows={2}
              value={values.intentNotes}
              onChange={(e) => setValues((v) => ({ ...v, intentNotes: e.target.value }))}
              disabled={submitting}
            />

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {nl ? "Campagneduur" : "Campaign duration"}
            </p>
            <div className="pg-v13-goal-grid" role="radiogroup" aria-label={nl ? "Campagneduur" : "Campaign duration"}>
              {CAMPAIGN_DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`pg-v13-goal-chip pg-focus-premium${values.durationPreset === preset.id ? " is-active" : ""}`}
                  aria-pressed={values.durationPreset === preset.id}
                  disabled={submitting}
                  onClick={() => setValues((v) => ({ ...v, ...applyDurationPreset(preset.id) }))}
                >
                  {nl ? preset.labelNl : preset.labelEn}
                </button>
              ))}
            </div>

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {nl ? "Prioriteit" : "Priority"}
            </p>
            <div className="pg-v13-goal-grid" role="radiogroup">
              {(["low", "medium", "high"] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`pg-v13-goal-chip pg-focus-premium${values.priority === priority ? " is-active" : ""}`}
                  aria-pressed={values.priority === priority}
                  disabled={submitting}
                  onClick={() => setValues((v) => ({ ...v, priority }))}
                >
                  {priority === "low"
                    ? nl
                      ? "Laag"
                      : "Low"
                    : priority === "medium"
                      ? nl
                        ? "Normaal"
                        : "Normal"
                      : nl
                        ? "Hoog"
                        : "High"}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
              {nl ? "Doelen" : "Goals"} <span aria-hidden="true">*</span>
            </p>
            <div className={isV17 ? "pg-v13-goal-grid" : "mw-platform-chips"} role="group" aria-label="Goals">
              {CREATE_CAMPAIGN_PRIMARY_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={`pg-v13-goal-chip pg-focus-premium${values.selectedGoalIds.includes(goal.id) ? " is-active" : ""}`}
                  aria-pressed={values.selectedGoalIds.includes(goal.id)}
                  disabled={submitting}
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      selectedGoalIds: toggleGoal(v.selectedGoalIds, goal.id),
                      primaryGoalId: goal.id,
                    }))
                  }
                >
                  {isV17 ? v17Copy.goalLabels[goal.id] : goal.label}
                </button>
              ))}
            </div>
            {fieldErrors.selectedGoalIds ? (
              <p className="mw-field-error" role="alert">
                {fieldErrors.selectedGoalIds}
              </p>
            ) : null}

            {values.selectedGoalIds.includes("custom") ? (
              <>
                <p className="pg-v13-form-label" style={{ marginTop: 12 }}>
                  {v17Copy.customGoalLabel} <span aria-hidden="true">*</span>
                </p>
                <input
                  className="pg-v13-form-input"
                  value={values.customGoalText}
                  onChange={(e) => setValues((v) => ({ ...v, customGoalText: e.target.value }))}
                  disabled={submitting}
                />
                {fieldErrors.customGoalText ? (
                  <p className="mw-field-error" role="alert">
                    {fieldErrors.customGoalText}
                  </p>
                ) : null}
              </>
            ) : null}

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {v17Copy.descriptionLabel}
            </p>
            <textarea
              className="pg-v13-form-input"
              rows={3}
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              disabled={submitting}
            />

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {v17Copy.audienceLabel}{" "}
              <span className="pg-v13-form-hint">({v17Copy.audienceHint})</span>
            </p>
            <input
              className="pg-v13-form-input"
              value={values.targetAudience}
              onChange={(e) => setValues((v) => ({ ...v, targetAudience: e.target.value }))}
              disabled={submitting}
            />

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {v17Copy.channelsLabel}{" "}
              <span className="pg-v13-form-hint">({nl ? "optioneel" : "optional"})</span>
            </p>
            <div className="pg-v13-goal-grid" role="group">
              {CREATE_CAMPAIGN_CHANNELS.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className={`pg-v13-goal-chip pg-focus-premium${values.selectedChannels.includes(channel.id) ? " is-active" : ""}`}
                  aria-pressed={values.selectedChannels.includes(channel.id)}
                  disabled={submitting}
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      selectedChannels: toggleChannel(v.selectedChannels, channel.id),
                    }))
                  }
                >
                  {channel.label}
                </button>
              ))}
            </div>

            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {nl ? "Gewenste deliverables" : "Preferred deliverables"}{" "}
              <span className="pg-v13-form-hint">({nl ? "optioneel" : "optional"})</span>
            </p>
            <div className="pg-v13-goal-grid" role="group">
              {CREATE_CAMPAIGN_DELIVERABLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pg-v13-goal-chip pg-focus-premium${values.selectedDeliverables.includes(item.id) ? " is-active" : ""}`}
                  aria-pressed={values.selectedDeliverables.includes(item.id)}
                  title={item.tooltip}
                  disabled={submitting}
                  onClick={() =>
                    setValues((v) => ({
                      ...v,
                      selectedDeliverables: toggleDeliverable(v.selectedDeliverables, item.id),
                    }))
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="pg-v13-form-row" style={{ marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <p className="pg-v13-form-label">{nl ? "Campagneduur" : "Campaign duration"}</p>
                <div className="pg-v13-goal-grid" role="radiogroup">
                  {CAMPAIGN_DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`pg-v13-goal-chip pg-focus-premium${values.durationPreset === preset.id ? " is-active" : ""}`}
                      aria-pressed={values.durationPreset === preset.id}
                      disabled={submitting}
                      onClick={() => setValues((v) => ({ ...v, ...applyDurationPreset(preset.id) }))}
                    >
                      {nl ? preset.labelNl : preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pg-v13-form-row" style={{ marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <p className="pg-v13-form-label">{v17Copy.startDateLabel}</p>
                <input
                  type="date"
                  className="pg-v13-form-input"
                  value={values.startDate}
                  onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p className="pg-v13-form-label">{v17Copy.endDateLabel}</p>
                <input
                  type="date"
                  className="pg-v13-form-input"
                  value={values.endDate}
                  onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
                  disabled={submitting}
                />
              </div>
            </div>
          </>
        )}

        {isAutomatic ? (
          <div style={{ marginTop: 16 }}>
            <p className="pg-v13-form-label">{nl ? "Deadline" : "Deadline"}</p>
            <input
              type="date"
              className="pg-v13-form-input"
              value={values.endDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
              disabled={submitting}
            />
          </div>
        ) : null}

        {isV17 ? (
          <>
            <p className="pg-v13-form-label" style={{ marginTop: 16 }}>
              {v17Copy.executionModeLabel}
            </p>
            <div className="pg-v13-goal-grid" role="radiogroup" aria-label={v17Copy.executionModeLabel}>
              {(["manual", "semi_automatic", "fully_automatic"] as CreateCampaignExecutionMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`pg-v13-goal-chip pg-focus-premium${values.executionMode === mode ? " is-active" : ""}`}
                    aria-pressed={values.executionMode === mode}
                    disabled={submitting}
                    onClick={() => setValues((v) => ({ ...v, executionMode: mode }))}
                  >
                    <span className="block font-semibold">{v17Copy.executionModes[mode].title}</span>
                    <span className="mt-0.5 block text-[11px] font-normal opacity-80">
                      {v17Copy.executionModes[mode].description}
                    </span>
                  </button>
                )
              )}
            </div>

            {isAutomatic ? (
              <div className="mt-4 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
                <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {nl ? "Wat Emma daarna doet" : "What Emma does next"}
                </p>
                <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {nl
                    ? "Emma analyseert je bedrijf, website en concurrenten, bepaalt strategie, kiest kanalen, maakt deliverables en plant publicatie — jij keurt goed volgens je instellingen."
                    : "Emma analyzes your business, website, and competitors, sets strategy, selects channels, creates deliverables, and schedules publication — you approve per your settings."}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
                <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {v17Copy.approvalSummaryLabel}
                </p>
                <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {v17Copy.approvalSummaryText}
                </p>
              </div>
            )}
          </>
        ) : null}

        {!isV17 ? (
          <>
            <p className="mw-modal-label" style={{ marginTop: 16 }}>
              Approval mode
            </p>
            <select
              className="mw-modal-input"
              value={values.approvalMode}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  approvalMode: e.target.value as CampaignApprovalMode,
                }))
              }
              disabled={submitting}
            >
              {APPROVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {(submitError || externalError) && (
          <p className="mw-field-error" role="alert" style={{ marginTop: 12 }}>
            {submitError ?? externalError}
          </p>
        )}

        {!isV17 ? (
          <button
            type="submit"
            className="mw-btn-primary mw-btn-primary--full pg-focus-premium"
            style={{ marginTop: 20 }}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Creating campaign…" : "Create campaign"}
          </button>
        ) : null}
      </form>
    </MarketingVisionModal>
  );
}

export default function CreateCampaignModal(props: CreateCampaignModalProps) {
  const { open, onClose, setupMode = "automatic", presentation = "default" } = props;

  if (!open) {
    return (
      <MarketingVisionModal
        open={false}
        onClose={onClose}
        title="Create campaign"
        subtitle=""
        maxWidth={560}
        presentation={presentation === "v17" ? "v17" : "default"}
        testId="create-campaign-modal"
      >
        {null}
      </MarketingVisionModal>
    );
  }

  return <CreateCampaignModalContent key={setupMode} {...props} />;
}
