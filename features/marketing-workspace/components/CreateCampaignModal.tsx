"use client";

import { useId, useState } from "react";
import type { CampaignApprovalMode } from "@/lib/campaign";
import MwModal from "./MwModal";
import {
  CREATE_CAMPAIGN_PRIMARY_GOALS,
  createCampaignFormHasErrors,
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
  validateCreateCampaignForm,
  type CreateCampaignFormValues,
} from "../lib/create-campaign-form";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";

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
};

export default function CreateCampaignModal({
  open,
  onClose,
  peerId,
  ownerLabel,
  peerName,
  onCreate,
}: CreateCampaignModalProps) {
  const formId = useId();
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
      setSubmitError("We could not create this campaign. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MwModal
      open={open}
      onClose={handleClose}
      title="Create campaign"
      subtitle={`Set up a campaign for ${peerName}. No content will be generated yet.`}
      maxWidth={560}
      closeOnEscape={!submitting}
      closeOnOverlayClick={!submitting}
    >
      <form id={formId} onSubmit={(e) => void handleSubmit(e)} className="mw-create-campaign-form">
        <p className="mw-modal-label">
          Campaign name <span aria-hidden="true">*</span>
        </p>
        <input
          className="mw-modal-input"
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

        <p className="mw-modal-label" style={{ marginTop: 16 }}>
          Primary goal <span aria-hidden="true">*</span>
        </p>
        <div className="mw-platform-chips" role="radiogroup" aria-label="Primary goal">
          {CREATE_CAMPAIGN_PRIMARY_GOALS.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={`mw-platform-chip pg-focus-premium${values.primaryGoalId === goal.id ? " mw-platform-chip--active" : ""}`}
              aria-pressed={values.primaryGoalId === goal.id}
              disabled={submitting}
              onClick={() => setValues((v) => ({ ...v, primaryGoalId: goal.id }))}
            >
              {goal.label}
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
            <p className="mw-modal-label" style={{ marginTop: 12 }}>
              Custom goal <span aria-hidden="true">*</span>
            </p>
            <input
              className="mw-modal-input"
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

        <p className="mw-modal-label" style={{ marginTop: 16 }}>
          What do you want to achieve? <span aria-hidden="true">*</span>
        </p>
        <textarea
          className="mw-modal-input"
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

        <p className="mw-modal-label" style={{ marginTop: 16 }}>
          Target audience <span className="mw-modal-label-hint">(optional)</span>
        </p>
        <input
          className="mw-modal-input"
          value={values.targetAudience}
          onChange={(e) => setValues((v) => ({ ...v, targetAudience: e.target.value }))}
          disabled={submitting}
        />

        <div className="mw-create-campaign-dates" style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <p className="mw-modal-label">Start date</p>
            <input
              type="date"
              className="mw-modal-input"
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
              disabled={submitting}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p className="mw-modal-label">Target end date</p>
            <input
              type="date"
              className="mw-modal-input"
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

        <div className="mw-create-campaign-budget" style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 2 }}>
            <p className="mw-modal-label">Budget</p>
            <input
              type="number"
              min={0}
              step="any"
              className="mw-modal-input"
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
            <p className="mw-modal-label">Currency</p>
            <input
              className="mw-modal-input"
              value={values.budgetCurrency}
              onChange={(e) => setValues((v) => ({ ...v, budgetCurrency: e.target.value }))}
              disabled={submitting}
            />
          </div>
        </div>

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

        {submitError && (
          <p className="mw-field-error" role="alert" style={{ marginTop: 12 }}>
            {submitError}
          </p>
        )}

        <button
          type="submit"
          className="mw-btn-primary mw-btn-primary--full pg-focus-premium"
          style={{ marginTop: 20 }}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Creating campaign…" : "Create campaign"}
        </button>
      </form>
    </MwModal>
  );
}
