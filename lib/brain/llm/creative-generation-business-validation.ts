import {
  channelMatchesApprovedSelection,
  normalizeCreativeChannelId,
  type CreativeChannelId,
} from "./creative-generation-contract";

export const CREATIVE_BUSINESS_VALIDATION_CODES = [
  "unapproved_channel",
  "unsupported_deliverable_type",
  "final_copy_detected",
  "unsupported_numeric_claim",
  "missing_rationale",
  "missing_provenance",
  "missing_key_points",
  "missing_cta_direction",
  "duplicate_deliverable",
  "invalid_review_status",
  "strategy_mismatch",
  "audience_mismatch",
  "offer_mismatch",
  "output_mapping_failed",
] as const;

export type CreativeGenerationDeliverablePlan = {
  id?: string;
  deliverableType?: string;
  channel?: string;
  purpose?: string;
  targetAudience?: string;
  objective?: string;
  messageAngle?: string;
  keyPoints?: string[];
  callToActionDirection?: string;
  format?: string;
  reviewStatus?: string;
  rationale?: string;
  dependencies?: string[];
  assumptions?: string[];
  provenance?: string;
};

export type CreativeGenerationLlmPayload = {
  deliverables?: CreativeGenerationDeliverablePlan[];
  decisions?: Array<{ id?: string; label?: string; rationale?: string; confidence?: string }>;
  recommendations?: Array<{ id?: string; label?: string; priority?: string }>;
  actionProposals?: Array<{ id?: string; actionType?: string; label?: string; requiresApproval?: boolean }>;
  warnings?: Array<{ id?: string; code?: string; message?: string }>;
};

export type CreativeBusinessValidationCode = (typeof CREATIVE_BUSINESS_VALIDATION_CODES)[number];

export type CreativeBusinessValidationIssue = {
  code: CreativeBusinessValidationCode | "unsupported_performance_claim";
  path: string;
  expected?: string;
  actual?: string;
  summary: string;
};

/** Repairable business issues — eligible for one LLM repair retry. */
export const REPAIRABLE_BUSINESS_VALIDATION_CODES = new Set<string>([
  "unapproved_channel",
  "missing_rationale",
  "missing_provenance",
  "missing_key_points",
  "missing_cta_direction",
  "duplicate_deliverable",
  "final_copy_detected",
]);

const PERFORMANCE_PERCENTAGE_CONTEXT =
  /\b(leads?|conversie|conversion|omzet|revenue|groei|growth|roi|roas|cpa|ctr|cvr|kosten|cost|winst|profit|aanvragen|requests|sales|verkopen|traffic|bezoekers|visitors)\b/i;

const PERFORMANCE_CLAIM_WITH_NUMBER =
  /\b(roas|cpa|ctr|cvr)\s*[:=]?\s*\d|\d+\s*x\s*(conversie|conversion|leads?|omzet|revenue|groei|growth)\b|\b\d+\s*(?:%|procent|percent)\s*(?:meer|more|hogere|higher|extra)\b|\b(?:meer|more|hogere|higher|extra)\s*(?:dan|than)?\s*\d+\s*(?:%|procent|percent)\b|\b(?:garandeert|guarantees?|belooft|promises?)\s+\d+\b|\bincreased by\s+\d+\b|\brevenue grew\b/i;

const FINISHED_EMAIL_BODY_PATTERN =
  /(?:^|\n)\s*(?:dear|beste|hi|hello|hoi)\s+[A-ZÀ-ÖØ-Ý][^\n]{0,40},?\s*\n[\s\S]{80,}/im;

const FINISHED_AD_COPY_PATTERN =
  /(?:^|\n)\s*(?:headline|titel|title)\s*[:—-]\s*.+\n\s*(?:description|beschrijving|body|tekst)\s*[:—-]\s*.+/im;

const PUBLISH_READY_COPY_PATTERN =
  /\b(unsubscribe|uitschrijven|click here to buy|limited time offer|beperkte tijd|koop nu|buy now)\b/i;

