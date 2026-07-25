import { SUPPORTED_DRAFT_CONTENT_TYPES } from "@/lib/marketing-intelligence/types/content-draft";
import {
  isSupportedContentType,
  normalizeContentType,
} from "@/lib/marketing-intelligence/content/resolve-plan-activity";
import { assessStrategyReadiness } from "@/lib/marketing-intelligence/strategy/assess-strategy-readiness";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence/types/understanding";
import type { MarketingUnderstandingDimension } from "@/lib/marketing-intelligence/types/understanding";
import type { MarketingDecisionGap } from "./ownership";
import type {
  MarketingDecisionApprovalPolicy,
  MarketingDecisionBudgetPolicy,
  MarketingDecisionChannelRecommendation,
  MarketingDecisionConstraints,
  MarketingDecisionContentTypeRecommendation,
  MarketingDecisionCreativeVolume,
  MarketingDecisionCtaStrategy,
  MarketingDecisionEligibility,
  MarketingDecisionEvidence,
  MarketingDecisionReadiness,
  MarketingDecisionRecord,
  MarketingDecisionRecommendationStatus,
  MarketingDecisionSource,
  MarketingDecisionStatus,
} from "./types";

const PAID_CHANNEL_IDS = new Set(["google_ads", "meta_ads", "paid_social"]);
const BUDGET_RESPONSIBILITY_CATEGORIES = new Set(["google_ads", "meta_ads"]);

const CATEGORY_TO_CHANNEL: Record<string, string> = {
  linkedin: "linkedin",
  instagram: "instagram",
  google_ads: "google_ads",
  meta_ads: "meta_ads",
  newsletter: "email",
  blog: "blog",
  website: "web",
  content_marketing: "content_marketing",
  seo: "web",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  linkedin_post: "LinkedIn post",
  blog_article: "Blog article",
  newsletter: "Newsletter",
  website_article: "Website article",
  social_media_post: "Social media post",
  google_ads_copy: "Google Ads copy",
  meta_ads_copy: "Meta Ads copy",
};

function normalizeChannelId(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "linked_in") return "linkedin";
  if (key === "facebook" || key === "meta") return "meta_ads";
  if (key === "google") return "google_ads";
  if (key === "blog") return "blog";
  return key;
}

function buildDecisionId(source: MarketingDecisionSource): string {
  const activity = source.planActivity?.title?.trim().toLowerCase() ?? "none";
  return `marketing-decision:${source.organizationId}:${source.peerId}:${activity}:${source.assembledAt}`;
}

function evidence(
  kind: MarketingDecisionEvidence["kind"],
  ref: string,
  label: string
): MarketingDecisionEvidence {
  return { kind, ref, label };
}

function buildUnderstandingProxy(
  source: MarketingDecisionSource
): MarketingUnderstanding | undefined {
  const ctx = source.context;
  if (!ctx.marketingUnderstandingAvailable) {
    return undefined;
  }

  return {
    available: true,
    sparse: ctx.marketingUnderstandingSparse ?? false,
    completeness: ctx.marketingUnderstandingCompleteness ?? 0,
    gaps: (ctx.marketingUnderstandingGaps ?? []) as MarketingUnderstandingDimension[],
    brand: {
      values: [],
      toneOfVoice: {},
      keyMessages: [],
    },
    products: [],
    services: [],
    customerSegments: Array.from({ length: ctx.customerSegmentCount ?? 0 }, (_, i) => ({
      id: `seg-${i}`,
      name: `Segment ${i + 1}`,
      painPoints: [],
      buyingTriggers: [],
    })),
    competitors: [],
    goals: [],
    existingContent: [],
    assembledAt: source.assembledAt,
  };
}

