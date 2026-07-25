import type {
  PreparePublicationInput,
  PublicationChannelAdapter,
  PublicationPackage,
} from "../types";

function basePackage(
  adapter: PublicationChannelAdapter,
  input: PreparePublicationInput,
  channelPayload: Record<string, unknown>
): PublicationPackage {
  return {
    id: `pub-${input.draftId}-${adapter.channelId}`,
    channel: adapter.channelId,
    draftId: input.draftId,
    activityReference: input.activityReference,
    title: input.title,
    body: input.body,
    channelPayload,
    status: "ready",
    preparedAt: new Date().toISOString(),
  };
}

export const linkedInChannelAdapter: PublicationChannelAdapter = {
  channelId: "linkedin",
  displayName: "LinkedIn",
  supportsContentType(contentType) {
    return contentType === "linkedin_post" || contentType === "social_media_post";
  },
  preparePublication(input) {
    return basePackage(this, input, {
      format: "linkedin_post",
      text: input.body,
      callToAction: input.callToAction ?? null,
      hashtags: input.keywords ?? [],
      note: "Ready for manual paste or future LinkedIn API integration.",
    });
  },
};

export const websiteCmsChannelAdapter: PublicationChannelAdapter = {
  channelId: "website_cms",
  displayName: "Website / CMS",
  supportsContentType(contentType) {
    return (
      contentType === "blog_article" ||
      contentType === "website_article"
    );
  },
  preparePublication(input) {
    return basePackage(this, input, {
      format: "cms_article",
      headline: input.title,
      body: input.body,
      seoKeywords: input.keywords ?? [],
      note: "Ready for CMS export or future CMS integration.",
    });
  },
};

export const newsletterChannelAdapter: PublicationChannelAdapter = {
  channelId: "newsletter",
  displayName: "Newsletter",
  supportsContentType(contentType) {
    return contentType === "newsletter";
  },
  preparePublication(input) {
    return basePackage(this, input, {
      format: "newsletter",
      subject: input.title,
      body: input.body,
      preheader: input.objective ?? null,
      note: "Ready for email platform export or future integration.",
    });
  },
};

export const metaAdsChannelAdapter: PublicationChannelAdapter = {
  channelId: "meta_ads",
  displayName: "Meta Ads",
  supportsContentType(contentType) {
    return contentType === "meta_ads_copy";
  },
  preparePublication(input) {
    return basePackage(this, input, {
      format: "meta_ads",
      primaryText: input.body,
      headline: input.title,
      callToAction: input.callToAction ?? null,
      note: "Ready for Ads Manager or future Meta Marketing API.",
    });
  },
};

export const googleAdsChannelAdapter: PublicationChannelAdapter = {
  channelId: "google_ads",
  displayName: "Google Ads",
  supportsContentType(contentType) {
    return contentType === "google_ads_copy";
  },
  preparePublication(input) {
    return basePackage(this, input, {
      format: "google_ads",
      headlines: [input.title],
      descriptions: [input.body],
      keywords: input.keywords ?? [],
      note: "Ready for Google Ads editor or future API integration.",
    });
  },
};

export const DEFAULT_PUBLICATION_ADAPTERS: PublicationChannelAdapter[] = [
  linkedInChannelAdapter,
  websiteCmsChannelAdapter,
  newsletterChannelAdapter,
  metaAdsChannelAdapter,
  googleAdsChannelAdapter,
];
