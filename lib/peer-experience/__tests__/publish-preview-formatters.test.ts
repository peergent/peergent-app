import { describe, expect, it } from "vitest";
import {
  formatBlogPreview,
  formatGenericPreview,
  formatLinkedInPreview,
  formatNewsletterPreview,
  formatPublicationPackagePreview,
} from "@/lib/peer-experience/marketing/publish-preview-formatters";
import type { PublicationPackage } from "@/lib/peer-workflow";

describe("publish preview formatters", () => {
  it("formats LinkedIn preview as readable text", () => {
    const preview = formatLinkedInPreview({
      format: "linkedin_post",
      text: "Hello world",
      callToAction: "Learn more",
      hashtags: ["launch"],
    });

    expect(preview.body).toContain("Hello world");
    expect(preview.body).toContain("Learn more");
    expect(preview.body).toContain("#launch");
    expect(preview.copyText).not.toContain("{");
    expect(preview.body).not.toContain("channelPayload");
  });

  it("formats blog preview", () => {
    const preview = formatBlogPreview({
      format: "cms_article",
      headline: "Launch story",
      body: "Article body",
      seoKeywords: ["saas"],
    });

    expect(preview.title).toBe("Launch story");
    expect(preview.body).toContain("Article body");
    expect(preview.body).toContain("saas");
  });

  it("formats newsletter preview", () => {
    const preview = formatNewsletterPreview({
      format: "newsletter",
      subject: "March update",
      preheader: "What's new",
      body: "Newsletter body",
    });

    expect(preview.title).toBe("March update");
    expect(preview.body).toContain("Newsletter body");
  });

  it("falls back to generic preview for unknown channels", () => {
    const preview = formatGenericPreview("Custom piece", {
      format: "unknown",
      body: "Plain fallback",
    });

    expect(preview.body).toContain("Plain fallback");
    expect(JSON.stringify(preview)).not.toContain("channelPayload");
  });

  it("formats publication package without raw JSON", () => {
    const pkg: PublicationPackage = {
      id: "pub-1",
      channel: "linkedin",
      draftId: "d1",
      activityReference: "Post",
      title: "Launch post",
      body: "Body",
      channelPayload: {
        format: "linkedin_post",
        text: "Launch copy",
        callToAction: null,
        hashtags: [],
      },
      status: "ready",
      preparedAt: "2026-01-01T00:00:00.000Z",
    };

    const preview = formatPublicationPackagePreview(pkg);
    expect(preview.body).toContain("Launch copy");
    expect(preview.copyText).not.toMatch(/^\s*[\[{]/);
  });
});