function computeReadiness(source: MarketingDecisionSource): MarketingDecisionReadiness {
  const strategyReadiness = assessStrategyReadiness(buildUnderstandingProxy(source));
  const warnings = [...strategyReadiness.warnings];

  if (!source.context.companyDnaAvailable) {
    warnings.push("Company DNA unavailable — tone guidance may be limited.");
  }
  if (!source.context.businessBrainAvailable) {
    warnings.push("Business Brain unavailable — factual claims must be avoided.");
  } else if (source.context.businessBrainSparse) {
    warnings.push("Business Brain is sparse — verify factual claims carefully.");
  }

  let maxConfidence = strategyReadiness.maxConfidence;
  if (!source.context.companyDnaAvailable || !source.context.businessBrainAvailable) {
    maxConfidence = "low";
  }

  return {
    ready: strategyReadiness.ready && strategyReadiness.understandingCompleteness > 0,
    understandingCompleteness: strategyReadiness.understandingCompleteness,
    maxConfidence,
    warnings,
  };
}

function deriveBudgetPolicy(source: MarketingDecisionSource): MarketingDecisionBudgetPolicy {
  const reasons: string[] = [];
  let maxMonthlySpend: number | null = null;

  if (source.budgetConstraint?.maxMonthlySpend !== undefined) {
    maxMonthlySpend = source.budgetConstraint.maxMonthlySpend;
    reasons.push("Explicit budget constraint on decision source.");
  } else if (source.responsibilityPolicy) {
    const limits = source.responsibilityPolicy.responsibilities
      .filter(
        (r) => r.enabled && BUDGET_RESPONSIBILITY_CATEGORIES.has(r.category)
      )
      .map((r) => r.maxMonthlySpend)
      .filter((n): n is number => typeof n === "number");
    if (limits.length > 0) {
      maxMonthlySpend = Math.min(...limits);
      reasons.push("Derived from enabled paid-media responsibility guardrails.");
    }
  }

  const paidSpendBlocked =
    source.budgetConstraint?.paidSpendBlocked === true ||
    maxMonthlySpend === 0;

  if (paidSpendBlocked) {
    reasons.push("Paid channel spend blocked (zero budget or explicit block).");
  }

  const spendAutonomous =
    !paidSpendBlocked &&
    maxMonthlySpend !== null &&
    maxMonthlySpend > 0 &&
    source.responsibilityPolicy?.responsibilities.some(
      (r) =>
        r.enabled &&
        BUDGET_RESPONSIBILITY_CATEGORIES.has(r.category) &&
        (r.autonomyLevel === "autonomous" || r.autonomyLevel === "full") &&
        r.approvalPolicy === "fully_automatic"
    ) === true;

  return {
    maxMonthlySpend,
    paidChannelsAllowed: !paidSpendBlocked,
    spendAutonomous: Boolean(spendAutonomous),
    reasons,
  };
}

function isChannelEnabledByPolicy(
  channelId: string,
  source: MarketingDecisionSource
): boolean {
  if (!source.responsibilityPolicy) {
    return true;
  }

  const entries = Object.entries(CATEGORY_TO_CHANNEL);
  const matchingCategories = entries
    .filter(([, ch]) => ch === channelId)
    .map(([cat]) => cat);

  if (matchingCategories.length === 0) {
    return true;
  }

  return source.responsibilityPolicy.responsibilities.some(
    (r) => r.enabled && matchingCategories.includes(r.category)
  );
}

function channelStatus(
  channelId: string,
  source: MarketingDecisionSource,
  budget: MarketingDecisionBudgetPolicy
): MarketingDecisionRecommendationStatus {
  if (
    source.requestedChannel &&
    normalizeChannelId(source.requestedChannel) === channelId
  ) {
    // requested channel evaluated below with same rules
  }

  if (PAID_CHANNEL_IDS.has(channelId) && !budget.paidChannelsAllowed) {
    return "BLOCKED";
  }

  if (!isChannelEnabledByPolicy(channelId, source)) {
    return "BLOCKED";
  }

  if (source.planActivity?.channel) {
    const activityChannel = normalizeChannelId(source.planActivity.channel);
    if (activityChannel === channelId) {
      return "RECOMMENDED";
    }
  }

  return "ALLOWED";
}

function collectChannelCandidates(source: MarketingDecisionSource): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  function push(raw: string | undefined) {
    if (!raw?.trim()) return;
    const id = normalizeChannelId(raw);
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  }

  push(source.planActivity?.channel);
  for (const label of source.plan?.campaignChannelLabels ?? []) {
    push(label);
  }
  for (const label of source.strategy?.channelLabels ?? []) {
    push(label);
  }
  if (source.requestedChannel) {
    push(source.requestedChannel);
  }

  return ordered;
}

