/** Shared creative-generation LLM contract — prompt, JSON schema, and validator must match. */

export const CREATIVE_DELIVERABLE_TYPES = [
  "linkedin_post",
  "linkedin_carousel",
  "acquisition_email",
  "newsletter",
  "google_ads_campaign",
  "landing_page",
  "blog",
  "instagram_post",
  "campaign_concept",
] as const;

export const CREATIVE_CHANNEL_IDS = [
  "linkedin",
  "google_ads",
  "email",
  "newsletter",
  "landing_page",
  "website_landing",
  "blog",
  "instagram",
  "meta_ads",
  "seo",
] as const;

export const CREATIVE_REVIEW_STATUSES = ["planned", "draft", "needs_review"] as const;

/** Bounded deliverables planning contract — shared by prompt, schema, and validator. */
export const CREATIVE_GENERATION_MIN_DELIVERABLES = 3;
export const CREATIVE_GENERATION_MAX_DELIVERABLES = 5;
export const CREATIVE_GENERATION_MAX_KEY_POINTS = 4;

export type CreativeDeliverableType = (typeof CREATIVE_DELIVERABLE_TYPES)[number];
export type CreativeChannelId = (typeof CREATIVE_CHANNEL_IDS)[number];

const DELIVERABLE_TYPE_ALIASES: Record<string, CreativeDeliverableType> = {
  carousel: "linkedin_carousel",
  linkedin_carousel_plan: "linkedin_carousel",
  social_post: "linkedin_post",
  linkedin: "linkedin_post",
  email: "acquisition_email",
  email_sequence: "acquisition_email",
  nurture_email: "acquisition_email",
  google_ads: "google_ads_campaign",
  google_search: "google_ads_campaign",
  landing: "landing_page",
  landing_page_plan: "landing_page",
  website_landing: "landing_page",
  instagram: "instagram_post",
  concept: "campaign_concept",
};

const CHANNEL_ALIASES: Record<string, CreativeChannelId> = {
  linkedin: "linkedin",
  linkedin_organic: "linkedin",
  google: "google_ads",
  googleads: "google_ads",
  google_ads: "google_ads",
  google_search: "google_ads",
  email: "email",
  e_mail: "email",
  newsletter: "newsletter",
  landing_page: "landing_page",
  landing: "landing_page",
  website_landing: "website_landing",
  website: "website_landing",
  blog: "blog",
  instagram: "instagram",
  meta: "meta_ads",
  meta_ads: "meta_ads",
  facebook: "meta_ads",
  seo: "seo",
};

export function normalizeCreativeChannelId(raw: string | undefined): CreativeChannelId | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if ((CREATIVE_CHANNEL_IDS as readonly string[]).includes(key)) {
    return key as CreativeChannelId;
  }
  return CHANNEL_ALIASES[key] ?? null;
}

export function normalizeCreativeDeliverableType(raw: string | undefined): CreativeDeliverableType | null {
  if (!raw?.trim()) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if ((CREATIVE_DELIVERABLE_TYPES as readonly string[]).includes(key)) {
    return key as CreativeDeliverableType;
  }
  return DELIVERABLE_TYPE_ALIASES[key] ?? null;
}

export function channelMatchesApprovedSelection(
  channel: CreativeChannelId,
  approvedChannels: readonly string[]
): boolean {
  if (approvedChannels.length === 0) return true;
  const approved = new Set(
    approvedChannels
      .map((value) => normalizeCreativeChannelId(value))
      .filter(Boolean) as CreativeChannelId[]
  );
  if (approved.has(channel)) return true;
  if (channel === "landing_page" && approved.has("website_landing")) return true;
  if (channel === "website_landing" && approved.has("landing_page")) return true;
  return false;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeDeliverableRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const deliverableType =
    normalizeCreativeDeliverableType(
      String(raw.deliverableType ?? raw.type ?? raw.deliverable_type ?? "")
    ) ?? raw.deliverableType;
  const channel =
    normalizeCreativeChannelId(String(raw.channel ?? "")) ?? raw.channel;

  return {
    ...raw,
    id: raw.id ?? raw.deliverableId,
    deliverableType,
    channel,
    purpose: raw.purpose ?? raw.goal,
    targetAudience: raw.targetAudience ?? raw.audience,
    objective: raw.objective ?? raw.goal,
    messageAngle: raw.messageAngle ?? raw.message ?? raw.angle,
    keyPoints: coerceStringArray(raw.keyPoints ?? raw.key_points ?? raw.points),
    callToActionDirection:
      raw.callToActionDirection ?? raw.cta ?? raw.callToAction ?? raw.call_to_action,
    format: raw.format ?? raw.outputFormat,
    reviewStatus: raw.reviewStatus ?? raw.review_status ?? "planned",
    rationale: raw.rationale ?? raw.reason,
    dependencies: coerceStringArray(raw.dependencies ?? raw.deps),
    assumptions: coerceStringArray(raw.assumptions ?? raw.assumption),
    provenance: raw.provenance ?? raw.source ?? raw.provenanceRef,
  };
}

/** Applies documented safe aliases before schema/business validation. */
export function normalizeCreativeGenerationLlmPayload(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;
  const payload = parsed as Record<string, unknown>;
  const deliverables = Array.isArray(payload.deliverables)
    ? payload.deliverables.map((item) =>
        item && typeof item === "object"
          ? normalizeDeliverableRecord(item as Record<string, unknown>)
          : item
      )
    : payload.deliverables;

  return {
    ...payload,
    deliverables,
    decisions: Array.isArray(payload.decisions) ? payload.decisions : payload.decisions ?? [],
    recommendations: Array.isArray(payload.recommendations)
      ? payload.recommendations
      : payload.recommendations ?? [],
    actionProposals: Array.isArray(payload.actionProposals)
      ? payload.actionProposals
      : payload.actionProposals ?? [],
    warnings: Array.isArray(payload.warnings) ? payload.warnings : payload.warnings ?? [],
  };
}
