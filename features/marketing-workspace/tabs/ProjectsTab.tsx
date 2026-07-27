"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Megaphone } from "lucide-react";
import {
  buildMarketingProjectsViewModel,
  projectFilters,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-projects-view-model";
import {
  deriveProjectProgress,
  deriveProjectStatus,
  projectStatusLabel,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { CreateMarketingCampaignProjectInput } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingProjectFilter } from "@/lib/peer-experience/marketing/domain/marketing-peer-types";
import { getWorkHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  buildProjectCardSteps,
  remainingProjectSteps,
} from "../lib/build-project-card-steps";
import MarketingCampaignsSection from "../components/MarketingCampaignsSection";
import CreateCampaignModal from "../components/CreateCampaignModal";

function scheduledDraftIds(
  overlays: MarketingPeerDomainInput["approvalOverlays"]
): Set<string> {
  const ids = new Set<string>();
  for (const [draftId, overlay] of Object.entries(overlays ?? {})) {
    if (overlay?.publishing?.scheduledAt) ids.add(draftId);
  }
  return ids;
}

function statusDisplay(statusLabel: string): { className: string; live: boolean } {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("plan")) return { className: "mw-project-status mw-project-status--planning", live: false };
  if (lower.includes("complete") || lower.includes("monitor"))
    return { className: "mw-project-status", live: false };
  return { className: "mw-project-status", live: true };
}

export type ProjectsTabProps = {
  peerId: string;
  domainInput: MarketingPeerDomainInput;
  ownerLabel: string;
  peerName: string;
  campaignsEnabled: boolean;
  createCampaignWizardOpen: boolean;
  onOpenCreateCampaignWizard: () => void;
  onCloseCreateCampaignWizard: () => void;
  onCreateCampaign?: (input: CreateMarketingCampaignProjectInput) => Promise<{ projectId: string }>;
  onCampaignCreated?: (projectId: string) => void;
};

export default function ProjectsTab({
  peerId,
  domainInput,
  ownerLabel,
  peerName,
  campaignsEnabled,
  createCampaignWizardOpen,
  onOpenCreateCampaignWizard,
  onCloseCreateCampaignWizard,
  onCreateCampaign,
  onCampaignCreated,
}: ProjectsTabProps) {
  const searchParams = useSearchParams();
  const filter = (searchParams.get("filter") as MarketingProjectFilter) ?? "active";
  const [searchQuery, setSearchQuery] = useState("");

  const scheduled = useMemo(() => scheduledDraftIds(domainInput.approvalOverlays), [domainInput.approvalOverlays]);

  const vm = useMemo(
    () => buildMarketingProjectsViewModel({ ...domainInput, filter }),
    [domainInput, filter]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vm.items;
    return vm.items.filter((item) => item.title.toLowerCase().includes(q));
  }, [vm.items, searchQuery]);

  return (
    <>
      {campaignsEnabled ? (
        <MarketingCampaignsSection
          peerId={peerId}
          domainInput={domainInput}
          onCreateCampaign={onOpenCreateCampaignWizard}
        />
      ) : null}

      {campaignsEnabled && onCreateCampaign ? (
        <CreateCampaignModal
          open={createCampaignWizardOpen}
          onClose={onCloseCreateCampaignWizard}
          peerId={peerId}
          ownerLabel={ownerLabel}
          peerName={peerName}
          onCreate={async (input) => {
            const result = await onCreateCampaign(input);
            onCampaignCreated?.(result.projectId);
            return result;
          }}
        />
      ) : null}

    <section className="mw-section" style={{ animationDelay: "0.05s", marginBottom: 0 }}>
      <div className="mw-section-head">
        <div className="mw-section-title">
          <Megaphone size={15} aria-hidden />
          Where {domainInput.peerName} is working
        </div>
        {campaignsEnabled ? (
          <button
            type="button"
            className="mw-btn-primary pg-focus-premium"
            data-testid="mw-new-campaign"
            onClick={onOpenCreateCampaignWizard}
          >
            New campaign
          </button>
        ) : (
          <button
            type="button"
            className="mw-btn-primary pg-focus-premium"
            data-testid="mw-new-project"
          >
            New project
          </button>
        )}
      </div>

      <div className="mw-content-filters" style={{ marginBottom: 16 }}>
        {projectFilters().map((f) => (
          <Link
            key={f.id}
            href={`${getWorkHref(peerId)}?filter=${f.id}`}
            className={`mw-filter-chip pg-focus-premium${filter === f.id ? " mw-filter-chip--active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {campaignsEnabled ? (
        <label className="mw-project-search">
          <span className="sr-only">Search campaigns</span>
          <input
            type="search"
            className="mw-modal-input mw-project-search-input"
            placeholder="Search campaigns"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="mw-project-search"
          />
        </label>
      ) : null}

      {filteredItems.length === 0 ? (
        <p className="mw-empty-inline">
          {searchQuery.trim() ? "No campaigns match your search." : vm.emptyMessage}
        </p>
      ) : (
        <div className="mw-projects-grid mw-projects-grid--compact">
          {filteredItems.map((item) => {
            const project = domainInput.projects.find((p) => p.id === item.id)!;
            const status = deriveProjectStatus(
              project,
              domainInput.workUnits,
              domainInput.drafts,
              scheduled
            );
            const progress = deriveProjectProgress(project, domainInput.workUnits, status);
            const steps = buildProjectCardSteps(item.id, domainInput.workUnits);
            const remaining = remainingProjectSteps(steps);
            const statusInfo = statusDisplay(item.statusLabel);

            return (
              <Link
                key={item.id}
                href={item.href}
                className="mw-glass mw-project-card pg-focus-premium"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="mw-project-head">
                  <div>
                    <div className="mw-project-title">{item.title}</div>
                    <div className={statusInfo.className}>
                      {statusInfo.live && <span className="mw-live-dot" aria-hidden />}
                      {projectStatusLabel(status)}
                    </div>
                  </div>
                  <div className="mw-project-pct">{progress}%</div>
                </div>
                <div className="mw-project-track">
                  <div className="mw-project-fill" style={{ width: `${progress}%` }} />
                </div>
                {project.goal && !campaignsEnabled ? (
                  <p className="mw-project-goal">
                    Goal: <strong>{project.goal}</strong>
                  </p>
                ) : null}
                {!campaignsEnabled ? (
                <div className="mw-project-steps">
                  {steps.slice(0, 5).map((step) => (
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
                </div>
                ) : null}
                {!campaignsEnabled ? (
                <p className="mw-project-remaining">
                  {remaining <= 1 ? "1 step left" : `${remaining} steps left`}
                </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
    </>
  );
}