function buildChannelRecommendations(
  source: MarketingDecisionSource,
  budget: MarketingDecisionBudgetPolicy,
  globalEvidence: MarketingDecisionEvidence[]
): MarketingDecisionChannelRecommendation[] {
  const candidates = collectChannelCandidates(source);
  const recommendations: MarketingDecisionChannelRecommendation[] = [];

  candidates.forEach((id, index) => {
    let status = channelStatus(id, source, budget);
    const itemEvidence: MarketingDecisionEvidence[] = [...globalEvidence];

    if (source.planActivity?.channel && normalizeChannelId(source.planActivity.channel) === id) {
      itemEvidence.push(
        evidence("plan-activity", source.planActivity.title, "Plan activity channel")
      );
    }
    if (source.plan?.campaignChannelLabels.some((l) => normalizeChannelId(l) === id)) {
      itemEvidence.push(evidence("marketing-plan", "campaigns.channels", "Plan campaign channels"));
    }
    if (source.strategy?.channelLabels.some((l) => normalizeChannelId(l) === id)) {
      itemEvidence.push(
        evidence("marketing-strategy", "campaignIdeas.channels", "Strategy channel suggestion")
      );
    }

    if (source.requestedChannel && normalizeChannelId(source.requestedChannel) === id) {
      itemEvidence.push(evidence("user-request", "requestedChannel", "User-requested channel"));
      if (status === "ALLOWED") {
        status = "RECOMMENDED";
      }
    }

    if (
      source.requestedChannel &&
      normalizeChannelId(source.requestedChannel) === id &&
      status === "BLOCKED"
    ) {
      itemEvidence.push(
        evidence("domain-constraint", "requestedChannel.blocked", "Requested channel blocked by policy")
      );
    }

    const constraints: string[] = [];
    if (PAID_CHANNEL_IDS.has(id) && !budget.paidChannelsAllowed) {
      constraints.push("Paid spend not authorized under current budget policy.");
    }
    if (!isChannelEnabledByPolicy(id, source)) {
      constraints.push("No enabled marketing responsibility covers this channel.");
    }

    recommendations.push({
      id,
      label: id.replace(/_/g, " "),
      rank: index + 1,
      score: Math.max(0, 100 - index * 10),
      status,
      evidence: itemEvidence,
      constraints: constraints.length > 0 ? constraints : undefined,
    });
  });

  if (source.requestedChannel) {
    const requestedId = normalizeChannelId(source.requestedChannel);
    const alreadyListed = recommendations.some((r) => r.id === requestedId);
    if (!alreadyListed) {
      const status = channelStatus(requestedId, source, budget);
      recommendations.push({
        id: requestedId,
        label: requestedId.replace(/_/g, " "),
        rank: recommendations.length + 1,
        score: 0,
        status,
        evidence: [
          evidence("user-request", "requestedChannel", "User-requested channel"),
          ...globalEvidence,
        ],
        constraints:
          status === "BLOCKED"
            ? ["Requested channel is not allowed under current policy."]
            : undefined,
      });
    }
  }

  return recommendations;
}

function contentTypeStatus(
  contentTypeId: string,
  source: MarketingDecisionSource
): MarketingDecisionRecommendationStatus {
  const normalized = normalizeContentType(contentTypeId);
  if (!normalized || !isSupportedContentType(contentTypeId)) {
    return "BLOCKED";
  }

  if (source.planActivity) {
    const activityType = normalizeContentType(source.planActivity.contentType);
    if (activityType === normalized) {
      return "RECOMMENDED";
    }
  }

  if (
    source.requestedContentType &&
    normalizeContentType(source.requestedContentType) === normalized
  ) {
    return channelStatusForContentType(normalized, source) === "BLOCKED"
      ? "BLOCKED"
      : "RECOMMENDED";
  }

  return "ALLOWED";
}

function channelStatusForContentType(
  contentType: string,
  source: MarketingDecisionSource
): MarketingDecisionRecommendationStatus {
  const paidTypes = new Set(["google_ads_copy", "meta_ads_copy"]);
  if (paidTypes.has(contentType)) {
    const budget = deriveBudgetPolicy(source);
    if (!budget.paidChannelsAllowed) {
      return "BLOCKED";
    }
  }
  return "ALLOWED";
}

