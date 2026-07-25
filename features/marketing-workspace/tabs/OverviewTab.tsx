"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Megaphone,
} from "lucide-react";
import { buildMarketingOverviewViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-overview-view-model";
import { buildMarketingProjectsViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-projects-view-model";
import { buildAllMarketingApprovalQueue } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { getReviewHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";

export type OverviewTabProps = {
  domainInput: MarketingPeerDomainInput;
  onDismissInsight?: (id: string) => void;
};

type ResultsPeriod = "day" | "week" | "month";

const PERIOD_LABELS: Record<ResultsPeriod, string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

function metricById(
  metrics: ReturnType<typeof buildMarketingOverviewViewModel>["results"]["metrics"],
  id: string
) {
  return metrics.find((m) => m.id === id);
}

function formatMetricValue(
  metric: ReturnType<typeof buildMarketingOverviewViewModel>["results"]["metrics"][number] | undefined
): string {
  if (!metric) return "—";
  if (metric.status === "setup_required") return "—";
  return String(metric.value);
}

export default function OverviewTab({ domainInput, onDismissInsight }: OverviewTabProps) {
  const vm = useMemo(() => buildMarketingOverviewViewModel(domainInput), [domainInput]);
  const projectsVm = useMemo(
    () => buildMarketingProjectsViewModel({ ...domainInput, filter: "active" }),
    [domainInput]
  );
  const [period, setPeriod] = useState<ResultsPeriod>("month");
  const pendingCount = useMemo(
    () => buildAllMarketingApprovalQueue(domainInput).length,
    [domainInput]
  );

  const revenueMetric = metricById(vm.results.metrics, "revenue");
  const leadsMetric = metricById(vm.results.metrics, "leads");
  const roiMetric = metricById(vm.results.metrics, "roi");
  const campaignCount = projectsVm.items.length;

  const revenueDisplay = formatMetricValue(revenueMetric);
  const leadsDisplay = formatMetricValue(leadsMetric);
  const roiDisplay = formatMetricValue(roiMetric);

  const impactAvailable =
    revenueMetric?.status === "live" ||
    leadsMetric?.status === "live" ||
    roiMetric?.status === "live";

  const tips = vm.brain.insights.slice(0, 3);

  return (
    <>
      <section className="mw-section mw-glass mw-impact" style={{ animationDelay: "0.14s" }}>
        <div className="mw-impact-eyebrow">
          Revenue influenced — {PERIOD_LABELS.month}
          {impactAvailable && roiMetric?.status === "live" ? (
            <span className="mw-impact-trend">Live</span>
          ) : null}
        </div>
        <div className="mw-impact-number">{revenueDisplay}</div>
        <p className="mw-impact-story">
          {impactAvailable ? (
            <>
              Generated through <strong>{campaignCount} campaigns</strong> and{" "}
              <strong>{leadsDisplay} leads</strong>
              {roiDisplay !== "—" ? (
                <>
                  , at an average of <strong>{roiDisplay} ROAS</strong>
                </>
              ) : null}
              .
            </>
          ) : (
            <>
              Connect analytics and CRM to see revenue attribution. Campaign and lead counts still
              reflect {domainInput.peerName}&apos;s active work.
            </>
          )}
        </p>
        <div className="mw-impact-chips">
          <div className="mw-impact-chip">
            <div className="amt">{leadsDisplay}</div>
            <div className="lbl">Leads generated</div>
          </div>
          <div className="mw-impact-chip">
            <div className="amt">{campaignCount}</div>
            <div className="lbl">Campaigns optimized</div>
          </div>
          <div className="mw-impact-chip">
            <div className="amt">{roiDisplay === "—" ? "—" : `${roiDisplay}`}</div>
            <div className="lbl">Avg. ROAS</div>
          </div>
        </div>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.17s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">Worth knowing</div>
        </div>
        {tips.length === 0 ? (
          <p className="mw-empty-inline">{vm.brain.emptyMessage}</p>
        ) : (
          <div className="mw-tips-row">
            {tips.map((tip) => (
              <div key={tip.id} className="mw-tip-card">
                <span className="mw-tip-icon" aria-hidden>
                  ✦
                </span>
                <p className="mw-tip-text">{tip.observation}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.2s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <BarChart3 size={15} aria-hidden />
            Results <span>{PERIOD_LABELS[period]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="mw-segmented" role="group" aria-label="Results period">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={period === p ? "mw-segmented--active" : undefined}
                  onClick={() => setPeriod(p)}
                  aria-pressed={period === p}
                >
                  {p === "day" ? "Day" : p === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>
            <Link href={vm.results.performanceHref} className="mw-section-link">
              {vm.results.performanceCtaLabel}
            </Link>
          </div>
        </div>
        {period !== "month" && (
          <p className="mw-empty-inline" style={{ marginBottom: 12 }}>
            Day and week breakdowns need connected analytics. Showing month-to-date values.
          </p>
        )}
        <div className="mw-results-grid">
          {vm.results.metrics.map((metric) => (
            <div key={metric.id} className="mw-glass mw-result-card">
              <div className="mw-result-title">{metric.label}</div>
              <div className="mw-result-value">{formatMetricValue(metric)}</div>
              <div className="mw-result-caption">
                {metric.estimatedNote ?? metric.setupMessage ?? metric.sourceLabel ?? " "}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mw-section" style={{ animationDelay: "0.26s" }}>
        <div className="mw-section-head">
          <div className="mw-section-title">
            <Megaphone size={15} aria-hidden />
            Active campaigns
          </div>
          <Link href={projectsVm.items[0]?.href ?? `/team/${domainInput.peerId}/work`} className="mw-section-link">
            View all
          </Link>
        </div>
        {projectsVm.items.length === 0 ? (
          <p className="mw-empty-inline">{projectsVm.emptyMessage}</p>
        ) : (
          <div className="mw-glass mw-campaigns">
            {projectsVm.items.slice(0, 4).map((project) => (
              <Link key={project.id} href={project.href} className="mw-campaign-row pg-focus-premium">
                <div style={{ flex: 1.6, minWidth: 0 }}>
                  <div className="mw-approval-title">{project.title}</div>
                  <div className="mw-approval-reason">
                    {project.nextStep ?? project.startedLabel}
                  </div>
                </div>
                <div style={{ flex: 0.55 }}>
                  <span className="mw-count-badge">{project.statusLabel}</span>
                </div>
                <div style={{ flex: 0.5, textAlign: "right" }}>
                  <div className="mw-result-value" style={{ fontSize: 13 }}>
                    {project.progress}%
                  </div>
                  <div className="mw-result-caption">Progress</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mw-grid-2">
        <section className="mw-section" style={{ animationDelay: "0.32s" }}>
          <div className="mw-section-head">
            <div className="mw-section-title">
              <AlertTriangle size={15} aria-hidden />
              Needs your decision
            </div>
            {pendingCount > 0 && <span className="mw-count-badge">{pendingCount}</span>}
          </div>
          {vm.attention.items.length === 0 ? (
            <p className="mw-empty-inline">{vm.attention.emptyMessage}</p>
          ) : (
            <div className="mw-glass mw-approvals">
              {vm.attention.items.map((item) => (
                <div key={item.id} className="mw-approval-row">
                  <div className="mw-approval-body">
                    <div className="mw-approval-title">{item.title}</div>
                    <div className="mw-approval-reason">{item.attentionReason}</div>
                  </div>
                  <div className="mw-approval-actions">
                    <Link href={item.reviewHref} className="mw-btn-review pg-focus-premium">
                      Review
                    </Link>
                    <Link href={item.reviewHref} className="mw-btn-approve pg-focus-premium">
                      Approve
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingCount > vm.attention.items.length && (
            <Link
              href={getReviewHref(domainInput.peerId)}
              className="mw-section-link"
              style={{ marginTop: 10, display: "inline-block" }}
            >
              View all {pendingCount} decisions →
            </Link>
          )}
        </section>

        <section className="mw-section" style={{ animationDelay: "0.38s" }}>
          <div className="mw-section-head">
            <div className="mw-section-title">
              <Clock size={15} aria-hidden />
              Activity
            </div>
          </div>
          {vm.activity.items.length === 0 ? (
            <p className="mw-empty-inline">{vm.activity.emptyMessage}</p>
          ) : (
            <div className="mw-glass mw-timeline">
              {vm.activity.items.slice(0, 3).map((item) => (
                <div key={item.id} className="mw-tl-row">
                  <div className="mw-tl-dot" aria-hidden />
                  <div>
                    <div className="mw-tl-text">{item.summary ?? item.title}</div>
                    <div className="mw-tl-time">{item.timeLabel || formatRelativeTime(item.occurredAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
