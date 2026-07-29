"use client";

import type { ReactNode } from "react";
import type { CampaignReviewItemPreview } from "@/lib/peer-experience/marketing/campaign-review";
import type { V17CampaignCopy } from "@/lib/i18n/v17-campaign-copy";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="v17-review-section">
      <h3 className="v17-review-section-title">{title}</h3>
      <div className="v17-review-section-body">{children}</div>
    </section>
  );
}

function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter(Boolean);
  if (blocks.length <= 1) {
    return <p className="v17-review-prose">{text}</p>;
  }
  return (
    <>
      {blocks.map((block) => (
        <p key={block.slice(0, 24)} className="v17-review-prose">
          {block.trim()}
        </p>
      ))}
    </>
  );
}

function PillList({ items }: { items: readonly string[] }) {
  return (
    <ul className="v17-review-pills">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function V17StructuredReviewContent({
  preview,
  copy,
}: {
  preview: CampaignReviewItemPreview;
  copy: V17CampaignCopy;
}) {
  switch (preview.kind) {
    case "campaign_strategy":
      return (
        <article className="v17-review-doc">
          <Section title={copy.sectionExecutiveSummary}>
            <Prose text={preview.summary} />
          </Section>
          {preview.positioning ? (
            <Section title={copy.sectionPositioning}>
              <Prose text={preview.positioning} />
            </Section>
          ) : null}
          {preview.messagingPillars.length > 0 ? (
            <Section title={copy.sectionMessagingPillars}>
              <ol className="v17-review-ordered">
                {preview.messagingPillars.map((pillar) => (
                  <li key={pillar}>{pillar}</li>
                ))}
              </ol>
            </Section>
          ) : null}
          {preview.recommendedChannels.length > 0 ? (
            <Section title={copy.sectionRecommendedChannels}>
              <PillList items={preview.recommendedChannels} />
            </Section>
          ) : null}
          {preview.ctaGuidance ? (
            <Section title={copy.sectionCtaGuidance}>
              <Prose text={preview.ctaGuidance} />
            </Section>
          ) : null}
        </article>
      );
    case "creative_direction":
      return (
        <article className="v17-review-doc">
          <Section title={copy.sectionCampaignConcept}>
            <Prose text={preview.campaignConcept} />
          </Section>
          <Section title={copy.sectionTone}>
            <Prose text={preview.tone} />
          </Section>
          <Section title={copy.sectionVisualDirection}>
            <Prose text={preview.visualDirection} />
          </Section>
        </article>
      );
    case "email_campaign":
      return (
        <article className="v17-review-doc">
          <Section title={copy.sectionExecutiveSummary}>
            <Prose text={preview.subject} />
          </Section>
          {preview.previewText ? (
            <Section title={copy.sectionPositioning}>
              <Prose text={preview.previewText} />
            </Section>
          ) : null}
          <Section title={copy.sectionMessagingPillars}>
            <Prose text={preview.body} />
          </Section>
        </article>
      );
    case "linkedin_post":
      return (
        <article className="v17-review-doc">
          <Section title={copy.sectionCampaignConcept}>
            <Prose text={preview.hook} />
          </Section>
          <Section title={copy.sectionMessagingPillars}>
            <Prose text={preview.mainContent} />
          </Section>
        </article>
      );
    default:
      return null;
  }
}
