"use client";

import PgVisionModal from "@/components/design-system/PgVisionModal";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import type { CampaignWorkflowStep } from "@/lib/office/campaign/workflow-types";
import CampaignWorkspaceCore from "./CampaignWorkspaceCore";

export type CampaignWorkspaceModalProps = {
  open: boolean;
  onClose: () => void;
  locale?: string | null;
  model: CampaignDetailViewModel;
  onApproveAll?: () => void;
  onStepClick?: (step: CampaignWorkflowStep) => void;
  onReviewDeliverable?: (draftId: string) => void;
};

export default function CampaignWorkspaceModal({
  open,
  onClose,
  locale,
  model,
  onApproveAll,
  onStepClick,
  onReviewDeliverable,
}: CampaignWorkspaceModalProps) {
  const nl = locale === "nl";

  return (
    <PgVisionModal open={open} onClose={onClose} size="workspace" testId="campaign-workspace-modal">
      <div className="border-b border-[var(--pg-v13-line-soft)] px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="pg-v13-mono text-[10px] tracking-[0.07em] text-[var(--pg-v13-ink-faint)] uppercase">
              {nl ? "Campagne" : "Campaign"}
            </p>
            <h3 className="mt-1 text-[21px] font-extrabold text-[var(--pg-v13-ink)]">{model.name}</h3>
            <p className="pg-v13-mono mt-2 flex items-center gap-2 text-[11px] font-bold text-[var(--pg-v13-attention)]">
              <span className="h-[7px] w-[7px] rounded-full bg-[var(--pg-v13-attention)]" />
              {model.statusLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] text-[var(--pg-v13-ink-soft)]"
            aria-label={nl ? "Sluiten" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-7 py-6">
        <CampaignWorkspaceCore
          model={model}
          locale={locale}
          variant="modal"
          onStepClick={onStepClick}
          onReviewDeliverable={onReviewDeliverable}
          onApproveAll={onApproveAll}
          onClose={onClose}
        />
      </div>
    </PgVisionModal>
  );
}