function buildContentTypeRecommendations(
  source: MarketingDecisionSource,
  globalEvidence: MarketingDecisionEvidence[]
): MarketingDecisionContentTypeRecommendation[] {
  const candidates: string[] = [];

  if (source.planActivity?.contentType) {
    candidates.push(source.planActivity.contentType);
  }
  if (source.requestedContentType) {
    candidates.push(source.requestedContentType);
  }
  for (const type of SUPPORTED_DRAFT_CONTENT_TYPES) {
    if (!candidates.includes(type)) {
      candidates.push(type);
    }
  }

  const recommendations: MarketingDecisionContentTypeRecommendation[] = [];
  const seen = new Set<string>();

  for (const raw of candidates) {
    const normalized = normalizeContentType(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);

    const status = contentTypeStatus(raw, source);
    const itemEvidence: MarketingDecisionEvidence[] = [...globalEvidence];

    if (source.planActivity && normalizeContentType(source.planActivity.contentType) === normalized) {
      itemEvidence.push(
        evidence("plan-activity", source.planActivity.title, "Plan activity content type")
      );
    }
    if (
      source.requestedContentType &&
      normalizeContentType(source.requestedContentType) === normalized
    ) {
      itemEvidence.push(
        evidence("user-request", "requestedContentType", "User-requested content type")
      );
    }

    const constraints: string[] = [];
    if (status === "BLOCKED") {
      constraints.push("Content type is not draftable or blocked by policy.");
    }

    recommendations.push({
      id: normalized,
      label: CONTENT_TYPE_LABELS[normalized] ?? normalized,
      rank: recommendations.length + 1,
      score: status === "RECOMMENDED" ? 90 : status === "ALLOWED" ? 60 : 0,
      status,
      evidence: itemEvidence,
      constraints: constraints.length > 0 ? constraints : undefined,
    });
  }

  return recommendations.slice(0, 12);
}

function deriveApprovalPolicy(source: MarketingDecisionSource): MarketingDecisionApprovalPolicy {
  const reasons: string[] = [];
  let mode: MarketingDecisionApprovalPolicy["mode"] = "approval_before_publication";
  let brandReviewRequired = true;
  let legalReviewRequired = false;

  const responsibilities = source.responsibilityPolicy?.responsibilities.filter(
    (r) => r.enabled
  );

  if (!responsibilities?.length) {
    reasons.push("No responsibility policy provided — defaulting to approval before publication.");
    return { mode, brandReviewRequired, legalReviewRequired, reasons };
  }

  const allFullyAutomatic = responsibilities.every(
    (r) =>
      r.approvalPolicy === "fully_automatic" &&
      r.approvalRequired !== true &&
      (r.autonomyLevel === "autonomous" || r.autonomyLevel === "full")
  );
  const anyManual = responsibilities.some(
    (r) => r.autonomyLevel === "manual" || r.autonomyLevel === "suggest"
  );
  const anyPrepareOnly = responsibilities.some((r) => r.approvalPolicy === "prepare_only");

  if (anyManual) {
    mode = "blocked_manual_only";
    reasons.push("Manual or suggest-only autonomy on an enabled responsibility.");
  } else if (anyPrepareOnly) {
    mode = "approval_before_generation";
    reasons.push("Prepare-only approval policy on an enabled responsibility.");
  } else if (allFullyAutomatic) {
    mode = "no_approval_required";
    reasons.push("All enabled responsibilities allow fully automatic execution.");
  } else {
    mode = "approval_before_publication";
    reasons.push("Approval required before publication on at least one responsibility.");
  }

  if (responsibilities.some((r) => PAID_CHANNEL_IDS.has(CATEGORY_TO_CHANNEL[r.category] ?? ""))) {
    legalReviewRequired = false;
    mode =
      mode === "no_approval_required" ? "approval_before_publication" : mode;
    reasons.push("Paid media responsibilities require publication approval.");
  }

  return { mode, brandReviewRequired, legalReviewRequired, reasons };
}

