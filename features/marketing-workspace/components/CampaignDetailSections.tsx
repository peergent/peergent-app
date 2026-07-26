"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import type { MarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/marketing-campaign-types";
import type { MarketingProjectTimelineEntry } from "@/lib/peer-experience/marketing/projects/types";
import {
  countDeliverableApprovalStates,
  presentCampaignConciseGoal,
  presentCampaignProgressLabel,
} from "../lib/campaign-detail-presenter";

export type CampaignDetailSectionsProps = {
  campaign: MarketingCampaignDetailViewModel;
  projectActivity?: readonly MarketingProjectTimelineEntry[];
};

function statusChipClass(statusLabel: string): string {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("block")) return "mw-project-status mw-project-status--blocked";
  if (lower.includes("plan")) return "mw-project-status mw-project-status--planning";
  return "mw-project-status";
}

export default function CampaignDetailSections({
  campaign,
  projectActivity,
}: CampaignDetailSectionsProps) {
  const progressLabel = presentCampaignProgressLabel(campaign);
  const goalLine = presentCampaignConciseGoal(campaign);
  const approvalCounts = countDeliverableApprovalStates(campaign.linkedContent);
  const activityEntries =
    projectActivity && projectActivity.length > 0
      ? projectActivity.map((entry) => ({
          id: entry.id,
          label: entry.label,
          at: entry.at,
        }))
      : campaign.activitySummary;

  return (
    <section
      className="mw-section mw-campaign-detail"
      data-testid="mw-campaign-detail"
      style={{ animationDelay: "0.02s", marginBottom: 24 }}
    >
      <div className="mw-section-head">
        <div className="mw-section-title">
          <Flag size={15} aria-hidden />
          Campaign
        </div>
      </div>

      <div className="mw-glass mw-detail-hero" style={{ padding: 18, marginBottom: 16 }}>
        <div className="mw-project-head">
          <div>
            <h2 className="mw-detail-title" style={{ fontSize: "1.35rem" }}>
              {campaign.title}
            </h2>
            <div className={statusChipClass(campaign.statusLabel)} style={{ marginTop: 8 }}>
              {campaign.statusLabel}
            </div>
          </div>
          <div className="mw-project-pct">{progressLabel}</div>
        </div>
        {campaign.progressKnown && (
          <div className="mw-project-track" style={{ marginTop: 14 }}>
            <div
              className="mw-project-fill"
              style={{ width: `${Math.min(100, Math.max(0, campaign.progress))}%` }}
            />
          </div>
        )}
        {goalLine && <p className="mw-kn-helper" style={{ marginTop: 12 }}>{goalLine}</p>}
        <p className="mw-campaign-next" style={{ marginTop: 12 }}>
          Next action:{" "}
          <Link href={campaign.nextAction.href} className="mw-section-link">
            {campaign.nextAction.label}
          </Link>
        </p>
      </div>

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Overview
        </div>
        <ul className="mw-campaign-meta">
          {campaign.audience.targetAudience.trim() && (
            <li>Audience: {campaign.audience.targetAudience.trim()}</li>
          )}
          {campaign.channels.length > 0 && (
            <li>Channels: {campaign.channels.join(", ")}</li>
          )}
          {campaign.timeline.summary.trim() && (
            <li>Timeline: {campaign.timeline.summary}</li>
          )}
          <li>Approvals: {campaign.approvalModeLabel}</li>
          {campaign.budgetSummary && <li>Budget: {campaign.budgetSummary}</li>}
        </ul>
        {!campaign.audience.targetAudience.trim() &&
          campaign.channels.length === 0 &&
          !campaign.budgetSummary && (
            <p className="mw-empty-inline">Campaign details will appear as planning progresses.</p>
          )}
      </div>

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Deliverables
        </div>
        <p className="mw-kn-helper">{campaign.deliverableSummary}</p>
        {campaign.linkedContent.length === 0 ? (
          <p className="mw-empty-inline" style={{ marginTop: 8 }}>
            No deliverables yet.
          </p>
        ) : (
          <ul className="mw-detail-links" style={{ marginTop: 10 }}>
            {campaign.linkedContent.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="mw-section-link">
                  {item.title} · {item.channelLabel} · {item.statusLabel}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Approvals
        </div>
        {campaign.approvalQueue.pendingCount > 0 ? (
          <>
            <p className="mw-kn-helper">
              Waiting for approval: {campaign.approvalQueue.pendingCount}
            </p>
            {(approvalCounts.approved > 0 || approvalCounts.rejected > 0) && (
              <p className="mw-kn-helper" style={{ marginTop: 6 }}>
                {approvalCounts.approved > 0 && `Approved: ${approvalCounts.approved}`}
                {approvalCounts.approved > 0 && approvalCounts.rejected > 0 && " · "}
                {approvalCounts.rejected > 0 && `Declined: ${approvalCounts.rejected}`}
              </p>
            )}
            <Link
              href={campaign.approvalQueue.reviewHref}
              className="mw-btn-primary pg-focus-premium"
              style={{ marginTop: 12, display: "inline-block" }}
            >
              Review approvals
            </Link>
          </>
        ) : (
          <p className="mw-empty-inline">No items waiting for approval.</p>
        )}
      </div>

      {campaign.workforce.length > 0 && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            Workforce activity
          </div>
          <ul className="mw-resp-list">
            {campaign.workforce.map((worker, index) => (
              <li key={`${worker.roleLabel}-${index}`} className="mw-resp-row">
                <p className="mw-approval-title">{worker.roleLabel}</p>
                <p className="mw-kn-helper">
                  {worker.statusLabel}
                  {worker.responsibility.trim() ? ` · ${worker.responsibility.trim()}` : ""}
                  {worker.completionKnown
                    ? ` · Progress: ${worker.completion}%`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Performance
        </div>
        {campaign.performance.performanceKnown ? (
          <>
            <p className="mw-kn-helper">{campaign.performance.summary}</p>
            <Link href={campaign.performance.performanceHref} className="mw-section-link">
              View performance →
            </Link>
          </>
        ) : (
          <p className="mw-empty-inline">Performance not available yet.</p>
        )}
      </div>

      {campaign.recommendations.length > 0 && (
        <div className="mw-section mw-glass" style={{ padding: 16, marginBottom: 12 }}>
          <div className="mw-section-title" style={{ marginBottom: 10 }}>
            Recommendations
          </div>
          <ul className="mw-detail-links">
            {campaign.recommendations.map((rec) => (
              <li key={rec.id}>{rec.summary}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mw-section mw-glass" style={{ padding: 16 }}>
        <div className="mw-section-title" style={{ marginBottom: 10 }}>
          Activity
        </div>
        {activityEntries.length === 0 ? (
          <p className="mw-empty-inline">No activity yet.</p>
        ) : (
          <div className="mw-timeline">
            {activityEntries.map((entry) => (
              <div key={entry.id} className="mw-tl-row">
                <div className="mw-tl-dot" aria-hidden />
                <div>
                  <div className="mw-tl-text">{entry.label}</div>
                  {entry.at && (
                    <div className="mw-tl-time">
                      {new Date(entry.at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
