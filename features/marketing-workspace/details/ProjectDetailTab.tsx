"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import { isMarketingCampaignWorkspaceEnabled } from "@/lib/peer-experience/marketing/marketing-workspace-feature-flags";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import { buildMarketingProjectDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-project-detail-view-model";
import {
  getContentHref,
  getProjectHref,
  getProjectReviewHref,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  buildProjectCardSteps,
  remainingProjectSteps,
} from "../lib/build-project-card-steps";
import CampaignDetailSections from "../components/CampaignDetailSections";

export type ProjectDetailTabProps = {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
};

export default function ProjectDetailTab({
  peerId,
  projectId,
  domainInput,
}: ProjectDetailTabProps) {
  const searchParams = useSearchParams();
  const campaignsEnabled = isMarketingCampaignWorkspaceEnabled();
  const vm = buildMarketingProjectDetailViewModel({ ...domainInput, projectId });

  const campaignDetail = useMemo(() => {
    if (!campaignsEnabled || !vm) return null;
    const source = buildMarketingCampaignDetailSourceFromDomainInput(domainInput, projectId);
    return buildMarketingCampaignDetailViewModel(source);
  }, [campaignsEnabled, domainInput, projectId, vm]);

  if (!vm) {
    return (
      <section className="mw-section">
        <p className="mw-empty-inline">This project could not be found.</p>
        <Link href={getProjectHref(peerId)} className="mw-section-link" style={{ marginTop: 12 }}>
          ← Back to Projects
        </Link>
      </section>
    );
  }

  const { experience: exp } = vm;
  const deliverableId = searchParams.get("deliverableId") ?? searchParams.get("draft");
  const steps = buildProjectCardSteps(projectId, domainInput.workUnits);
  const remaining = remainingProjectSteps(steps);
  const sidebar = exp.sidebar;

  return (
    <>
      <Link href={getProjectHref(peerId)} className="mw-detail-back pg-focus-premium">
        ← Projects
      </Link>

      {campaignDetail ? (
        <CampaignDetailSections
          campaign={campaignDetail}
          projectActivity={vm.timeline}
        />
      ) : null}

      <section className="mw-section mw-glass mw-detail-hero" style={{ animationDelay: "0.03s" }}>
        <div className="mw-project-head">
          <div>
            <p className="mw-detail-eyebrow">{exp.hero.phaseLabel}</p>
            <h1 className="mw-detail-title">{exp.hero.title}</h1>
            <p className="mw-kn-helper">{exp.hero.goal}</p>
          </div>
          <div className="mw-project-pct">{exp.hero.progress}%</div>
        </div>
        <div className="mw-project-track" style={{ marginTop: 14 }}>
          <div className="mw-project-fill" style={{ width: `${exp.hero.progress}%` }} />
        </div>
        <div className="mw-detail-meta-row">
          <span className="mw-live-dot" aria-hidden />
          <span>{exp.hero.statusLabel}</span>
          {sidebar.responsibilityTitle && sidebar.responsibilityHref && (
            <>
              <span>·</span>
              <Link href={sidebar.responsibilityHref} className="mw-section-link">
                {sidebar.responsibilityTitle}
              </Link>
            </>
          )}
        </div>
        {exp.hero.heroMessage && (
          <p className="mw-detail-lead">{exp.hero.heroMessage}</p>
        )}
        {exp.hero.primaryCta && (
          <Link
            href={exp.hero.primaryCta.href}
            className="mw-btn-primary pg-focus-premium"
            style={{ marginTop: 14 }}
            id="reviews"
          >
            {exp.hero.primaryCta.label}
          </Link>
        )}
        {deliverableId && (
          <p className="mw-kn-helper" style={{ marginTop: 8 }}>
            Open the review flow to approve, edit, and schedule this deliverable.
          </p>
        )}
      </section>

      <section className="mw-section" style={{ animationDelay: "0.06s" }}>
        <div className="mw-section-title" style={{ marginBottom: 12 }}>
          Phases
        </div>
        <nav className="mw-detail-phases" aria-label="Project phases">
          {exp.phases.map((phase) => (
            <div
              key={phase.id}
              className={`mw-detail-phase${phase.complete ? " mw-detail-phase--done" : ""}${phase.current ? " mw-detail-phase--current" : ""}`}
            >
              <span className="mw-step-mark">{phase.complete ? "✓" : phase.current ? "→" : "·"}</span>
              {phase.label}
            </div>
          ))}
        </nav>
      </section>

      <div className="mw-detail-layout">
        <div className="mw-detail-main">
          <section className="mw-section" style={{ animationDelay: "0.08s" }}>
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              What happens next
            </div>
            <div className="mw-glass" style={{ padding: 16 }}>
              <p className="mw-approval-title">{exp.nextStep.label}</p>
              {exp.nextStep.blockerReason && (
                <p className="mw-kn-helper" style={{ marginTop: 8 }}>
                  Blocker: {exp.nextStep.blockerReason}
                </p>
              )}
            </div>
          </section>

          <section className="mw-section" style={{ animationDelay: "0.1s" }}>
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              WorkUnits
            </div>
            <div className="mw-glass mw-project-steps" style={{ padding: 14 }}>
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`mw-step${step.state === "done" ? " mw-step--done" : ""}${step.state === "current" ? " mw-step--current" : ""}`}
                >
                  <span className="mw-step-mark">
                    {step.state === "done" ? "✓" : step.state === "current" ? "→" : "·"}
                  </span>
                  {step.label}
                </div>
              ))}
              <p className="mw-project-remaining" style={{ marginTop: 10 }}>
                {remaining <= 1 ? "1 step left" : `${remaining} steps left`}
              </p>
            </div>
          </section>

          {exp.publishing && (
            <section className="mw-section mw-glass" style={{ padding: 18, animationDelay: "0.12s" }} id="publishing">
              <div className="mw-section-title" style={{ marginBottom: 8 }}>
                Publishing {exp.publishing.scheduledDateLabel}
              </div>
              <p className="mw-kn-helper">{exp.publishing.message}</p>
            </section>
          )}

          {exp.monitoring && (
            <section className="mw-section mw-glass" style={{ padding: 18 }} id="monitoring">
              <div className="mw-section-title" style={{ marginBottom: 8 }}>
                Results & monitoring
              </div>
              <p className="mw-kn-helper">{exp.monitoring.message}</p>
              {exp.monitoring.dataUnavailableReason && (
                <p className="mw-empty-inline" style={{ marginTop: 8 }}>
                  {exp.monitoring.dataUnavailableReason}
                </p>
              )}
            </section>
          )}

          {exp.learning && (
            <section className="mw-section mw-glass" style={{ padding: 18 }} id="insights">
              <div className="mw-section-title" style={{ marginBottom: 8 }}>
                Learning
              </div>
              <p className="mw-kn-helper">{exp.learning.summary}</p>
            </section>
          )}

          {exp.questions.length > 0 && (
            <section className="mw-section" id="questions">
              <div className="mw-section-title" style={{ marginBottom: 10 }}>
                {domainInput.peerName} has a question
              </div>
              <ul className="mw-resp-list">
                {exp.questions.map((q) => (
                  <li key={q.id} className="mw-glass mw-resp-row">
                    <p className="mw-approval-title">{q.prompt}</p>
                    {q.context && <p className="mw-kn-helper">{q.context}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mw-section" style={{ animationDelay: "0.14s" }} id="timeline">
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              Activity
            </div>
            {exp.timeline.length === 0 ? (
              <p className="mw-empty-inline">{exp.emptyStates.timeline}</p>
            ) : (
              <div className="mw-glass mw-timeline">
                {exp.timeline.map((entry) => (
                  <div key={entry.id} className="mw-tl-row">
                    <div className="mw-tl-dot" aria-hidden />
                    <div>
                      <div className="mw-tl-text">{entry.message}</div>
                      <div className="mw-tl-time">{entry.timeLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mw-section" id="content">
            <div className="mw-section-head">
              <div className="mw-section-title">
                <Megaphone size={15} aria-hidden />
                Generated content
              </div>
            </div>
            {vm.contentItems.length === 0 ? (
              <p className="mw-empty-inline">{exp.emptyStates.content}</p>
            ) : (
              <div className="mw-content-grid">
                {vm.contentItems.map((item) => (
                  <Link
                    key={item.id}
                    href={getContentHref(peerId, item.draftId)}
                    className="mw-glass mw-content-card pg-focus-premium"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="mw-content-body">
                      <div className="mw-content-platform">{item.channel}</div>
                      <div className="mw-content-snippet">{item.title}</div>
                      <div className="mw-kn-helper">{item.status.replace(/_/g, " ")}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {vm.reviewDeliverableIds.length > 0 && !exp.hero.primaryCta && (
            <section className="mw-section" id="reviews-alt">
              <div className="mw-section-title" style={{ marginBottom: 10 }}>
                Decisions
              </div>
              <div className="mw-glass mw-approvals">
                {vm.reviewDeliverableIds.map((id) => (
                  <Link
                    key={id}
                    href={getProjectReviewHref(peerId, projectId, id)}
                    className="mw-approval-row pg-focus-premium"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="mw-approval-body">
                      <div className="mw-approval-title">Review deliverable</div>
                      <div className="mw-approval-reason">Needs your decision</div>
                    </div>
                    <span className="mw-btn-review">Review</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mw-detail-aside">
          <section className="mw-section mw-glass" style={{ padding: 18 }}>
            <div className="mw-section-title" style={{ marginBottom: 12 }}>
              Project details
            </div>
            <dl className="mw-detail-dl">
              <div>
                <dt>Owner</dt>
                <dd>{vm.ownerLabel}</dd>
              </div>
              <div>
                <dt>Campaign type</dt>
                <dd>{vm.campaignTypeLabel}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(vm.createdAt).toLocaleDateString()}</dd>
              </div>
              {sidebar.originLabel && (
                <div>
                  <dt>Origin</dt>
                  <dd>{sidebar.originLabel}</dd>
                </div>
              )}
            </dl>
            {sidebar.relatedContent.length > 0 && (
              <>
                <div className="mw-modal-label" style={{ marginTop: 16 }}>
                  Related content
                </div>
                <ul className="mw-detail-links">
                  {sidebar.relatedContent.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="mw-section-link">
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Link href={vm.performanceHref} className="mw-section-link" style={{ marginTop: 14 }}>
              View performance →
            </Link>
          </section>

          {exp.conversation.length > 0 && (
            <section className="mw-section mw-glass" style={{ padding: 18 }}>
              <div className="mw-section-title" style={{ marginBottom: 10 }}>
                {domainInput.peerName}&apos;s workday
              </div>
              <div className="mw-timeline">
                {exp.conversation.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="mw-tl-row">
                    <div className="mw-tl-dot" aria-hidden />
                    <div>
                      <div className="mw-tl-text">&ldquo;{entry.message}&rdquo;</div>
                      <div className="mw-tl-time">{entry.timeLabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
