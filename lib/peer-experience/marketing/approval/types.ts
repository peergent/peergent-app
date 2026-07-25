/** Channel identifiers for approval deliverables. */
export type ApprovalChannel =
  | "instagram"
  | "linkedin"
  | "facebook"
  | "newsletter"
  | "blog"
  | "google_ads"
  | "meta_ads";

export type ApprovalDeliverableStatus =
  | "draft"
  | "review_ready"
  | "approved"
  | "scheduled"
  | "published";

export type ApprovalContentFormat =
  | "single_image"
  | "carousel"
  | "video"
  | "text"
  | "email"
  | "article"
  | "ad";

export type ApprovalMediaSource = "generated" | "uploaded" | "media_library";

export type ApprovalMediaAsset = {
  id: string;
  type: "image" | "video";
  source: ApprovalMediaSource;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  width?: number;
  height?: number;
  status?: "ready" | "generating" | "failed";
  /** True when the asset URL is session-only (e.g. blob:) and will not survive refresh. */
  localOnly?: boolean;
};

export type ApprovalAccount = {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  connected: boolean;
  connectionStatus: "connected" | "not_connected" | "needs_reconnect" | "missing_permission";
  settingsHref: string;
};

export type ApprovalDeliverableContent = {
  headline?: string;
  body?: string;
  caption?: string;
  hashtags?: string[];
  firstComment?: string;
  callToAction?: string;
  destinationUrl?: string;
};

export type ApprovalPublishing = {
  mode: "manual" | "scheduled" | "publish_now";
  scheduledAt?: string;
  timezone?: string;
};

export type ApprovalRationale = {
  summary: string;
  audience?: string;
  objective?: string;
  whyThisCopy?: string;
  whyThisMedia?: string;
  whyThisTiming?: string;
};

export type ApprovalFeedbackEntry = {
  message: string;
  createdAt: string;
};

export type ApprovalDeliverable = {
  id: string;
  workUnitId: string | null;
  draftId: string;
  title: string;
  status: ApprovalDeliverableStatus;
  channel: ApprovalChannel;
  format: ApprovalContentFormat;
  account: ApprovalAccount;
  content: ApprovalDeliverableContent;
  media: ApprovalMediaAsset[];
  publishing: ApprovalPublishing;
  rationale: ApprovalRationale;
  feedback: ApprovalFeedbackEntry[];
  createdAt: string;
  updatedAt: string;
};

export type ApprovalConnectionState = {
  canSchedule: boolean;
  canPublish: boolean;
  disabledReason: string | null;
  connectHref: string;
};
