import { describe, expect, it } from "vitest";

import {
  buildCreativeDirectionReviewPreview,
  buildEmailReviewPreview,
  buildLinkedInReviewPreview,
} from "@/lib/peer-experience/marketing/campaign-review/campaign-review-artifact-presenter";

describe("CustomerCampaignReviewPreview data", () => {
  it("structures LinkedIn preview with body paragraphs and hashtags", () => {
    const preview = buildLinkedInReviewPreview({
      hook: "Hook line",
      body: "First paragraph.\n\nSecond paragraph.",
      cta: "Learn more",
      hashtags: ["#peergent"],
      suggestedImageDescription: "Desk",
      publishingRecommendation: "Tuesday",
    } as never);
    expect(preview.mainContent).toContain("First paragraph");
    expect(preview.hashtags).toContain("#peergent");
  });

  it("structures Email preview with subject and preview text", () => {
    const preview = buildEmailReviewPreview({
      subject: "Subject line",
      previewText: "Inbox preview",
      body: "Hello team.\n\nMore detail here.",
      cta: "Start trial",
    } as never);
    expect(preview.subject).toBe("Subject line");
    expect(preview.previewText).toBe("Inbox preview");
    expect(preview.body).toContain("Hello team");
  });

  it("structures creative direction without duplicating concept as angle-only title", () => {
    const preview = buildCreativeDirectionReviewPreview({
      campaignGoal: { summary: "Concept only" },
      tone: { directive: "Calm" },
      messagingPriorities: { primaryMessage: "One", supportingMessages: [] },
      visualPriorities: { summary: "Clean" },
      cta: { primary: "Go" },
      forbiddenClaims: [],
      forbiddenWords: [],
      requiredDisclaimers: [],
      outputRequirements: { deliverableSummary: "Brief" },
    } as never);
    expect(preview.campaignConcept).toBe("Concept only");
  });
});
