"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type {
  MarketingWorkspaceContentPreview,
  MarketingWorkspaceContentPreviewKind,
} from "@/lib/office/workspace/types";

const KIND_LABEL: Record<MarketingWorkspaceContentPreviewKind, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "Email",
  ads: "Google Ads",
  blog: "Blog",
  display: "Display",
};

export function MwContentAssetCard({ item }: { item: MarketingWorkspaceContentPreview }) {
  const inner = (
    <>
      <div
        className={cn(
          "pg-mw-asset-card__preview",
          `pg-mw-asset-card__preview--${item.kind}`
        )}
      >
        <div className="pg-mw-asset-card__preview-inner">
          {item.kind === "ads" ? (
            <>
              <p className="pg-mw-asset-card__ad-headline">{item.title}</p>
              <p className="pg-mw-asset-card__ad-desc">{item.preview}</p>
            </>
          ) : item.kind === "email" ? (
            <>
              <p className="pg-mw-asset-card__email-subject">{item.title}</p>
              <p className="pg-mw-asset-card__email-preview">{item.preview}</p>
            </>
          ) : (
            <p className="pg-mw-asset-card__post-copy">{item.preview}</p>
          )}
        </div>
        <span
          className={cn(
            "pg-mw-asset-card__status",
            `pg-mw-asset-card__status--${item.statusTone}`
          )}
        >
          {item.statusLabel}
        </span>
      </div>
      <div className="pg-mw-asset-card__meta">
        <span className="pg-mw-asset-card__channel">{KIND_LABEL[item.kind]}</span>
        <h3 className="pg-mw-asset-card__title">{item.title}</h3>
        {item.performanceWhisper ? (
          <span className="pg-mw-asset-card__whisper">{item.performanceWhisper}</span>
        ) : null}
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="pg-mw-asset-card pg-ds-card--interactive pg-focus-premium"
        data-testid={`pg-mw-asset-${item.id}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article className="pg-mw-asset-card" data-testid={`pg-mw-asset-${item.id}`}>
      {inner}
    </article>
  );
}

export function MwContentAssetStrip({
  items,
}: {
  items: readonly MarketingWorkspaceContentPreview[];
}) {
  return (
    <div className="pg-mw-asset-strip" data-testid="pg-mw-content">
      <div className="pg-mw-asset-strip__track">
        {items.map((item) => (
          <MwContentAssetCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
