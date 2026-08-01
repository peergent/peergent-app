"use client";

import Link from "next/link";
import type { CampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { officeHref } from "@/lib/office/links";

export type VisionCampaignDetailViewProps = {
  model: CampaignDetailViewModel;
  locale?: string | null;
};

export default function VisionCampaignDetailView({
  model,
  locale,
}: VisionCampaignDetailViewProps) {
  const nl = locale === "nl";

  return (
    <div data-testid="office-campaign-detail-view">
      <Link
        href={officeHref(model.peerId, "work")}
        className="pg-v13-btn pg-v13-btn--ghost mb-6 inline-flex no-underline"
      >
        {nl ? "← Terug naar Werk" : "← Back to Work"}
      </Link>

      <p className="pg-v13-eyebrow">{nl ? "Campagne" : "Campaign"}</p>
      <h1 className="pg-v13-title">{model.name}</h1>
      <p className="pg-v13-mono mt-2 text-[11px] font-bold text-[var(--pg-v13-attention)]">
        {model.statusLabel}
      </p>

      <div className="pg-v13-sec mt-8 grid gap-4 sm:grid-cols-2">
        <div className="pg-v13-panel p-5">
          <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Doel" : "Goal"}
          </p>
          <p className="mt-2 text-[14px] text-[var(--pg-v13-ink)]">{model.goal}</p>
        </div>
        <div className="pg-v13-panel p-5">
          <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
            {nl ? "Waarom" : "Why"}
          </p>
          <p className="mt-2 text-[14px] text-[var(--pg-v13-ink)]">{model.why}</p>
        </div>
      </div>

      {model.channels.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Kanalen" : "Channels"}</p>
          <div className="pg-v13-chip-list">
            {model.channels.map((channel) => (
              <span key={channel} className="pg-v13-chip">
                {channel}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="pg-v13-sec">
        <p className="pg-v13-sec-label">{nl ? "Voortgang" : "Progress"}</p>
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {model.timeline.map((step) => (
            <li
              key={step.id}
              className={
                step.state === "done"
                  ? "text-[13.5px] text-[var(--pg-v13-ink)]"
                  : step.state === "active"
                    ? "text-[13.5px] font-bold text-[var(--pg-v13-ink)]"
                    : "text-[13.5px] text-[var(--pg-v13-ink-faint)]"
              }
            >
              {step.label}
            </li>
          ))}
        </ol>
      </section>

      {model.pending.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Wacht op jou" : "Waiting on you"}</p>
          {model.pending.map((item) => (
            <Link
              key={item.id}
              href={item.previewHref ?? item.detailHref ?? model.detailHref}
              className="pg-v13-settings-row pg-v13-settings-row--link mb-2 block no-underline"
            >
              <div>
                <div className="pg-v13-settings-name">{item.label}</div>
                <div className="pg-v13-settings-desc">{item.description}</div>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {model.completed.length > 0 ? (
        <section className="pg-v13-sec">
          <p className="pg-v13-sec-label">{nl ? "Geproduceerd werk" : "Produced work"}</p>
          {model.completed.map((item) => (
            <Link
              key={item.id}
              href={item.detailHref ?? item.previewHref ?? "#"}
              className="pg-v13-settings-row pg-v13-settings-row--link mb-2 block no-underline"
            >
              <div>
                <div className="pg-v13-settings-name">{item.label}</div>
                {item.evidence ? (
                  <div className="pg-v13-settings-desc line-clamp-2">{item.evidence}</div>
                ) : null}
              </div>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
}
