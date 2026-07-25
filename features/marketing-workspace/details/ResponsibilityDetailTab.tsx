"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { buildMarketingResponsibilityDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-responsibility-detail-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

export type ResponsibilityDetailTabProps = {
  peerId: string;
  responsibilityId: string;
  domainInput: MarketingPeerDomainInput;
  onApprovePlan?: (responsibilityId: string) => void | Promise<void>;
  approving?: boolean;
};

export default function ResponsibilityDetailTab({
  peerId,
  responsibilityId,
  domainInput,
  onApprovePlan,
  approving,
}: ResponsibilityDetailTabProps) {
  const vm = buildMarketingResponsibilityDetailViewModel({
    ...domainInput,
    responsibilityId,
  });

  if (!vm) {
    return (
      <section className="mw-section">
        <p className="mw-empty-inline">This responsibility could not be found.</p>
        <Link href={`/team/${peerId}/responsibilities`} className="mw-section-link" style={{ marginTop: 12 }}>
          ← Back to Responsibilities
        </Link>
      </section>
    );
  }

  return (
    <>
      <Link href={vm.backHref} className="mw-detail-back pg-focus-premium">
        ← Responsibilities
      </Link>

      <section className="mw-section mw-glass mw-detail-hero" style={{ animationDelay: "0.03s" }}>
        <p className="mw-detail-eyebrow">{vm.enabled ? "Owned" : "Not owned"}</p>
        <h1 className="mw-detail-title">{vm.title}</h1>
        <p className="mw-kn-helper">{vm.description}</p>
        <div className="mw-detail-meta-row" style={{ marginTop: 10 }}>
          <span>{vm.healthLabel}</span>
          <span>·</span>
          <span>{vm.autonomyLabel} autonomy</span>
          <span>·</span>
          <span>{vm.approvalLabel}</span>
        </div>
      </section>

      {vm.planningMessage && (
        <section className="mw-section mw-glass" style={{ padding: 20, animationDelay: "0.06s" }}>
          <div className="mw-section-title" style={{ marginBottom: 8 }}>
            <Shield size={15} aria-hidden />
            {domainInput.peerName}&apos;s planning
          </div>
          <p className="mw-kn-helper">{vm.planningMessage}</p>
          <p className="mw-empty-inline" style={{ marginTop: 8 }}>
            {vm.evaluationReason}
          </p>
          {vm.canApprovePlan && onApprovePlan && (
            <button
              type="button"
              className="mw-btn-primary pg-focus-premium"
              style={{ marginTop: 14 }}
              disabled={approving}
              onClick={() => void onApprovePlan(responsibilityId)}
            >
              {approving ? "Planning…" : vm.approveLabel}
            </button>
          )}
        </section>
      )}

      <div className="mw-detail-layout">
        <div className="mw-detail-main">
          <section className="mw-section" id="goals">
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              Business goal
            </div>
            <div className="mw-glass" style={{ padding: 16 }}>
              <p className="mw-approval-title">{vm.goal}</p>
              {vm.successMetric && (
                <p className="mw-kn-helper" style={{ marginTop: 8 }}>
                  Success metric: {vm.successMetric}
                </p>
              )}
            </div>
          </section>

          <section className="mw-section" id="projects">
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              Active projects
            </div>
            {vm.projects.length === 0 ? (
              <p className="mw-empty-inline">
                No projects yet. {domainInput.peerName} will create projects when this responsibility
                needs work.
              </p>
            ) : (
              <div className="mw-resp-list">
                {vm.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={project.href}
                    className="mw-glass mw-resp-row pg-focus-premium"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="mw-resp-title">{project.title}</div>
                    <div className="mw-resp-meta">
                      {project.statusLabel} · Updated {project.updatedLabel}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mw-section" id="guardrails">
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              Autonomy boundaries
            </div>
            {vm.guardrails.length === 0 ? (
              <p className="mw-empty-inline">No guardrails configured.</p>
            ) : (
              <dl className="mw-glass mw-detail-dl" style={{ padding: 16 }}>
                {vm.guardrails.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>

        <aside className="mw-detail-aside">
          <section className="mw-section mw-glass" style={{ padding: 18 }} id="overview">
            <div className="mw-section-title" style={{ marginBottom: 12 }}>
              Overview
            </div>
            <dl className="mw-detail-dl">
              <div>
                <dt>Status</dt>
                <dd>{vm.healthLabel}</dd>
              </div>
              {vm.healthReason && (
                <div>
                  <dt>Reason</dt>
                  <dd>{vm.healthReason}</dd>
                </div>
              )}
              <div>
                <dt>Cadence</dt>
                <dd>{vm.cadenceLabel}</dd>
              </div>
              <div>
                <dt>Last evaluation</dt>
                <dd>{vm.lastEvaluationLabel}</dd>
              </div>
              <div>
                <dt>Next evaluation</dt>
                <dd>{vm.nextEvaluationLabel}</dd>
              </div>
            </dl>
          </section>

          <section className="mw-section mw-glass" style={{ padding: 18 }} id="knowledge">
            <div className="mw-section-title" style={{ marginBottom: 10 }}>
              Knowledge
            </div>
            <ul className="mw-detail-links">
              {vm.knowledgeSections.map((section) => (
                <li key={section.label}>
                  <Link href={section.href} className="mw-section-link pg-focus-premium">
                    {section.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
