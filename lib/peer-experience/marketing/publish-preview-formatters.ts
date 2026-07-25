import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { PublicationPackage } from "@/lib/peer-workflow";

export type PublishPreviewFormatted = {
  title: string;
  body: string;
  copyText: string;
};

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function joinSections(sections: (string | undefined)[]): string {
  return sections.filter(Boolean).join("\n\n");
}

export function formatLinkedInPreview(payload: Record<string, unknown>): PublishPreviewFormatted {
  const text = asString(payload.text) ?? "";
  const callToAction = asString(payload.callToAction);
  const hashtags = Array.isArray(payload.hashtags)
    ? payload.hashtags.filter((item): item is string => typeof item === "string")
    : [];

  const body = joinSections([
    text,
    callToAction ? `Call to action: ${callToAction}` : undefined,
    hashtags.length > 0 ? hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" ") : undefined,
  ]);

  return {
    title: "LinkedIn post",
    body,
    copyText: body,
  };
}

export function formatBlogPreview(payload: Record<string, unknown>): PublishPreviewFormatted {
  const headline = asString(payload.headline) ?? "Blog article";
  const bodyText = asString(payload.body) ?? "";
  const keywords = Array.isArray(payload.seoKeywords)
    ? payload.seoKeywords.filter((item): item is string => typeof item === "string")
    : [];

  const body = joinSections([
    bodyText,
    keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : undefined,
  ]);

  return {
    title: headline,
    body,
    copyText: joinSections([headline, body]),
  };
}

export function formatNewsletterPreview(payload: Record<string, unknown>): PublishPreviewFormatted {
  const subject = asString(payload.subject) ?? "Newsletter";
  const preheader = asString(payload.preheader);
  const bodyText = asString(payload.body) ?? "";

  const body = joinSections([preheader ? `Preview: ${preheader}` : undefined, bodyText]);

  return {
    title: subject,
    body,
    copyText: joinSections([subject, body]),
  };
}

export function formatGenericPreview(
  title: string,
  payload: Record<string, unknown>
): PublishPreviewFormatted {
  const textFields = ["text", "body", "primaryText", "description", "headline", "subject"]
    .map((key) => asString(payload[key]))
    .filter(Boolean) as string[];

  const headline = asString(payload.headline) ?? asString(payload.subject) ?? title;
  const body = textFields.length > 0 ? joinSections(textFields) : title;

  return {
    title: headline,
    body,
    copyText: joinSections([headline, body]),
  };
}

export function formatPublicationPackagePreview(
  pkg: PublicationPackage
): PublishPreviewFormatted {
  const payload = pkg.channelPayload;
  const format = asString(payload.format);

  if (format === "linkedin_post" || pkg.channel === "linkedin") {
    return formatLinkedInPreview(payload);
  }
  if (format === "cms_article" || pkg.channel === "website_cms") {
    return formatBlogPreview(payload);
  }
  if (format === "newsletter" || pkg.channel === "newsletter") {
    return formatNewsletterPreview(payload);
  }

  return formatGenericPreview(pkg.title, payload);
}

export function formatDraftAsPublishPreview(
  draft: MarketingContentDraft
): PublishPreviewFormatted {
  const channel = humanChannelLabel(draft);

  const body = joinSections([
    draft.body,
    draft.callToAction ? `Call to action: ${draft.callToAction}` : undefined,
    draft.targetAudience ? `Audience: ${draft.targetAudience}` : undefined,
  ]);

  return {
    title: draft.title,
    body,
    copyText: joinSections([draft.title, body]),
  };
}

export function humanChannelLabel(input: {
  channel?: string;
  contentType: string;
}): string {
  if (input.channel) {
    return input.channel.replace(/_/g, " ");
  }

  switch (input.contentType) {
    case "linkedin_post":
      return "LinkedIn";
    case "blog_article":
    case "website_article":
      return "Website";
    case "newsletter":
      return "Newsletter";
    case "social_media_post":
      return "Social";
    case "meta_ads_copy":
      return "Meta Ads";
    case "google_ads_copy":
      return "Google Ads";
    default:
      return "Content";
  }
}

export function humanContentTypeLabel(contentType: string): string {
  return contentType.replace(/_/g, " ");
}
