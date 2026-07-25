/** Supported publication channels — adapters implement channel-specific preparation only. */
export type PublicationChannelId =
  | "linkedin"
  | "website_cms"
  | "newsletter"
  | "meta_ads"
  | "google_ads";

export type PublicationPackageStatus = "ready" | "published";

/** Prepared publication payload — no external API calls in Sprint 10. */
export type PublicationPackage = {
  id: string;
  channel: PublicationChannelId;
  draftId: string;
  activityReference: string;
  title: string;
  body: string;
  channelPayload: Record<string, unknown>;
  status: PublicationPackageStatus;
  preparedAt: string;
  publishedAt?: string;
};

export type PreparePublicationInput = {
  draftId: string;
  activityReference: string;
  contentType: string;
  channel?: string;
  title: string;
  body: string;
  callToAction?: string;
  keywords?: string[];
  objective?: string;
  targetAudience?: string;
};

export type PublicationChannelAdapter = {
  readonly channelId: PublicationChannelId;
  readonly displayName: string;
  supportsContentType(contentType: string): boolean;
  preparePublication(input: PreparePublicationInput): PublicationPackage;
};

export type ResolvePublicationChannelInput = {
  contentType: string;
  channel?: string;
};