function computeGaps(source: MarketingDecisionSource): MarketingDecisionGap[] {
  const gaps: MarketingDecisionGap[] = [];

  if (!source.context.marketingUnderstandingAvailable) {
    gaps.push("marketingUnderstanding");
  }
  if (!source.context.companyDnaAvailable) {
    gaps.push("companyDna");
  }
  if (!source.context.businessBrainAvailable) {
    gaps.push("businessBrain");
  }
  if (!source.context.brandBrainAvailable) {
    gaps.push("brandBrain");
  }
  if (!source.strategy) {
    gaps.push("marketingStrategy");
  }
  if (!source.plan) {
    gaps.push("marketingPlan");
  }
  if (source.plan && !source.planActivity) {
    gaps.push("planActivity");
  }
  if (!source.responsibilityPolicy) {
    gaps.push("responsibilityPolicy");
  }
  if (
    source.budgetConstraint === undefined &&
    !source.responsibilityPolicy?.responsibilities.some((r) =>
      BUDGET_RESPONSIBILITY_CATEGORIES.has(r.category)
    )
  ) {
    gaps.push("budgetConstraint");
  }
  if (!source.objective?.trim()) {
    gaps.push("campaignObjective");
  }

  return gaps;
}

function buildCreativeVolume(source: MarketingDecisionSource): MarketingDecisionCreativeVolume {
  const calendarCount = source.plan?.contentCalendarCount ?? 0;
  const recommendedCount = source.planActivity ? 1 : Math.max(calendarCount, 1);
  const maximumCount = source.planActivity ? 3 : Math.max(calendarCount, 3);

  return {
    recommendedCount,
    minimumCount: 1,
    maximumCount,
    rationale: source.planActivity
      ? "Single plan activity selected for execution."
      : "Derived from marketing plan calendar size when no activity is selected.",
  };
}

function buildCtaStrategy(source: MarketingDecisionSource): MarketingDecisionCtaStrategy {
  const patterns = source.context.brandPreferredCtaPatterns ?? [];
  const constraints: string[] = [];

  if (patterns.length === 0) {
    constraints.push("No Brand Brain CTA patterns available — use conservative CTAs.");
  } else {
    constraints.push("CTA must align with Brand Brain preferred patterns when present.");
  }

  return {
    primaryPattern: patterns[0],
    secondaryPattern: patterns[1],
    constraints,
  };
}

function buildConstraints(source: MarketingDecisionSource): MarketingDecisionConstraints {
  const hardBlocks: string[] = [];

  if (source.peerRole && source.peerRole !== "Marketing") {
    hardBlocks.push("Peer role must be Marketing for marketing execution decisions.");
  }

  return {
    peerRoleMustBeMarketing: source.peerRole !== undefined,
    draftableContentTypesOnly: true,
    requiresPlanActivityWhenPlanPresent: Boolean(source.plan),
    hardBlocks,
  };
}

function buildEligibility(input: {
  source: MarketingDecisionSource;
  readiness: MarketingDecisionReadiness;
  approval: MarketingDecisionApprovalPolicy;
  channels: MarketingDecisionChannelRecommendation[];
  contentTypes: MarketingDecisionContentTypeRecommendation[];
  constraints: MarketingDecisionConstraints;
}): MarketingDecisionEligibility {
  const blockedReasons: string[] = [...input.constraints.hardBlocks];

  if (!input.readiness.ready) {
    blockedReasons.push("Marketing readiness threshold not met.");
  }
  if (input.readiness.understandingCompleteness < 40) {
    blockedReasons.push("Marketing understanding completeness below minimum threshold.");
  }
  if (input.approval.mode === "blocked_manual_only") {
    blockedReasons.push("Autonomy policy requires manual-only execution.");
  }

  const requestedChannel = input.source.requestedChannel
    ? normalizeChannelId(input.source.requestedChannel)
    : undefined;
  if (requestedChannel) {
    const match = input.channels.find((c) => c.id === requestedChannel);
    if (match?.status === "BLOCKED") {
      blockedReasons.push(`Requested channel "${requestedChannel}" is blocked.`);
    }
  }

  if (input.source.planActivity) {
    const activityType = normalizeContentType(input.source.planActivity.contentType);
    if (!activityType) {
      blockedReasons.push(
        `Plan activity content type "${input.source.planActivity.contentType}" is not draftable.`
      );
    }
  }

  const requestedType = input.source.requestedContentType
    ? normalizeContentType(input.source.requestedContentType)
    : undefined;
  if (input.source.requestedContentType && !requestedType) {
    blockedReasons.push(
      `Requested content type "${input.source.requestedContentType}" is blocked.`
    );
  } else if (requestedType) {
    const match = input.contentTypes.find((c) => c.id === requestedType);
    if (match?.status === "BLOCKED") {
      blockedReasons.push(`Requested content type "${requestedType}" is blocked.`);
    }
  }

  if (input.source.plan && !input.source.planActivity) {
    blockedReasons.push("Marketing plan present but no plan activity selected.");
  }

  return {
    canExecute: blockedReasons.length === 0,
    canGenerateCreative:
      blockedReasons.length === 0 &&
      input.readiness.ready &&
      input.approval.mode !== "blocked_manual_only",
    canPublish:
      blockedReasons.length === 0 &&
      input.approval.mode === "no_approval_required" &&
      input.readiness.maxConfidence === "high",
    blockedReasons,
  };
}

