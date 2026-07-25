import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { IntegrationConnection } from "@/lib/integrations/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { buildEmmaRationaleBullets } from "../build-emma-rationale";
import type { ApprovalDeliverableOverlay } from "./approval-overlay";
import type {
  ApprovalChannel,
  ApprovalConnectionState,
  ApprovalContentFormat,
  ApprovalDeliverable,
  ApprovalDeliverableStatus,
  ApprovalMediaAsset,
  ApprovalAccount,
} from "./types";

function mapDraftStatus(status: MarketingContentDraft["status"]): ApprovalDeliverableStatus {
  switch (status) {
    case "draft":
    case "ready_for_review":
    case "rejected":
      return "review_ready";
    case "approved":
      return "approved";
    case "ready_to_publish":
      return "scheduled";
    case "published":
      return "published";
    default:
      return "review_ready";
  }
}

export function resolveApprovalChannel(draft: MarketingContentDraft): ApprovalChannel {
  const channel = (draft.channel ?? draft.contentType).toLowerCase();
  if (channel.includes("instagram")) return "instagram";
  if (channel.includes("linkedin")) return "linkedin";
  if (channel.includes("facebook") || channel.includes("meta")) return "facebook";
  if (channel.includes("newsletter") || channel.includes("mail")) return "newsletter";
  if (channel.includes("blog")) return "blog";
  if (channel.includes("google")) return "google_ads";
  if (draft.contentType === "meta_ads_copy") return "meta_ads";
  return "linkedin";
}

function resolveFormat(
  channel: ApprovalChannel,
  mediaCount: number
): ApprovalContentFormat {
  if (channel === "google_ads" || channel === "meta_ads") return "ad";
  if (channel === "newsletter") return "email";
  if (channel === "blog") return "article";
  if (mediaCount > 1) return "carousel";
  if (mediaCount === 1) return "single_image";
  return "text";
}

function resolveProviderId(channel: ApprovalChannel): IntegrationConnection["id"] | null {
  switch (channel) {
    case "instagram":
      return "instagram";
    case "linkedin":
      return "linkedin";
    case "facebook":
    case "meta_ads":
      return "meta";
    case "google_ads":
      return "google_ads";
    case "newsletter":
      return "mailchimp";
    case "blog":
      return "wordpress";
    default:
      return null;
  }
}

export function resolveApprovalAccount(input: {
  channel: ApprovalChannel;
  connections: IntegrationConnection[];
  peerName: string;
}): ApprovalAccount {
  const providerId = resolveProviderId(input.channel);
  const connection = providerId
    ? input.connections.find((c) => c.id === providerId)
    : undefined;
  const status = connection?.status ?? "not_connected";

  return {
    id: providerId ?? input.channel,
    name: connection?.label ?? input.channel.replace(/_/g, " "),
    username: input.peerName.toLowerCase().replace(/\s+/g, ""),
    connected: status === "connected",
    connectionStatus:
      status === "connected"
        ? "connected"
        : status === "needs_reconnect"
          ? "needs_reconnect"
          : "not_connected",
    settingsHref: connection?.settingsHref ?? "/integrations",
  };
}

export function resolveApprovalConnectionState(
  account: ApprovalAccount
): ApprovalConnectionState {
  if (account.connected) {
    return {
      canSchedule: true,
      canPublish: true,
      disabledReason: null,
      connectHref: account.settingsHref,
    };
  }

  const reason =
    account.connectionStatus === "needs_reconnect"
      ? "This channel connection expired. Reconnect before scheduling or publishing."
      : `${account.name} is not connected. Connect the channel to schedule or publish.`;

  return {
    canSchedule: false,
    canPublish: false,
    disabledReason: reason,
    connectHref: account.settingsHref,
  };
}

