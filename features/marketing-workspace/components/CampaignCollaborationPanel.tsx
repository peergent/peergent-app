"use client";

import { useId, useMemo, useState } from "react";
import type { CampaignArtifactCollaborationViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration";
import type { MarketingCampaignCopy } from "@/lib/i18n/marketing-campaign-copy";
import { formatMarketingRelativeTime } from "@/lib/i18n/marketing-campaign-copy";
import MwModal from "./MwModal";

export type CampaignCollaborationPanelProps = {
  artifact: CampaignArtifactCollaborationViewModel;
  mode: "customer" | "admin";
  copy: MarketingCampaignCopy;
  /** Customer review/campaign surfaces use collapsed disclosure; admin may use inline tabs. */
  variant?: "disclosure" | "admin-inline";
};

type PanelTab = "history" | "timeline" | "compare" | "feedback";

export function CampaignCollaborationContent({
  artifact,
  mode,
  copy,
  tab,
  onTabChange,
}: {
  artifact: CampaignArtifactCollaborationViewModel;
  mode: "customer" | "admin";
  copy: MarketingCampaignCopy;
  tab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
}) {
  const compare = artifact.comparisonToPrevious;
  const tabButtons = useMemo(
    () =>
      [
        { id: "history" as const, label: copy.versionHistory },
        { id: "timeline" as const, label: copy.timeline },
        ...(compare ? [{ id: "compare" as const, label: copy.compareVersions }] : []),
        { id: "feedback" as const, label: copy.feedbackHistory },
      ] as const,
    [compare, copy]
  );

  return (
    <>
      <div className="mw-collab-tabs" role="tablist" aria-label={copy.historyAndDetails}>
        {tabButtons.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "mw-collab-tab is-active" : "mw-collab-tab"}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mw-collab-panel-body">
        {tab === "history" ? (
          <ul className="mw-collab-version-list">
            {artifact.versionHistory.entries.map((entry) => (
              <li key={entry.version} className="mw-collab-version-item">
                <p className="mw-collab-version-title">
                  {copy.versionLabel(entry.version)}
                  {entry.isCurrent ? ` · ${copy.currentLabel}` : ""}
                </p>
                <p className="mw-kn-helper">{entry.customerStatusLabel}</p>
                {mode === "admin" && entry.decisionId ? (
                  <p className="mw-kn-helper">Decision {entry.decisionId}</p>
                ) : null}
                {entry.decidedAt ? (
                  <p className="mw-kn-helper">
                    {mode === "admin"
                      ? entry.decidedAt
                      : formatMarketingRelativeTime(entry.decidedAt, copy)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "timeline" ? (
          <ol className="mw-collab-timeline">
            {artifact.timeline.entries.map((entry) => (
              <li key={entry.id} className="mw-collab-timeline-item">
                <p className="mw-collab-timeline-label">
                  {mode === "admin" ? entry.adminLabel : entry.customerLabel}
                </p>
                {mode === "admin" ? (
                  <p className="mw-kn-helper">
                    {entry.at}
                    {entry.version != null ? ` · v${entry.version}` : ""}
                  </p>
                ) : (
                  <p className="mw-kn-helper">{formatMarketingRelativeTime(entry.at, copy)}</p>
                )}
              </li>
            ))}
          </ol>
        ) : null}

        {tab === "compare" && compare ? (
          <div className="mw-collab-compare">
            <p className="mw-kn-helper">{compare.summary}</p>
            {artifact.revisionSummary ? (
              <div className="mw-collab-revision-summary">
                <p className="mw-modal-label">{artifact.revisionSummary.headline}</p>
                <ul>
                  {artifact.revisionSummary.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {compare.sections.map((section) =>
              section.change === "unchanged" && mode === "customer" ? null : (
                <div key={section.id} className="mw-collab-compare-section">
                  <p className="mw-modal-label">
                    {section.label}{" "}
                    <span className="mw-collab-change-badge">{section.change}</span>
                  </p>
                  {section.oldValue ? (
                    <>
                      <p className="mw-kn-helper">{copy.previousLabel}</p>
                      <p className="mw-collab-compare-old">{section.oldValue}</p>
                    </>
                  ) : null}
                  {section.newValue ? (
                    <>
                      <p className="mw-kn-helper">{copy.currentLabel}</p>
                      <p className="mw-collab-compare-new">{section.newValue}</p>
                    </>
                  ) : null}
                </div>
              )
            )}
          </div>
        ) : null}

        {tab === "feedback" ? (
          <ul className="mw-collab-feedback-list">
            {artifact.feedbackHistory.entries.length === 0 ? (
              <li className="mw-kn-helper">{copy.noFeedbackYet}</li>
            ) : (
              artifact.feedbackHistory.entries.map((entry) => (
                <li key={entry.decisionId} className="mw-collab-feedback-item">
                  <p className="mw-collab-version-title">
                    {copy.versionLabel(entry.version)} · {entry.customerLabel}
                  </p>
                  {entry.feedbackLines.length > 0 ? (
                    <ul>
                      {entry.feedbackLines.map((line) => (
                        <li key={line}>✓ {line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mw-kn-helper">{copy.noFeedbackYet}</p>
                  )}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </>
  );
}

export default function CampaignCollaborationPanel({
  artifact,
  mode,
  copy,
  variant = "disclosure",
}: CampaignCollaborationPanelProps) {
  const [tab, setTab] = useState<PanelTab>("history");
  const detailsId = useId();

  if (variant === "admin-inline") {
    return (
      <CampaignCollaborationContent
        artifact={artifact}
        mode={mode}
        copy={copy}
        tab={tab}
        onTabChange={setTab}
      />
    );
  }

  return (
    <details className="mw-collab-disclosure pg-focus-premium" data-testid="mw-collab-disclosure">
      <summary className="mw-collab-disclosure-summary">{copy.historyAndDetails}</summary>
      <div className="mw-collab-disclosure-body" id={detailsId}>
        <CampaignCollaborationContent
          artifact={artifact}
          mode={mode}
          copy={copy}
          tab={tab}
          onTabChange={setTab}
        />
      </div>
    </details>
  );
}

/** Admin inspector may still use modal tabs for dense diagnostics. */
export function CampaignCollaborationAdminModal({
  artifact,
  copy,
  open,
  onClose,
}: {
  artifact: CampaignArtifactCollaborationViewModel;
  copy: MarketingCampaignCopy;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>("history");
  return (
    <MwModal
      open={open}
      onClose={onClose}
      title={artifact.title}
      subtitle={`${artifact.artifactTypeLabel} · ${copy.versionLabel(artifact.currentVersion)}`}
      maxWidth={640}
    >
      <CampaignCollaborationContent
        artifact={artifact}
        mode="admin"
        copy={copy}
        tab={tab}
        onTabChange={setTab}
      />
    </MwModal>
  );
}
