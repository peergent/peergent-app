"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type {
  MarketingCampaignStatus,
  MarketingWorkspaceCampaignCard,
} from "@/lib/office/workspace/types";
import { MwCampaignPreview } from "./MwCampaignPreview";

const STATUS_LABEL: Record<MarketingCampaignStatus, { en: string; nl: string }> = {
  live: { en: "LIVE", nl: "LIVE" },
  optimizing: { en: "Optimizing", nl: "Optimaliseren" },
  waiting: { en: "Waiting", nl: "Wachtend" },
  scheduled: { en: "Scheduled", nl: "Gepland" },
};

export function MwCampaignHeroCard({
  campaign,
  nl,
  index = 0,
}: {
  campaign: MarketingWorkspaceCampaignCard;
  nl: boolean;
  index?: number;
}) {
  const statusLabel = STATUS_LABEL[campaign.status][nl ? "nl" : "en"];
  const middleMetric = campaign.roasLabel
    ? { label: "ROAS", value: campaign.roasLabel }
    : { label: nl ? "Omzet" : "Revenue", value: campaign.revenueLabel ?? "—" };

  return (
    <Link
      href={campaign.href}
      className="pg-cc6-card pg-mw-campaign-hero pg-ds-card--interactive pg-focus-premium"
      data-testid={`pg-mw-campaign-${campaign.id}`}
      style={{ ["--pg-mw-stagger" as string]: `${index * 60}ms` }}
    >
      <div className="pg-mw-campaign-hero__media">
        <div
          className={cn(
            "pg-mw-campaign-hero__preview-wrap",
            `pg-mw-campaign-hero__preview-wrap--${campaign.thumbnailKind}`
          )}
        >
          <MwCampaignPreview campaign={campaign} />
        </div>
        <span
          className={cn(
            "pg-mw-campaign-hero__status",
            `pg-mw-campaign-hero__status--${campaign.status}`
          )}
        >
          {campaign.status === "live" ? (
            <span className="pg-mw-campaign-hero__live-dot" aria-hidden />
          ) : null}
          {statusLabel}
        </span>
        <span className="pg-mw-campaign-hero__channel">{campaign.channelLabel}</span>
      </div>

      <div className="pg-mw-campaign-hero__body">
        <h3 className="pg-mw-campaign-hero__name">{campaign.name}</h3>
        {campaign.channelsSubtitle ? (
          <p className="pg-mw-campaign-hero__channels">{campaign.channelsSubtitle}</p>
        ) : null}

        <div className="pg-mw-campaign-hero__metrics">
          <div className="pg-mw-campaign-hero__metric">
            <span className="pg-mw-campaign-hero__metric-label">
              {nl ? "Budget" : "Budget"}
            </span>
            <span className="pg-mw-campaign-hero__metric-value">
              {campaign.budgetLabel ?? "—"}
            </span>
          </div>
          <div className="pg-mw-campaign-hero__metric">
            <span className="pg-mw-campaign-hero__metric-label">{middleMetric.label}</span>
            <span
              className={cn(
                "pg-mw-campaign-hero__metric-value",
                campaign.revenueLabel && "pg-mw-campaign-hero__metric-value--positive"
              )}
            >
              {middleMetric.value}
            </span>
          </div>
          <div className="pg-mw-campaign-hero__metric">
            <span className="pg-mw-campaign-hero__metric-label">
              {nl ? "Leads" : "Leads"}
            </span>
            <span className="pg-mw-campaign-hero__metric-value">
              {campaign.leadsLabel ?? "—"}
            </span>
          </div>
        </div>

        {campaign.progressPercent != null ? (
          <div className="pg-mw-campaign-hero__progress-wrap">
            <div
              className={cn(
                "pg-mw-campaign-hero__progress-track",
                campaign.milestoneAttention && "pg-mw-campaign-hero__progress-track--waiting"
              )}
            >
              <div
                className={cn(
                  "pg-mw-campaign-hero__progress-fill",
                  campaign.milestoneAttention && "pg-mw-campaign-hero__progress-fill--waiting"
                )}
                style={{ width: `${campaign.progressPercent}%` }}
              />
            </div>
            <div className="pg-mw-campaign-hero__progress-foot">
              {campaign.progressCaption ? (
                <span className="pg-mw-campaign-hero__progress-caption">
                  {campaign.progressCaption}
                </span>
              ) : (
                <span aria-hidden />
              )}
              <span
                className={cn(
                  "pg-mw-campaign-hero__milestone",
                  campaign.milestoneAttention && "pg-mw-campaign-hero__milestone--attention"
                )}
              >
                {campaign.milestoneLabel}
              </span>
            </div>
          </div>
        ) : (
          <p
            className={cn(
              "pg-mw-campaign-hero__milestone pg-mw-campaign-hero__milestone--solo",
              campaign.milestoneAttention && "pg-mw-campaign-hero__milestone--attention"
            )}
          >
            {campaign.milestoneLabel}
          </p>
        )}
      </div>
    </Link>
  );
}

export function MwCampaignHeroGrid({
  campaigns,
  nl,
}: {
  campaigns: readonly MarketingWorkspaceCampaignCard[];
  nl: boolean;
}) {
  return (
    <div className="pg-mw-campaign-hero-grid" data-testid="pg-mw-campaigns">
      {campaigns.map((campaign, index) => (
        <MwCampaignHeroCard key={campaign.id} campaign={campaign} nl={nl} index={index} />
      ))}
    </div>
  );
}
