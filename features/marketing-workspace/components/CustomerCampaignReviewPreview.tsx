"use client";

import type { ReactNode } from "react";
import type { CampaignReviewItemPreview } from "@/lib/peer-experience/marketing/campaign-review";

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mw-review-doc-section">
      <h3 className="mw-review-doc-heading">{title}</h3>
      <div className="mw-review-doc-body">{children}</div>
    </section>
  );
}

function PillList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mw-review-pill-list">
      {items.map((item) => (
        <li key={item} className="mw-review-pill">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function CustomerCampaignReviewPreview({
  preview,
}: {
  preview: CampaignReviewItemPreview;
}) {
  switch (preview.kind) {
    case "campaign_strategy":
      return (
        <article className="mw-review-doc mw-review-doc--strategy">
          <ReviewSection title="Executive summary">
            <p className="mw-review-prose">{preview.summary}</p>
          </ReviewSection>
          {preview.positioning ? (
            <ReviewSection title="Positioning">
              <p className="mw-review-prose">{preview.positioning}</p>
            </ReviewSection>
          ) : null}
          {preview.messagingPillars.length > 0 ? (
            <ReviewSection title="Messaging pillars">
              <ol className="mw-review-ordered">
                {preview.messagingPillars.map((pillar) => (
                  <li key={pillar}>{pillar}</li>
                ))}
              </ol>
            </ReviewSection>
          ) : null}
          {preview.recommendedChannels.length > 0 ? (
            <ReviewSection title="Recommended channels">
              <PillList items={preview.recommendedChannels} />
            </ReviewSection>
          ) : null}
          {preview.ctaGuidance ? (
            <ReviewSection title="CTA guidance">
              <p className="mw-review-prose">{preview.ctaGuidance}</p>
            </ReviewSection>
          ) : null}
        </article>
      );
    case "creative_direction":
      return (
        <article className="mw-review-doc mw-review-doc--creative">
          <ReviewSection title="Campaign concept">
            <p className="mw-review-prose mw-review-lead">{preview.campaignConcept}</p>
          </ReviewSection>
          {preview.campaignAngle &&
          preview.campaignAngle !== preview.campaignConcept ? (
            <ReviewSection title="Core angle">
              <p className="mw-review-prose">{preview.campaignAngle}</p>
            </ReviewSection>
          ) : null}
          <ReviewSection title="Tone of voice">
            <p className="mw-review-prose">{preview.tone}</p>
          </ReviewSection>
          <ReviewSection title="Messaging hierarchy">
            <ol className="mw-review-ordered">
              {preview.messagingHierarchy.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </ReviewSection>
          <ReviewSection title="Visual direction">
            <p className="mw-review-prose">{preview.visualDirection}</p>
          </ReviewSection>
          <ReviewSection title="CTA direction">
            <p className="mw-review-prose">{preview.ctaDirection}</p>
          </ReviewSection>
          {preview.brandConstraints.length > 0 ? (
            <ReviewSection title="Brand constraints">
              <ul className="mw-review-bullets">
                {preview.brandConstraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </ReviewSection>
          ) : null}
          {preview.creativeRecommendations.length > 0 ? (
            <ReviewSection title="Creative recommendations">
              <ul className="mw-review-bullets">
                {preview.creativeRecommendations.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </ReviewSection>
          ) : null}
        </article>
      );
    case "linkedin_post":
      return (
        <article className="mw-review-doc mw-review-doc--linkedin">
          <div className="mw-review-social-card">
            <p className="mw-review-social-hook">{preview.hook}</p>
            <div className="mw-review-prose mw-review-social-body">
              {preview.mainContent.split(/\n\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <p className="mw-review-social-cta">{preview.cta}</p>
            {preview.hashtags.length > 0 ? (
              <p className="mw-review-social-tags">{preview.hashtags.join(" ")}</p>
            ) : null}
          </div>
          {preview.suggestedImageDescription ? (
            <ReviewSection title="Suggested visual">
              <p className="mw-review-prose">{preview.suggestedImageDescription}</p>
            </ReviewSection>
          ) : null}
          {preview.publishingRecommendation ? (
            <ReviewSection title="Publishing recommendation">
              <p className="mw-review-prose">{preview.publishingRecommendation}</p>
            </ReviewSection>
          ) : null}
        </article>
      );
    case "email_campaign":
      return (
        <article className="mw-review-doc mw-review-doc--email">
          <div className="mw-review-email-envelope">
            <div className="mw-review-email-row">
              <span className="mw-review-email-label">Subject</span>
              <span className="mw-review-email-value">{preview.subject}</span>
            </div>
            <div className="mw-review-email-row">
              <span className="mw-review-email-label">Preview</span>
              <span className="mw-review-email-value">{preview.previewText}</span>
            </div>
          </div>
          <ReviewSection title="Message">
            <div className="mw-review-prose">
              {preview.body.split(/\n\n+/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </ReviewSection>
          <ReviewSection title="Primary CTA">
            <p className="mw-review-prose mw-review-email-cta">{preview.cta}</p>
          </ReviewSection>
          {preview.secondaryCta ? (
            <ReviewSection title="Secondary CTA">
              <p className="mw-review-prose">{preview.secondaryCta}</p>
            </ReviewSection>
          ) : null}
          {preview.suggestedSendTiming ? (
            <ReviewSection title="Suggested send timing">
              <p className="mw-review-prose">{preview.suggestedSendTiming}</p>
            </ReviewSection>
          ) : null}
          {preview.audienceNote ? (
            <ReviewSection title="Audience note">
              <p className="mw-review-prose">{preview.audienceNote}</p>
            </ReviewSection>
          ) : null}
        </article>
      );
    default: {
      const _exhaustive: never = preview;
      return _exhaustive;
    }
  }
}
