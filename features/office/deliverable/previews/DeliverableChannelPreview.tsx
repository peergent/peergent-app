"use client";

import type { DeliverableReviewModel } from "@/features/office/deliverable/OfficeDeliverableReviewModal";

export type DeliverablePreviewProps = {
  model: Pick<
    DeliverableReviewModel,
    | "channelId"
    | "channelLabel"
    | "body"
    | "title"
    | "emailFrom"
    | "emailTo"
    | "emailSubject"
    | "emailPreheader"
    | "emailCta"
    | "linkedInPostCopy"
    | "linkedInHashtags"
    | "linkedInCta"
    | "googleAdsCampaign"
    | "googleAdsAdGroup"
    | "googleAdsBudget"
    | "googleAdsHeadlines"
    | "googleAdsDescriptions"
    | "googleAdsKeywords"
    | "googleAdsTargeting"
    | "googleAdsPreview"
    | "landingHero"
    | "landingSub"
    | "landingSections"
    | "landingCta"
    | "landingSeoTitle"
    | "landingSeoDescription"
    | "campaignTitle"
  >;
  locale?: string | null;
  companyName?: string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12.5px]">
      <span className="text-[var(--pg-v13-ink-faint)]">{label}:</span> {value}
    </p>
  );
}

export default function DeliverableChannelPreview({
  model,
  locale,
  companyName,
}: DeliverablePreviewProps) {
  const nl = locale === "nl";
  const channel = model.channelId ?? "content";
  const author = companyName ?? model.campaignTitle ?? (nl ? "Bedrijf" : "Company");
  const isEmail = channel === "email";
  const isNewsletter = channel === "newsletter";
  const isLinkedIn = channel === "linkedin";
  const isGoogleAds = channel === "google_ads";
  const isLanding = channel === "website_landing";

  if (isLinkedIn) {
    const postCopy = model.linkedInPostCopy ?? model.body;
    return (
      <div
        className="overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-white dark:bg-[var(--pg-v13-panel)]"
        data-testid="preview-linkedin"
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a66c2] text-[14px] font-bold text-white">
            {author.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[var(--pg-v13-ink)]">{author}</p>
            <p className="text-[12px] text-[var(--pg-v13-ink-faint)]">
              {nl ? "Bedrijfspagina" : "Company page"} · 1,2k {nl ? "volgers" : "followers"}
            </p>
            <p className="text-[11px] text-[var(--pg-v13-ink-faint)]">
              2{nl ? "u" : "h"} · 🌐
            </p>
          </div>
          <span className="text-[18px] text-[var(--pg-v13-ink-faint)]">···</span>
        </div>
        <div className="whitespace-pre-wrap px-4 pb-3 text-[14px] leading-relaxed text-[var(--pg-v13-ink)]">
          {postCopy}
        </div>
        <div className="mx-4 mb-3 overflow-hidden rounded-[var(--pg-radius-sm)] border border-[var(--pg-v13-line-soft)]">
          <div className="flex h-[160px] items-end bg-gradient-to-br from-[var(--pg-v13-grad-soft)] to-[var(--pg-v13-panel)] p-4">
            <p className="text-[13px] font-semibold text-[var(--pg-v13-ink-soft)]">
              {model.title || author}
            </p>
          </div>
        </div>
        {model.linkedInHashtags ? (
          <div className="px-4 pb-2 text-[13px] font-medium text-[#0a66c2]">{model.linkedInHashtags}</div>
        ) : null}
        {model.linkedInCta ? (
          <div className="mx-4 mb-3">
            <span className="inline-block rounded border border-[#0a66c2] px-4 py-1.5 text-[13px] font-semibold text-[#0a66c2]">
              {model.linkedInCta}
            </span>
          </div>
        ) : null}
        <div className="border-t border-[var(--pg-v13-line-soft)] px-4 py-2">
          <p className="text-[11px] text-[var(--pg-v13-ink-faint)]">42 {nl ? "reacties" : "reactions"} · 8 {nl ? "commentaren" : "comments"}</p>
          <div className="mt-2 flex justify-between text-[12px] font-semibold text-[var(--pg-v13-ink-soft)]">
            <span>👍 {nl ? "Interessant" : "Like"}</span>
            <span>💬 {nl ? "Reageren" : "Comment"}</span>
            <span>↗ {nl ? "Delen" : "Share"}</span>
            <span>📤 {nl ? "Versturen" : "Send"}</span>
          </div>
        </div>
      </div>
    );
  }

  if (isEmail) {
    const bodyParagraphs = model.body.split("\n\n").filter(Boolean);
    return (
      <div
        className="overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-bg)]"
        data-testid="preview-email"
      >
        <div className="flex items-center gap-2 border-b border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="ml-2 text-[11px] text-[var(--pg-v13-ink-faint)]">
            {nl ? "Inbox" : "Inbox"} — {model.emailSubject ?? model.title}
          </span>
        </div>
        <div className="border-b border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
          {model.emailFrom ? <MetaRow label={nl ? "Van" : "From"} value={model.emailFrom} /> : null}
          {model.emailTo ? <MetaRow label={nl ? "Aan" : "To"} value={model.emailTo} /> : null}
          {model.emailSubject ? (
            <p className="mt-2 text-[16px] font-semibold text-[var(--pg-v13-ink)]">{model.emailSubject}</p>
          ) : null}
          {model.emailPreheader ? (
            <p className="mt-1 text-[13px] text-[var(--pg-v13-ink-faint)]">{model.emailPreheader}</p>
          ) : null}
        </div>
        <div className="mx-auto max-w-[560px] bg-white px-6 py-6 dark:bg-[var(--pg-v13-panel)]">
          {bodyParagraphs.map((para) => (
            <p
              key={para.slice(0, 40)}
              className="mb-4 text-[14px] leading-relaxed text-[var(--pg-v13-ink)] last:mb-0"
            >
              {para}
            </p>
          ))}
          {model.emailCta ? (
            <div className="my-6 text-center">
              <span className="inline-block rounded-[var(--pg-radius-sm)] bg-[var(--pg-v13-blue)] px-6 py-3 text-[14px] font-semibold text-white">
                {model.emailCta}
              </span>
            </div>
          ) : null}
          <div className="mt-6 border-t border-[var(--pg-v13-line-soft)] pt-4 text-[12px] text-[var(--pg-v13-ink-soft)]">
            <p>{nl ? "Met vriendelijke groet," : "Best regards,"}</p>
            <p className="font-semibold">Emma</p>
            <p>{author}</p>
          </div>
        </div>
        <div className="border-t border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 text-center text-[11px] text-[var(--pg-v13-ink-faint)]">
          {author} · {nl ? "Uitschrijven" : "Unsubscribe"} · {nl ? "Privacy" : "Privacy"}
        </div>
      </div>
    );
  }

  if (isNewsletter) {
    return (
      <div
        className="overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)]"
        data-testid="preview-newsletter"
      >
        <div className="border-b border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-grad-soft)] px-4 py-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--pg-v13-blue)]">
            {author}
          </p>
          <p className="mt-2 text-[18px] font-extrabold text-[var(--pg-v13-ink)]">{model.title}</p>
        </div>
        <div className="whitespace-pre-wrap bg-[var(--pg-v13-bg)] px-4 py-4 text-[13.5px] leading-relaxed text-[var(--pg-v13-ink)]">
          {model.body}
        </div>
        <div className="border-t border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 text-center text-[11px] text-[var(--pg-v13-ink-faint)]">
          {nl ? "Uitschrijven · Voorkeuren" : "Unsubscribe · Preferences"}
        </div>
      </div>
    );
  }

  if (isGoogleAds) {
    const displayUrl = model.googleAdsPreview?.split("·")[0]?.trim() ?? `${author.toLowerCase().replace(/\s+/g, "")}.com`;
    return (
      <div data-testid="preview-google-ads" className="space-y-4">
        <p className="pg-v13-mono text-[10px] font-bold uppercase text-[var(--pg-v13-ink-faint)]">
          {nl ? "Google Ads — zoekadvertentie" : "Google Ads — search ad"}
        </p>
        <div className="overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-white p-4 dark:bg-[var(--pg-v13-panel)]">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded border border-[var(--pg-v13-line-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--pg-v13-ink-faint)]">
              {nl ? "Advertentie" : "Ad"}
            </span>
            <p className="text-[12px] text-[var(--pg-v13-ink-soft)]">{displayUrl}</p>
          </div>
          {model.googleAdsHeadlines?.slice(0, 3).map((h, i) => (
            <p
              key={h}
              className={`leading-snug ${i === 0 ? "text-[18px] font-normal text-[#1a0dab] dark:text-[#8ab4f8]" : "text-[14px] text-[#1a0dab] dark:text-[#8ab4f8]"}`}
            >
              {h}
              {i < 2 && model.googleAdsHeadlines && i < model.googleAdsHeadlines.length - 1 ? " | " : ""}
            </p>
          ))}
          {model.googleAdsDescriptions?.slice(0, 2).map((d) => (
            <p key={d} className="mt-1 text-[13px] leading-snug text-[var(--pg-v13-ink-soft)]">
              {d}
            </p>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            {(model.googleAdsHeadlines ?? []).slice(0, 2).map((h) => (
              <span
                key={`ext-${h}`}
                className="text-[12px] text-[#1a0dab] dark:text-[#8ab4f8]"
              >
                {h.split(" ")[0]} →
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
            <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Headlines" : "Headlines"}
            </p>
            <ul className="mt-2 list-disc pl-4 text-[12.5px] text-[var(--pg-v13-ink-soft)]">
              {model.googleAdsHeadlines?.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3">
            <p className="pg-v13-mono text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">
              {nl ? "Descriptions" : "Descriptions"}
            </p>
            <ul className="mt-2 list-disc pl-4 text-[12.5px] text-[var(--pg-v13-ink-soft)]">
              {model.googleAdsDescriptions?.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-1 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 text-[12.5px]">
          {model.googleAdsCampaign ? (
            <MetaRow label={nl ? "Campagne" : "Campaign"} value={model.googleAdsCampaign} />
          ) : null}
          {model.googleAdsBudget ? (
            <MetaRow label={nl ? "Budget" : "Budget"} value={model.googleAdsBudget} />
          ) : null}
          {model.googleAdsTargeting ? (
            <MetaRow label={nl ? "Doelgroep" : "Audience"} value={model.googleAdsTargeting} />
          ) : null}
          {model.googleAdsKeywords ? (
            <MetaRow label="Keywords" value={model.googleAdsKeywords} />
          ) : null}
          <MetaRow
            label={nl ? "Verwachte intentie" : "Expected intent"}
            value={nl ? "Hoog — actief zoekend naar oplossing" : "High — actively searching for a solution"}
          />
          <MetaRow label={nl ? "Geschatte CTR" : "Est. CTR"} value="2,1–3,4% (demo)" />
        </div>
      </div>
    );
  }

  if (isLanding) {
    const faqSections = model.landingSections?.filter((s) => /faq|veelgesteld|question/i.test(s)) ?? [];
    const benefitSections =
      model.landingSections?.filter((s) => !/faq|veelgesteld|question|social proof/i.test(s)) ?? [];
    const socialProof = model.landingSections?.find((s) => /social proof|bewijs/i.test(s));

    return (
      <div data-testid="preview-landing-page">
        <div className="overflow-hidden rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)]">
          <div className="flex items-center gap-2 border-b border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-[var(--pg-v13-attention)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--pg-v13-ink-faint)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--pg-v13-ink-faint)]" />
            <span className="ml-2 truncate text-[11px] text-[var(--pg-v13-ink-faint)]">
              {model.landingSeoTitle ?? model.title}
            </span>
          </div>
          <div className="bg-gradient-to-b from-[var(--pg-v13-grad-soft)] to-[var(--pg-v13-bg)] px-6 py-10 text-center">
            {model.landingHero ? (
              <p className="text-[24px] font-extrabold leading-tight text-[var(--pg-v13-ink)]">
                {model.landingHero}
              </p>
            ) : null}
            {model.landingSub ? (
              <p className="mx-auto mt-3 max-w-md text-[15px] text-[var(--pg-v13-ink-soft)]">
                {model.landingSub}
              </p>
            ) : null}
            {model.landingCta ? (
              <span className="pg-v13-btn pg-v13-btn--sm mt-6 inline-block">{model.landingCta}</span>
            ) : null}
          </div>
          {benefitSections.length ? (
            <div className="grid gap-3 border-t border-[var(--pg-v13-line-soft)] px-4 py-6 sm:grid-cols-3">
              {benefitSections.slice(0, 3).map((section) => (
                <div
                  key={section}
                  className="rounded-[var(--pg-radius-sm)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-3 py-4 text-[13px] text-[var(--pg-v13-ink-soft)]"
                >
                  {section.replace(/^Section \d+:\s*/i, "")}
                </div>
              ))}
            </div>
          ) : null}
          {socialProof ? (
            <div className="border-t border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-6 py-4 text-center">
              <p className="text-[14px] italic text-[var(--pg-v13-ink-soft)]">
                {socialProof.replace(/^Section \d+:\s*Social proof\s*[—-]\s*/i, "“")}
                {!socialProof.endsWith('"') ? "”" : ""}
              </p>
            </div>
          ) : null}
          {faqSections.length ? (
            <div className="border-t border-[var(--pg-v13-line-soft)] px-4 py-4">
              <p className="pg-v13-mono mb-2 text-[10px] uppercase text-[var(--pg-v13-ink-faint)]">FAQ</p>
              {faqSections.map((section) => (
                <p key={section} className="mb-2 text-[13px] text-[var(--pg-v13-ink-soft)]">
                  {section.replace(/^Section \d+:\s*Veelgestelde vragen\s*[—-]\s*/i, "")}
                </p>
              ))}
            </div>
          ) : null}
          <div className="border-t border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 text-center text-[11px] text-[var(--pg-v13-ink-faint)]">
            © {author} · {nl ? "Privacy" : "Privacy"} · {nl ? "Contact" : "Contact"}
          </div>
        </div>
        {model.landingSeoTitle || model.landingSeoDescription ? (
          <div className="mt-3 space-y-1 rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-3 text-[12.5px]">
            {model.landingSeoTitle ? (
              <MetaRow label={nl ? "SEO-titel" : "SEO title"} value={model.landingSeoTitle} />
            ) : null}
            {model.landingSeoDescription ? (
              <MetaRow label={nl ? "SEO-beschrijving" : "SEO description"} value={model.landingSeoDescription} />
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap rounded-[var(--pg-radius-md)] border border-[var(--pg-v13-line-soft)] bg-[var(--pg-v13-panel)] px-4 py-4 text-[13.5px] leading-relaxed text-[var(--pg-v13-ink)]">
      {model.body}
    </div>
  );
}
