"use client";

import Link from "next/link";
import type { ContentDetailViewModel } from "@/lib/office/content/build-content-detail";
import { officeHref } from "@/lib/office/links";

export type VisionContentDetailViewProps = {
  model: ContentDetailViewModel;
  locale?: string | null;
};

export default function VisionContentDetailView({
  model,
  locale,
}: VisionContentDetailViewProps) {
  const nl = locale === "nl";

  return (
    <div data-testid="office-content-detail-view">
      <Link
        href={officeHref(model.peerId, "content")}
        className="pg-v13-btn pg-v13-btn--ghost mb-6 inline-flex no-underline"
      >
        {nl ? "← Terug naar Content" : "← Back to Content"}
      </Link>

      <p className="pg-v13-eyebrow">{model.channelLabel}</p>
      <h1 className="pg-v13-title">{model.title}</h1>
      <p className="pg-v13-sub mt-2">{model.statusLabel}</p>

      <section className="pg-v13-sec mt-8">
        <p className="pg-v13-sec-label">{nl ? "Preview" : "Preview"}</p>
        <div className="pg-v13-panel whitespace-pre-wrap p-6 text-[14px] leading-relaxed text-[var(--pg-v13-ink)]">
          {model.body}
        </div>
      </section>

      <section className="pg-v13-sec grid gap-4 sm:grid-cols-2">
        {model.campaignTitle && model.campaignHref ? (
          <div className="pg-v13-panel p-5">
            <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Campagne" : "Campaign"}
            </p>
            <Link href={model.campaignHref} className="mt-2 inline-block font-semibold text-[var(--pg-v13-blue)] no-underline">
              {model.campaignTitle}
            </Link>
          </div>
        ) : null}
        {model.publishedAtLabel ? (
          <div className="pg-v13-panel p-5">
            <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Datum" : "Date"}
            </p>
            <p className="mt-2 text-[14px] text-[var(--pg-v13-ink)]">{model.publishedAtLabel}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
