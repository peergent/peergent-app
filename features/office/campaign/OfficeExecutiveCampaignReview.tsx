"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { CampaignApprovalResult } from "@/lib/peer-experience/marketing/campaign-approval";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import { presentOfficeExecutiveBriefingSummary } from "@/lib/office/campaign/present-office-executive-briefing";
import OfficeExecutiveBriefingSummary from "./OfficeExecutiveBriefingSummary";
import OfficeExecutiveBriefingInspector from "./OfficeExecutiveBriefingInspector";

export type OfficeExecutiveCampaignReviewProps = {
  briefing: ExecutiveCampaignBriefing;
  pendingApproval: boolean;
  publicationUnlocked: boolean;
  projectId: string;
  locale?: string | null;
  onApproveCampaign?: (input: { projectId: string }) => Promise<CampaignApprovalResult>;
  onWorkflowStepOpen?: (stepId: CampaignWorkflowStepId) => void;
};

function OfficeBriefingApprovalButton({
  projectId,
  pendingApproval,
  publicationUnlocked,
  locale,
  onApproveCampaign,
}: {
  projectId: string;
  pendingApproval: boolean;
  publicationUnlocked: boolean;
  locale: "nl" | "en";
  onApproveCampaign?: (input: { projectId: string }) => Promise<CampaignApprovalResult>;
}) {
  const nl = locale === "nl";
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runApprove = useCallback(async () => {
    if (!onApproveCampaign || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setErrorMessage(null);
    try {
      const result = await onApproveCampaign({ projectId });
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      setStatusMessage(result.message);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, [onApproveCampaign, projectId]);

  if (!pendingApproval && publicationUnlocked) {
    return (
      <p className="w-full text-[13px] text-[var(--pg-v13-ink-soft)] sm:flex-1" role="status" data-testid="office-campaign-approved">
        {nl ? "Campagne goedgekeurd — Emma gaat verder." : "Campaign approved — Emma is continuing."}
      </p>
    );
  }

  if (!pendingApproval) return null;

  return (
    <div className="w-full sm:flex-1" data-testid="office-campaign-approval-actions">
      {statusMessage ? (
        <p className="mb-2 text-[13px] text-[var(--pg-v13-blue)]" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mb-2 text-[13px] text-[var(--pg-v13-attention)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="button"
        className="pg-v13-btn w-full sm:w-auto"
        disabled={pending || !onApproveCampaign}
        data-testid="office-approve-campaign-btn"
        onClick={() => void runApprove()}
      >
        {pending ? "…" : nl ? "Campagne goedkeuren" : "Approve Campaign"}
      </button>
    </div>
  );
}

export default function OfficeExecutiveCampaignReview({
  briefing,
  pendingApproval,
  publicationUnlocked,
  projectId,
  locale,
  onApproveCampaign,
  onWorkflowStepOpen,
}: OfficeExecutiveCampaignReviewProps) {
  const resolvedLocale = locale === "nl" ? "nl" : "en";
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const summaryModel = useMemo(
    () =>
      presentOfficeExecutiveBriefingSummary({
        briefing,
        locale: resolvedLocale,
        pendingApproval,
        publicationUnlocked,
      }),
    [briefing, pendingApproval, publicationUnlocked, resolvedLocale]
  );

  const handleToggleSection = useCallback((sectionId: string) => {
    setExpandedSection((current) => (current === sectionId ? null : sectionId));
  }, []);

  const handleWorkflowStepOpen = useCallback(
    (stepId: CampaignWorkflowStepId) => {
      setInspectorOpen(false);
      onWorkflowStepOpen?.(stepId);
    },
    [onWorkflowStepOpen]
  );

  return (
    <section className="pg-v13-sec mb-8" data-testid="office-executive-campaign-review">
      <OfficeExecutiveBriefingSummary
        model={summaryModel}
        locale={resolvedLocale}
        expandedSection={expandedSection}
        onToggleSection={handleToggleSection}
        onOpenInspector={() => setInspectorOpen(true)}
        approvalSlot={
          <OfficeBriefingApprovalButton
            projectId={projectId}
            pendingApproval={pendingApproval}
            publicationUnlocked={publicationUnlocked}
            locale={resolvedLocale}
            onApproveCampaign={onApproveCampaign}
          />
        }
      />
      <OfficeExecutiveBriefingInspector
        open={inspectorOpen}
        briefing={briefing}
        locale={resolvedLocale}
        onClose={() => setInspectorOpen(false)}
        onWorkflowStepOpen={handleWorkflowStepOpen}
      />
    </section>
  );
}