const PLANNING_DIRECTION_PREFIX =
  /^(?:cta[- ]richting|cta direction|onderwerpregel|subject line(?: direction)?|kernpunten|key points|message direction|boodschap(?:richting)?)\s*[:—-]/i;

function normalizePurpose(purpose: string): string {
  return purpose.toLowerCase().replace(/\s+/g, " ").trim();
}

function collectDeliverableText(deliverable: CreativeGenerationDeliverablePlan): string {
  return [
    deliverable.purpose ?? "",
    deliverable.rationale ?? "",
    deliverable.messageAngle ?? "",
    deliverable.objective ?? "",
    deliverable.callToActionDirection ?? "",
    ...(deliverable.keyPoints ?? []),
  ].join("\n");
}

function isPlanningDirectionText(text: string): boolean {
  const trimmed = text.trim();
  if (PLANNING_DIRECTION_PREFIX.test(trimmed)) return true;
  if (trimmed.length <= 140 && !trimmed.includes("\n") && !FINISHED_EMAIL_BODY_PATTERN.test(trimmed)) {
    return true;
  }
  return false;
}

export function detectFinalCopyInText(text: string, path: string): CreativeBusinessValidationIssue | null {
  const trimmed = text.trim();
  if (!trimmed || isPlanningDirectionText(trimmed)) return null;

  if (PUBLISH_READY_COPY_PATTERN.test(trimmed)) {
    return {
      code: "final_copy_detected",
      path,
      summary: "Output must not include final publish-ready copy.",
    };
  }

  if (FINISHED_EMAIL_BODY_PATTERN.test(trimmed) || FINISHED_AD_COPY_PATTERN.test(trimmed)) {
    return {
      code: "final_copy_detected",
      path,
      summary: "Output must not include final publish-ready copy.",
    };
  }

  const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length >= 4 && trimmed.length >= 320) {
    return {
      code: "final_copy_detected",
      path,
      summary: "Output must not include final publish-ready copy.",
    };
  }

  return null;
}

export function detectUnsupportedNumericClaim(text: string, path: string): CreativeBusinessValidationIssue | null {
  const percentageMatches = text.match(/\b\d{1,3}(?:\.\d+)?%/g) ?? [];
  for (const match of percentageMatches) {
    const index = text.indexOf(match);
    const window = text.slice(Math.max(0, index - 48), index + match.length + 48);
    if (PERFORMANCE_PERCENTAGE_CONTEXT.test(window)) {
      return {
        code: "unsupported_numeric_claim",
        path,
        actual: match,
        summary: "Output must not include unsupported percentage claims.",
      };
    }
  }

  if (PERFORMANCE_CLAIM_WITH_NUMBER.test(text)) {
    return {
      code: "unsupported_performance_claim",
      path,
      summary: "Output must not include unsupported performance claims.",
    };
  }

  return null;
}

export function canonicalizeApprovedChannels(approvedChannels: readonly string[]): CreativeChannelId[] {
  return [
    ...new Set(
      approvedChannels
        .map((value) => normalizeCreativeChannelId(value))
        .filter(Boolean) as CreativeChannelId[]
    ),
  ];
}

export function collectGeneratedChannels(payload: CreativeGenerationLlmPayload): CreativeChannelId[] {
  return (payload.deliverables ?? [])
    .map((deliverable) => normalizeCreativeChannelId(deliverable.channel))
    .filter(Boolean) as CreativeChannelId[];
}

export function findUnmatchedGeneratedChannels(input: {
  approvedChannels: readonly string[];
  payload: CreativeGenerationLlmPayload;
}): CreativeChannelId[] {
  const approved = canonicalizeApprovedChannels(input.approvedChannels);
  if (approved.length === 0) return [];

  const unmatched = new Set<CreativeChannelId>();
  for (const [index, deliverable] of (input.payload.deliverables ?? []).entries()) {
    const channel = normalizeCreativeChannelId(deliverable.channel);
    if (!channel) continue;
    if (!channelMatchesApprovedSelection(channel, approved)) {
      unmatched.add(channel);
    }
    void index;
  }
  return [...unmatched];
}

