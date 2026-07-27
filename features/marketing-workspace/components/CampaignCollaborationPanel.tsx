"use client";

import { useMemo, useState } from "react";
import type { CampaignArtifactCollaborationViewModel } from "@/lib/peer-experience/marketing/campaign-collaboration";
import MwModal from "./MwModal";

export type CampaignCollaborationPanelProps = {
  artifact: CampaignArtifactCollaborationViewModel;
  mode: "customer" | "admin";
};

type PanelTab = "history" | "timeline" | "compare" | "feedback";

export default function CampaignCollaborationPanel({
  artifact,
  mode,
}: CampaignCollaborationPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>("history");

  const compare = artifact.comparisonToPrevious;

  const tabButtons = useMemo(
    () =>
      [
        { id: "history" as const, label: "Version history" },
        { id: "timeline" as const, label: "Timeline" },
        ...(compare ? [{ id: "compare" as const, label: "Compare versions" }] : []),
        { id: "feedback" as const, label: "Feedback history" },
      ] as const,
    [compare]
  );

  return (
    <>
      <div className="mw-collab-links">
        {tabButtons.map((t) => (
          <button
            key={t.id}
            type="button"
            className="mw-section-link pg-focus-premium mw-collab-link-btn"
            onClick={() => {
              setTab(t.id);
              setOpen(true);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MwModal
        open={open}
        onClose={() => setOpen(false)}
        title={artifact.title}
        subtitle={`${artifact.artifactTypeLabel} · Version ${artifact.currentVersion}`}
        maxWidth={640}
      >
        <div className="mw-collab-tabs" role="tablist" aria-label="Collaboration views">
          {tabButtons.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "mw-collab-tab is-active" : "mw-collab-tab"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mw-modal-body mw-collab-panel-body">
          {tab === "history" ? (
            <ul className="mw-collab-version-list">
              {artifact.versionHistory.entries.map((entry) => (
                <li key={entry.version} className="mw-collab-version-item">
                  <p className="mw-collab-version-title">
                    Version {entry.version}
                    {entry.isCurrent ? " · Current" : ""}
                  </p>
                  <p className="mw-kn-helper">{entry.customerStatusLabel}</p>
                  {mode === "admin" && entry.decisionId ? (
                    <p className="mw-kn-helper">Decision {entry.decisionId}</p>
                  ) : null}
                  {entry.decidedAt ? (
                    <p className="mw-kn-helper">
                      {mode === "admin" ? entry.decidedAt : formatCustomerDate(entry.decidedAt)}
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
                    <p className="mw-kn-helper">{formatCustomerDate(entry.at)}</p>
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
                        <p className="mw-kn-helper">Previous</p>
                        <p className="mw-collab-compare-old">{section.oldValue}</p>
                      </>
                    ) : null}
                    {section.newValue ? (
                      <>
                        <p className="mw-kn-helper">Current</p>
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
                <li className="mw-kn-helper">No customer feedback recorded yet.</li>
              ) : (
                artifact.feedbackHistory.entries.map((entry) => (
                  <li key={entry.decisionId} className="mw-collab-feedback-item">
                    <p className="mw-collab-version-title">
                      Version {entry.version} · {entry.customerLabel}
                    </p>
                    {entry.feedbackLines.length > 0 ? (
                      <ul>
                        {entry.feedbackLines.map((line) => (
                          <li key={line}>✓ {line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mw-kn-helper">No additional notes.</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </MwModal>
    </>
  );
}

function formatCustomerDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
