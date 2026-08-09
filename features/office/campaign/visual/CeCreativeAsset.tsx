"use client";

import Link from "next/link";
import { cn } from "@/lib/ui/cn";
import type { CampaignCreativeAsset } from "@/lib/office/campaign/campaign-experience-types";

export function CeCreativeAssetCard({ asset }: { asset: CampaignCreativeAsset }) {
  const inner = (
    <>
      <div className={cn("pg-ce-asset__preview", `pg-ce-asset__preview--${asset.kind}`)}>
        <div className="pg-ce-asset__preview-inner">
          {asset.kind === "ads" ? (
            <>
              <p className="pg-ce-asset__ad-headline">{asset.title}</p>
              <p className="pg-ce-asset__copy">{asset.preview}</p>
            </>
          ) : asset.kind === "email" ? (
            <>
              <p className="pg-ce-asset__email-subject">{asset.title}</p>
              <p className="pg-ce-asset__copy">{asset.preview}</p>
            </>
          ) : (
            <p className="pg-ce-asset__copy">{asset.preview}</p>
          )}
        </div>
        <span className={cn("pg-ce-asset__status", `pg-ce-asset__status--${asset.statusTone}`)}>
          {asset.statusLabel}
        </span>
      </div>
      <div className="pg-ce-asset__meta">
        <span className="pg-ce-asset__channel">{asset.channelLabel}</span>
        <h3 className="pg-ce-asset__title">{asset.title}</h3>
      </div>
    </>
  );

  if (asset.href) {
    return (
      <Link
        href={asset.href}
        className="pg-ce-asset pg-ds-card--interactive pg-focus-premium"
        data-testid={`pg-ce-asset-${asset.id}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article className="pg-ce-asset" data-testid={`pg-ce-asset-${asset.id}`}>
      {inner}
    </article>
  );
}

export function CeCreativeAssetGrid({
  assets,
}: {
  assets: readonly CampaignCreativeAsset[];
}) {
  return (
    <div className="pg-ce-asset-grid" data-testid="pg-ce-creative-assets">
      {assets.map((asset) => (
        <CeCreativeAssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
