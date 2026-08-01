"use client";

import { useId, useState } from "react";
import type { CampaignApprovalMode } from "@/lib/campaign";
import MarketingVisionModal from "./MarketingVisionModal";
import {
  CREATE_CAMPAIGN_PRIMARY_GOALS,
  createCampaignFormHasErrors,
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
  validateCreateCampaignForm,
  type CreateCampaignFormValues,
} from "../lib/create-campaign-form";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import { getV17CreateCampaignCopy } from "@/lib/i18n/v17-create-campaign-copy";

const APPROVAL_OPTIONS: readonly { value: CampaignApprovalMode; label: string }[] = [
  { value: "approval_before_publication", label: "Approve before publication" },
  { value: "approval_before_generation", label: "Approve before generation" },
  { value: "no_approval_required", label: "Automatic after generation" },
  { value: "blocked_manual_only", label: "Manual execution only" },
];

export type CreateCampaignModalProps = {
  open: boolean;
  onClose: () => void;
  peerId: string;
  ownerLabel: string;
  peerName: string;
  onCreate: (input: CreateMarketingCampaignProjectInput) => Promise<{ projectId: string }>;
  presentation?: "default" | "v17";
  localePreference?: string | null;
};

export default function CreateCampaignModal({
  open,
  onClose,
  peerId,
  ownerLabel,
  peerName,
  onCreate,
  presentation = "default",
  localePreference,
}: CreateCampaignModalProps) {
  const formId = useId();
  const isV17 = presentation === "v17";
  const v17Copy = getV17CreateCampaignCopy(localePreference);
  const [values, setValues] = useState<CreateCampaignFormValues>(createEmptyCreateCampaignForm);
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
      setValues(createEmptyCreateCampaignForm());
      setFieldErrors({});
      onClose();
    } catch {
      setSubmitError(isV17 ? v17Copy.submitError : "We could not create this campaign. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketingVisionModal
      open={open}
      onClose={handleClose}
      title={isV17 ? v17Copy.title : "Create campaign"}
      subtitle={
        isV17 ? v17Copy.subtitle(peerName) : `Set up a campaign for ${peerName}. No content will be generated yet.`
      }
      maxWidth={560}
      closeOnEscape={!submitting}
      closeOnOverlayClick={!submitting}
      presentation={isV17 ? "v17" : "default"}
      testId="create-campaign-modal"
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
          aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
          disabled={submitting}
        />
        {fieldErrors.name && (
          <p id={`${formId}-name-error`} className="mw-field-error" role="alert">
            {fieldErrors.name}
          </p>
        )}

        <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
          {isV17 ? v17Copy.primaryGoalLabel : "Primary goal"} <span aria-hidden="true">*</span>
        </p>
        <div className={isV17 ? "pg-v13-goal-grid" : "mw-platform-chips"} role="radiogroup" aria-label="Primary goal">
          {CREATE_CAMPAIGN_PRIMARY_GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={
                isV17
                  ? `pg-v13-goal-chip pg-focus-premium${values.primaryGoalId === goal.id ? " is-active" : ""}`
                  : `mw-platform-chip pg-focus-premium${values.primaryGoalId === goal.id ? " mw-platform-chip--active" : ""}`
              }
              aria-pressed={values.primaryGoalId === goal.id}
              disabled={submitting}
              onClick={() => setValues((v) => ({ ...v, primaryGoalId: goal.id }))}
            >
              {isV17 ? v17Copy.goalLabels[goal.id] : goal.label}
            </button>
          ))}
        </div>
        {fieldErrors.primaryGoalId && (
          <p className="mw-field-error" role="alert">
            {fieldErrors.primaryGoalId}
          </p>
        )}

        {values.primaryGoalId === "custom" && (
          <>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 12 }}>
              {isV17 ? v17Copy.customGoalLabel : "Custom goal"} <span aria-hidden="true">*</span>
            </p>
            <input
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              value={values.customGoalText}
              onChange={(e) => setValues((v) => ({ ...v, customGoalText: e.target.value }))}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.customGoalText)}
            />
            {fieldErrors.customGoalText && (
              <p className="mw-field-error" role="alert">
                {fieldErrors.customGoalText}
              </p>
            )}
          </>
        )}

        <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
          {isV17 ? v17Copy.descriptionLabel : "What do you want to achieve?"}{" "}
          <span aria-hidden="true">*</span>
        </p>
        <textarea
          className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          disabled={submitting}
          aria-required
          aria-invalid={Boolean(fieldErrors.description)}
        />
        {fieldErrors.description && (
          <p className="mw-field-error" role="alert">
            {fieldErrors.description}
          </p>
        )}

        <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"} style={{ marginTop: 16 }}>
          {isV17 ? v17Copy.audienceLabel : "Target audience"}{" "}
          {!isV17 ? (
            <span className="mw-modal-label-hint">(optional)</span>
          ) : (
            <span className="pg-v13-form-hint">({v17Copy.audienceHint})</span>
          )}
        </p>
        <input
          className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
          value={values.targetAudience}
          onChange={(e) => setValues((v) => ({ ...v, targetAudience: e.target.value }))}
          disabled={submitting}
        />

        <div className="pg-v13-form-row" style={{ marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"}>
              {isV17 ? v17Copy.startDateLabel : "Start date"}
            </p>
            <input
              type="date"
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"}>
              {isV17 ? v17Copy.endDateLabel : "Target end date"}
            </p>
            <input
              type="date"
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              value={values.endDate}
              onChange={(e) => setValues((v) => ({ ...v, endDate: e.target.value }))}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.endDate)}
            />
            {fieldErrors.endDate && (
              <p className="mw-field-error" role="alert">
                {fieldErrors.endDate}
              </p>
            )}
          </div>
        </div>

        <div className="pg-v13-form-row" style={{ marginTop: 16 }}>
          <div style={{ flex: 2 }}>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"}>
              {isV17 ? v17Copy.budgetLabel : "Budget"}
            </p>
            <input
              type="number"
              min={0}
              step="any"
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              value={values.budgetAmount}
              onChange={(e) => setValues((v) => ({ ...v, budgetAmount: e.target.value }))}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.budgetAmount)}
            />
            {fieldErrors.budgetAmount && (
              <p className="mw-field-error" role="alert">
                {fieldErrors.budgetAmount}
              </p>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p className={isV17 ? "pg-v13-form-label" : "mw-modal-label"}>
              {isV17 ? v17Copy.currencyLabel : "Currency"}
            </p>
            <input
              className={isV17 ? "pg-v13-form-input" : "mw-modal-input"}
              value={values.budgetCurrency}
              onChange={(e) => setValues((v) => ({ ...v, budgetCurrency: e.target.value }))}
              disabled={submitting}
            />
          </div>
        </div>

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

        {submitError && (
          <p className="mw-field-error" role="alert" style={{ marginTop: 12 }}>
            {submitError}
          </p>
        )}

        <div className={isV17 ? "pg-v13-form-actions" : undefined}>
          {isV17 ? (
            <button
              type="button"
              className="pg-v13-btn pg-v13-btn--ghost pg-focus-premium"
              onClick={handleClose}
              disabled={submitting}
            >
              {v17Copy.cancel}
            </button>
          ) : null}
          <button
            type="submit"
            className={
              isV17
                ? "pg-v13-btn pg-focus-premium"
                : "mw-btn-primary mw-btn-primary--full pg-focus-premium"
            }
            style={isV17 ? undefined : { marginTop: 20 }}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting
              ? isV17
                ? "Bezig…"
                : "Creating campaign…"
              : isV17
                ? v17Copy.submit
                : "Create campaign"}
          </button>
        </div>
      </form>
    </MarketingVisionModal>
  );
}