function resolveStatus(eligibility: MarketingDecisionEligibility): MarketingDecisionStatus {
  if (!eligibility.canExecute) {
    return "blocked";
  }
  if (!eligibility.canGenerateCreative || !eligibility.canPublish) {
    return "restricted";
  }
  return "ready";
}

/** Pure deterministic assembler — no AI, network, or storage. */
export function assembleMarketingDecision(
  source: MarketingDecisionSource
): MarketingDecisionRecord {
  const readiness = computeReadiness(source);
  const budgetPolicy = deriveBudgetPolicy(source);
  const approvalPolicy = deriveApprovalPolicy(source);
  const constraints = buildConstraints(source);

  const globalEvidence: MarketingDecisionEvidence[] = [];
  if (source.context.marketingUnderstandingAvailable) {
    globalEvidence.push(
      evidence("context-slice", "marketingUnderstanding", "Marketing Understanding slice")
    );
  }
  if (source.context.businessBrainAvailable) {
    globalEvidence.push(evidence("context-slice", "businessBrain", "Business Brain slice"));
  }
  if (source.context.brandBrainAvailable) {
    globalEvidence.push(evidence("brand-brain", "voice", "Brand Brain voice rules"));
  }
  if (source.strategy) {
    globalEvidence.push(
      evidence("marketing-strategy", "summary", source.strategy.summary.slice(0, 80))
    );
  }
  if (source.plan) {
    globalEvidence.push(
      evidence("marketing-plan", "summary", source.plan.summary.slice(0, 80))
    );
  }

  const channelRecommendations = buildChannelRecommendations(
    source,
    budgetPolicy,
    globalEvidence
  );
  const contentTypeRecommendations = buildContentTypeRecommendations(
    source,
    globalEvidence
  );

  const eligibility = buildEligibility({
    source,
    readiness,
    approval: approvalPolicy,
    channels: channelRecommendations,
    contentTypes: contentTypeRecommendations,
    constraints,
  });

  const forbiddenWords = [
    ...new Set([
      ...(source.context.brandForbiddenPhrases ?? []),
      ...(source.userForbiddenWords ?? []),
    ]),
  ];

  const forbiddenClaims = [...new Set(source.userForbiddenClaims ?? [])];

  const gaps = computeGaps(source);

  return {
    id: buildDecisionId(source),
    organizationId: source.organizationId,
    peerId: source.peerId,
    objective:
      source.objective?.trim() ||
      source.planActivity?.title ||
      source.strategy?.summary ||
      "Marketing execution",
    status: resolveStatus(eligibility),
    eligibility,
    readiness,
    constraints,
    approvalPolicy,
    budgetPolicy,
    channelRecommendations,
    contentTypeRecommendations,
    ctaStrategy: buildCtaStrategy(source),
    creativeVolume: buildCreativeVolume(source),
    forbiddenClaims,
    forbiddenWords,
    requiredDisclaimers: [],
    evidence: globalEvidence,
    gaps: [...gaps],
    assembledAt: source.assembledAt,
  };
}
