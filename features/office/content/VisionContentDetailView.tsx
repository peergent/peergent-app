"use client";

import Link from "next/link";
import DeliverableChannelPreview from "@/features/office/deliverable/previews/DeliverableChannelPreview";
import type { ContentDetailViewModel } from "@/lib/office/content/build-content-detail";
import { deliverablePreviewCtaLabel } from "@/lib/office/deliverable/deliverable-cta-labels";
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
      <p className="pg-v13-mono mt-1 text-[11px] font-bold text-[var(--pg-v13-attention)]">
        {model.statusLabel}
      </p>
      <h1 className="pg-v13-title mt-2 break-words">{model.title}</h1>

      <section className="pg-v13-sec mt-8">
        <p className="pg-v13-sec-label">{nl ? "Preview" : "Preview"}</p>
        <DeliverableChannelPreview
          model={{
            channelId: model.channelId,
            channelLabel: model.channelLabel,
            body: model.body,
            title: model.title,
            ...model.previewFields,
            campaignTitle: model.campaignTitle ?? undefined,
          }}
          locale={locale}
          companyName={model.campaignTitle ?? undefined}
        />
      </section>

      <section className="pg-v13-sec">
        <p className="pg-v13-sec-label">{nl ? "Volledige inhoud" : "Full content"}</p>
        <div className="pg-v13-panel max-h-[480px] overflow-y-auto whitespace-pre-wrap break-words p-6 text-[14px] leading-relaxed text-[var(--pg-v13-ink)]">
          {model.body}
        </div>
      </section>

      {model.campaignTitle && model.campaignHref ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Campagne" : "Campaign"}</p>
          <div className="pg-v13-panel p-5">
            <Link
              href={model.campaignHref}
              className="inline-block break-words font-semibold text-[var(--pg-v13-blue)] no-underline"
            >
              {model.campaignTitle}
            </Link>
          </div>
        </section>
      ) : null}

      {model.creationRationale ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Waarom Emma dit maakte" : "Why Emma created this"}</p>
          <div className="pg-v13-panel p-5">
            <p className="break-words text-[14px] leading-relaxed text-[var(--pg-v13-ink-soft)]">
              {model.creationRationale}
            </p>
          </div>
        </section>
      ) : null}

      {model.approvalHistory.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Goedkeuring" : "Approval"}</p>
          <ul className="pg-v13-panel m-0 list-none space-y-2 p-5">
            {model.approvalHistory.map((entry) => (
              <li key={`${entry.at}-${entry.action}`} className="text-[13px] text-[var(--pg-v13-ink-soft)]">
                {entry.action === "approved"
                  ? nl
                    ? "Goedgekeurd"
                    : "Approved"
                  : entry.action === "changes_requested"
                    ? nl
                      ? "Wijzigingen gevraagd"
                      : "Changes requested"
                    : nl
                      ? "Afgewezen"
                      : "Rejected"}{" "}
                {nl ? "door" : "by"} {entry.by}
                {entry.atLabel ? ` · ${entry.atLabel}` : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.publishedAtLabel ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Publicatie" : "Publication"}</p>
          <div className="pg-v13-panel p-5">
            <p className="text-[14px] text-[var(--pg-v13-ink)]">{model.publishedAtLabel}</p>
          </div>
        </section>
      ) : null}

      {model.analytics.length > 0 ? (
        <section className="pg-v13-sec" data-testid="content-analytics">
          <p className="pg-v13-sec-label">{nl ? "Resultaten" : "Results"}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {model.analytics.map((metric) => (
              <div key={metric.label} className="pg-v13-panel p-4">
                <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
                  {metric.label}
                </p>
                <p className="mt-1 text-[18px] font-bold text-[var(--pg-v13-ink)]">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {model.nextStepCta ? (
        <section className="pg-v13-sec mt-8">
          <Link href={model.nextStepCta.href} className="pg-v13-btn inline-flex no-underline">
            {model.nextStepCta.label}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
