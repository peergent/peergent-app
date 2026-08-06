"use client";

import { useEffect, useRef } from "react";
import ExecutiveCampaignBriefingPanel from "@/features/marketing-workspace/components/ExecutiveCampaignBriefingPanel";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";

export type OfficeExecutiveBriefingInspectorProps = {
  open: boolean;
  briefing: ExecutiveCampaignBriefing;
  locale: "nl" | "en";
  onClose: () => void;
  onWorkflowStepOpen?: (stepId: CampaignWorkflowStepId) => void;
};

export default function OfficeExecutiveBriefingInspector({
  open,
  briefing,
  locale,
  onClose,
  onWorkflowStepOpen,
}: OfficeExecutiveBriefingInspectorProps) {
  const nl = locale === "nl";
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4"
      role="presentation"
      data-testid="office-executive-briefing-inspector-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="office-briefing-inspector-title"
        className="flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] shadow-xl sm:rounded-[var(--pg-radius-md)]"
        data-testid="office-executive-briefing-inspector"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[var(--pg-v13-line-soft)] px-5 py-4">
          <div>
            <p className="pg-v13-eyebrow m-0">{nl ? "Detailweergave" : "Detailed view"}</p>
            <h2 id="office-briefing-inspector-title" className="mt-1 text-[17px] font-semibold text-[var(--pg-v13-ink)]">
              {nl ? "Volledige campagne-analyse" : "Full campaign analysis"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="pg-v13-btn pg-v13-btn--ghost text-[13px]"
            data-testid="office-briefing-inspector-close"
            onClick={onClose}
          >
            {nl ? "Sluiten" : "Close"}
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <ExecutiveCampaignBriefingPanel
            briefing={briefing}
            appearance="office"
            locale={locale}
            onWorkflowStepOpen={onWorkflowStepOpen}
            buildStepHref={(stepId) => `#evidence-${stepId}`}
          />
        </div>
      </div>
    </div>
  );
}
