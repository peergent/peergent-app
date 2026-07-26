"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Flag } from "lucide-react";
import {
  buildMarketingCampaignsViewModel,
  buildMarketingCampaignViewModelSourceFromDomainInput,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-campaigns-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  assertCustomerSafeCampaignPresentation,
  presentMarketingCampaignCard,
  presentMarketingCampaignsEmptyMessage,
} from "../lib/marketing-campaign-card-presenter";

export type MarketingCampaignsSectionProps = {
  peerId: string;
  domainInput: MarketingPeerDomainInput;
};

function statusChipClass(statusLabel: string): string {
  const lower = statusLabel.toLowerCase();
  if (lower.includes("block")) return "mw-project-status mw-project-status--blocked";
  if (lower.includes("plan")) return "mw-project-status mw-project-status--planning";
  return "mw-project-status";
}

function CampaignCardBody({
  presentation,
}: {
  presentation: ReturnType<typeof presentMarketingCampaignCard>;
}) {
  return (
    <>
      <div className="mw-project-head">
        <div>
          <div className="mw-project-title">{presentation.title}</div>
          <div className={statusChipClass(presentation.statusLabel)}>
            {presentation.statusLabel}
          </div>
        </div>
        <div className="mw-project-pct">{presentation.progressLabel}</div>
      </div>
      {presentation.goalLine && <p className="mw-project-goal">{presentation.goalLine}</p>}
      <ul className="mw-campaign-meta">
        {presentation.channelsLine && <li>{presentation.channelsLine}</li>}
        {presentation.approvalLine && <li>{presentation.approvalLine}</li>}
        {presentation.contentLine && <li>{presentation.contentLine}</li>}
        {presentation.blockedLine && <li>{presentation.blockedLine}</li>}
      </ul>
      <p className="mw-campaign-next">
        Next action:{" "}
        <Link href={presentation.nextActionHref} className="mw-section-link">
          {presentation.nextActionLabel}
        </Link>
      </p>
    </>
  );
}

/**
 * Read-only Campaign cards on the Projects (work) tab — additive; does not replace project cards.
 */
export default function MarketingCampaignsSection({
  peerId,
  domainInput,
}: MarketingCampaignsSectionProps) {
  const vm = useMemo(() => {
    const source = buildMarketingCampaignViewModelSourceFromDomainInput(domainInput);
    return buildMarketingCampaignsViewModel(source);
  }, [domainInput]);

  const cards = useMemo(
    () =>
      vm.items.map((item) => {
        const presentation = presentMarketingCampaignCard(item);
        assertCustomerSafeCampaignPresentation(presentation);
        return { item, presentation };
      }),
    [vm.items]
  );

  return (
    <section
      className="mw-section mw-campaigns-section"
      style={{ animationDelay: "0s", marginBottom: 24 }}
      data-testid="mw-campaigns-section"
    >
      <div className="mw-section-head">
        <div className="mw-section-title">
          <Flag size={15} aria-hidden />
          Campaigns
        </div>
        <span className="mw-section-link" style={{ cursor: "default", opacity: 0.7 }}>
          Read-only
        </span>
      </div>

      {cards.length === 0 ? (
        <p className="mw-empty-inline" data-testid="mw-campaigns-empty">
          {vm.emptyMessage || presentMarketingCampaignsEmptyMessage(domainInput.peerName)}
        </p>
      ) : (
        <div className="mw-projects-grid">
          {cards.map(({ item, presentation }) =>
            item.linkEnabled && presentation.href ? (
              <Link
                key={item.id}
                href={presentation.href}
                className="mw-glass mw-project-card pg-focus-premium"
                style={{ textDecoration: "none", color: "inherit" }}
                data-testid={`mw-campaign-card-${item.id}`}
              >
                <CampaignCardBody presentation={presentation} />
              </Link>
            ) : (
              <div
                key={item.id}
                className="mw-glass mw-project-card"
                data-testid={`mw-campaign-card-${item.id}`}
              >
                <CampaignCardBody presentation={presentation} />
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
