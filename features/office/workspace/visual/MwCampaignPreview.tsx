"use client";

import { cn } from "@/lib/ui/cn";
import type {
  MarketingCampaignThumbnailKind,
  MarketingWorkspaceCampaignCard,
} from "@/lib/office/workspace/types";

export function MwCampaignPreview({
  campaign,
}: {
  campaign: Pick<
    MarketingWorkspaceCampaignCard,
    "thumbnailKind" | "previewHeadline" | "previewBody" | "previewMeta" | "channelLabel"
  >;
}) {
  const { thumbnailKind, previewHeadline, previewBody, previewMeta } = campaign;

  if (thumbnailKind === "linkedin") {
    return (
      <div className={cn("pg-mw-campaign-preview", "pg-mw-campaign-preview--linkedin")}>
        <div className="pg-mw-campaign-preview__linkedin-bar">
          <span className="pg-mw-campaign-preview__avatar" aria-hidden />
          <div>
            <span className="pg-mw-campaign-preview__meta">{previewMeta ?? "Your company"}</span>
          </div>
        </div>
        <p className="pg-mw-campaign-preview__headline">{previewHeadline}</p>
        <p className="pg-mw-campaign-preview__body">{previewBody}</p>
      </div>
    );
  }

  if (thumbnailKind === "google_ads") {
    return (
      <div className={cn("pg-mw-campaign-preview", "pg-mw-campaign-preview--ads")}>
        <span className="pg-mw-campaign-preview__ads-label">Ad</span>
        <span className="pg-mw-campaign-preview__ads-url">{previewMeta ?? "example.com"}</span>
        <p className="pg-mw-campaign-preview__ads-headline">{previewHeadline}</p>
        <p className="pg-mw-campaign-preview__ads-desc">{previewBody}</p>
      </div>
    );
  }

  if (thumbnailKind === "email") {
    return (
      <div className={cn("pg-mw-campaign-preview", "pg-mw-campaign-preview--email")}>
        <p className="pg-mw-campaign-preview__email-subject">{previewHeadline}</p>
        <p className="pg-mw-campaign-preview__email-preview">{previewBody}</p>
      </div>
    );
  }

  if (thumbnailKind === "multi") {
    return (
      <div className={cn("pg-mw-campaign-preview", "pg-mw-campaign-preview--multi")}>
        <div className="pg-mw-campaign-preview__multi-grid">
          <span className="pg-mw-campaign-preview__multi-chip">LinkedIn</span>
          <span className="pg-mw-campaign-preview__multi-chip">Email</span>
          <span className="pg-mw-campaign-preview__multi-chip">Blog</span>
        </div>
        <p className="pg-mw-campaign-preview__headline">{previewHeadline}</p>
        <p className="pg-mw-campaign-preview__body">{previewBody}</p>
      </div>
    );
  }

  return (
    <div className={cn("pg-mw-campaign-preview", `pg-mw-campaign-preview--${thumbnailKind}`)}>
      <p className="pg-mw-campaign-preview__headline">{previewHeadline}</p>
      <p className="pg-mw-campaign-preview__body">{previewBody}</p>
    </div>
  );
}