export function validateCreativeGenerationBusinessRules(
  payload: CreativeGenerationLlmPayload,
  input: { approvedChannels: readonly string[] }
): CreativeBusinessValidationIssue[] {
  const issues: CreativeBusinessValidationIssue[] = [];
  const seenPurposes = new Set<string>();
  const approvedCanonical = canonicalizeApprovedChannels(input.approvedChannels);

  for (const [index, deliverable] of (payload.deliverables ?? []).entries()) {
    const prefix = `deliverables[${index}]`;
    const channel = normalizeCreativeChannelId(deliverable.channel);

    if (
      channel &&
      approvedCanonical.length > 0 &&
      !channelMatchesApprovedSelection(channel, approvedCanonical)
    ) {
      issues.push({
        code: "unapproved_channel",
        path: `${prefix}.channel`,
        expected: approvedCanonical.join(", "),
        actual: channel,
        summary: `${prefix}.channel must match approved channel selections.`,
      });
    }

    if (!deliverable.rationale?.trim()) {
      issues.push({
        code: "missing_rationale",
        path: `${prefix}.rationale`,
        summary: `${prefix}.rationale is required.`,
      });
    }

    if (!deliverable.provenance?.trim()) {
      issues.push({
        code: "missing_provenance",
        path: `${prefix}.provenance`,
        summary: `${prefix}.provenance is required.`,
      });
    }

    if (!Array.isArray(deliverable.keyPoints) || deliverable.keyPoints.length === 0) {
      issues.push({
        code: "missing_key_points",
        path: `${prefix}.keyPoints`,
        summary: `${prefix}.keyPoints must be a non-empty array.`,
      });
    }

    if (!deliverable.callToActionDirection?.trim()) {
      issues.push({
        code: "missing_cta_direction",
        path: `${prefix}.callToActionDirection`,
        summary: `${prefix}.callToActionDirection is required.`,
      });
    }

    const purposeKey = normalizePurpose(deliverable.purpose ?? "");
    if (purposeKey && seenPurposes.has(purposeKey)) {
      issues.push({
        code: "duplicate_deliverable",
        path: `${prefix}.purpose`,
        summary: `${prefix} duplicates an existing deliverable purpose.`,
      });
    }
    if (purposeKey) seenPurposes.add(purposeKey);

    for (const [fieldName, fieldValue] of [
      ["messageAngle", deliverable.messageAngle],
      ["objective", deliverable.objective],
      ["callToActionDirection", deliverable.callToActionDirection],
    ] as const) {
      const copyIssue = detectFinalCopyInText(fieldValue ?? "", `${prefix}.${fieldName}`);
      if (copyIssue) issues.push(copyIssue);
    }

    const longField = [deliverable.messageAngle, deliverable.objective].find((value) => (value?.length ?? 0) > 400);
    if (longField) {
      issues.push({
        code: "final_copy_detected",
        path: prefix,
        summary: `${prefix} must not embed final publish-ready copy.`,
      });
    }
  }

  const aggregateText = (payload.deliverables ?? []).map(collectDeliverableText).join("\n");
  const numericIssue = detectUnsupportedNumericClaim(aggregateText, "deliverables");
  if (numericIssue) issues.push(numericIssue);

  for (const warning of payload.warnings ?? []) {
    const warningIssue =
      detectFinalCopyInText(warning.message ?? "", `warnings`) ??
      detectUnsupportedNumericClaim(warning.message ?? "", "warnings");
    if (warningIssue) issues.push(warningIssue);
  }

  return issues;
}

export function formatBusinessValidationIssueForRepair(issue: CreativeBusinessValidationIssue): string {
  const parts = [`[${issue.code}] ${issue.path}: ${issue.summary}`];
  if (issue.expected) parts.push(`expected=${issue.expected}`);
  if (issue.actual) parts.push(`actual=${issue.actual}`);
  return parts.join(" ");
}

export function summarizeBusinessValidationIssues(
  issues: readonly { code: string }[]
): string {
  if (issues.length === 0) return "passed";
  return issues[0]?.code ?? "business_validation_failed";
}