function parseHashtags(draft: MarketingContentDraft, overlay?: ApprovalDeliverableOverlay): string[] {
  if (overlay?.content?.hashtags?.length) return overlay.content.hashtags;
  const fromKeywords = draft.keywords.filter((k) => k.startsWith("#") || !k.includes(" "));
  if (fromKeywords.length) {
    return fromKeywords.map((k) => (k.startsWith("#") ? k : `#${k}`));
  }
  const matches = draft.body.match(/#[\w]+/g);
  return matches ?? [];
}

function stripHashtagsFromCaption(body: string, hashtags: string[]): string {
  let caption = body.trim();
  for (const tag of hashtags) {
    caption = caption.replace(new RegExp(`\\s*${tag.replace("#", "\\#")}\\b`, "g"), "");
  }
  return caption.trim();
}

function defaultMediaForDraft(
  draft: MarketingContentDraft,
  channel: ApprovalChannel
): ApprovalMediaAsset[] {
  if (channel !== "instagram" && channel !== "facebook" && channel !== "linkedin") {
    return [];
  }
  return [
    {
      id: `media-default-${draft.id}`,
      type: "image",
      source: "generated",
      url: "",
      status: "ready",
      altText: draft.title,
    },
  ];
}

function mergeMedia(
  draft: MarketingContentDraft,
  channel: ApprovalChannel,
  overlay?: ApprovalDeliverableOverlay
): ApprovalMediaAsset[] {
  if (overlay?.media?.length) return overlay.media;
  return defaultMediaForDraft(draft, channel);
}

export function buildApprovalDeliverable(input: {
  draft: MarketingContentDraft;
  workUnit: WorkUnit | null;
  overlay?: ApprovalDeliverableOverlay;
  connections: IntegrationConnection[];
  peerName: string;
}): ApprovalDeliverable {
  const { draft, workUnit, overlay, connections, peerName } = input;
  const channel = resolveApprovalChannel(draft);
  const media = mergeMedia(draft, channel, overlay);
  const format = resolveFormat(channel, media.length);
  const hashtags = parseHashtags(draft, overlay);
  const baseCaption = overlay?.content?.caption ?? stripHashtagsFromCaption(draft.body, hashtags);
  const rationaleBullets = buildEmmaRationaleBullets(draft);

  const account = resolveApprovalAccount({ channel, connections, peerName });

  return {
    id: draft.id,
    workUnitId: workUnit?.id ?? null,
    draftId: draft.id,
    title: draft.title,
    status: mapDraftStatus(draft.status),
    channel,
    format,
    account,
    content: {
      headline: overlay?.content?.headline ?? draft.title,
      body: overlay?.content?.body ?? draft.body,
      caption: baseCaption,
      hashtags,
      firstComment: overlay?.content?.firstComment,
      callToAction: overlay?.content?.callToAction ?? draft.callToAction,
      destinationUrl: overlay?.content?.destinationUrl,
    },
    media,
    publishing: {
      mode: overlay?.publishing?.mode ?? "manual",
      scheduledAt: overlay?.publishing?.scheduledAt,
      timezone: overlay?.publishing?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    rationale: {
      summary: rationaleBullets[0] ?? "This direction aligns with your marketing strategy.",
      audience: draft.targetAudience ?? workUnit?.audience ?? undefined,
      objective: draft.objective || workUnit?.objective || undefined,
      whyThisCopy: rationaleBullets[0],
      whyThisMedia: channel === "instagram" ? rationaleBullets.find((b) => b.includes("4:5") || b.includes("visual")) : undefined,
      whyThisTiming: overlay?.publishing?.scheduledAt
        ? `Scheduled for ${new Date(overlay.publishing.scheduledAt).toLocaleString()}.`
        : undefined,
    },
    feedback: overlay?.feedback ?? [],
    createdAt: draft.generatedAt || new Date().toISOString(),
    updatedAt: overlay?.updatedAt ?? draft.generatedAt ?? new Date().toISOString(),
  };
}

export function selectPreviewChannel(deliverable: ApprovalDeliverable): ApprovalChannel {
  return deliverable.channel;
}
