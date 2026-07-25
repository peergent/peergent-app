import type { ContextPackage } from "@/lib/intelligence";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";
import type { BrandBrainContextSlice } from "@/lib/brand-brain/types";
import { emptyBrandBrainContextSlice } from "@/lib/intelligence/types/brand-brain-context-slice";
import type { MarketingDecisionSource } from "@/lib/marketing-decision";
import { assembleMarketingDecision } from "@/lib/marketing-decision";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import { sanitizeDevDisplayList, sanitizeDevDisplayText } from "./brand-brain-inspector-view";

export type DevMarketingDecisionControls = {
  readonly objective: string;
  readonly requestedChannelId?: string;
  readonly requestedContentTypeId?: string;
};

export type DevMarketingDecisionSourceBuildResult = {
  readonly source: MarketingDecisionSource;
  readonly assumptions: readonly string[];
  readonly missingFromContext: readonly string[];
};

/** Conservative dev-only mapping — no strategy, plan, budget, or performance invention. */
export function buildDevMarketingDecisionSourceFromContextPackage(input: {
  contextPackage: ContextPackage;
  controls: DevMarketingDecisionControls;
}): DevMarketingDecisionSourceBuildResult {
  const { contextPackage, controls } = input;
  const scope = contextPackage.scope;
  const assumptions: string[] = [
    "Development playground uses conservative responsibility policy (approval before publication, semi-autonomous).",
    "No Marketing Strategy or Plan loaded from ContextPackage — decision gaps expected unless you add fixtures later.",
    "Budget limit not inferred — paid channels may be restricted when no budget constraint is supplied.",
  ];
  const missingFromContext: string[] = [];

  const companyDna = contextPackage.slices.companyDna as CompanyDnaContextSlice | undefined;
  const businessBrain = contextPackage.slices.businessBrain as
    | BusinessBrainContextSlice
    | undefined;
  const marketingUnderstanding = contextPackage.slices
    .marketingUnderstanding as MarketingUnderstandingContextSlice | undefined;
  const brandBrain = contextPackage.slices.brandBrain as BrandBrainContextSlice | undefined;

  if (!marketingUnderstanding?.available) {
    missingFromContext.push("marketingUnderstanding");
  }
  if (!companyDna?.available) {
    missingFromContext.push("companyDna");
  }
  if (!businessBrain?.available) {
    missingFromContext.push("businessBrain");
  }
  if (!brandBrain?.available) {
    missingFromContext.push("brandBrain");
  }

  missingFromContext.push("marketingStrategy", "marketingPlan", "planActivity", "responsibilityPolicyFromDb");

  const assembledAt = scope.requestedAt;

  const objective =
    sanitizeDevDisplayText(controls.objective.trim()) ||
    sanitizeDevDisplayText(scope.peer.objective) ||
    "Development validation objective (explicit playground input required)";

  if (!controls.objective.trim()) {
    assumptions.push("Objective falls back to peer objective or development placeholder — set explicit objective text.");
  }

  const source: MarketingDecisionSource = {
    organizationId: scope.organization.organizationId,
    peerId: scope.peer.peerId,
    peerRole: scope.peer.role,
    objective,
    assembledAt,
    context: {
      companyDnaAvailable: companyDna?.available,
      businessBrainAvailable: businessBrain?.available,
      businessBrainSparse: businessBrain?.sparse,
      marketingUnderstandingAvailable: marketingUnderstanding?.available,
      marketingUnderstandingCompleteness: marketingUnderstanding?.completeness,
      marketingUnderstandingSparse: marketingUnderstanding?.sparse,
      marketingUnderstandingGaps: marketingUnderstanding?.gaps,
      brandBrainAvailable: brandBrain?.available,
      brandForbiddenPhrases: brandBrain?.snapshot.voice?.forbiddenPhrases,
      brandPreferredCtaPatterns: brandBrain?.snapshot.voice?.preferredCtaPatterns,
      customerSegmentCount: marketingUnderstanding?.customerSegments?.length ?? 0,
    },
    responsibilityPolicy: {
      responsibilities: [
        {
          category: "linkedin",
          enabled: true,
          approvalPolicy: "approval_required",
          autonomyLevel: "semi_autonomous",
        },
        {
          category: "content_marketing",
          enabled: true,
          approvalPolicy: "approval_required",
          autonomyLevel: "semi_autonomous",
        },
      ],
    },
    requestedChannel: controls.requestedChannelId?.trim() || undefined,
    requestedContentType: controls.requestedContentTypeId?.trim() || undefined,
  };

  return { source, assumptions, missingFromContext };
}

export type MarketingDecisionRecommendationView = {
  readonly id: string;
  readonly label: string;
  readonly status: string;
  readonly rank: number;
  readonly score: number;
  readonly evidenceLabels: string[];
  readonly constraints: string[];
  readonly kind: "recommendation" | "constraint";
};

export type MarketingDecisionInspectorView = {
  readonly available: boolean;
  readonly status: string;
  readonly objective: string;
  readonly eligibility: {
    canExecute: boolean;
    canGenerateCreative: boolean;
    canPublish: boolean;
    blockedReasons: string[];
  };
  readonly readiness: {
    ready: boolean;
    understandingCompleteness: number;
    maxConfidence: string;
    warnings: string[];
  };
  readonly approvalPolicy: {
    mode: string;
    brandReviewRequired: boolean;
    legalReviewRequired: boolean;
    reasons: string[];
  };
  readonly budgetPolicy: {
    maxMonthlySpend: string;
    paidChannelsAllowed: boolean;
    spendAutonomous: boolean;
    reasons: string[];
  };
  readonly channelRecommendations: MarketingDecisionRecommendationView[];
  readonly contentTypeRecommendations: MarketingDecisionRecommendationView[];
  readonly ctaStrategy: {
    primaryPattern: string;
    secondaryPattern: string;
    constraints: string[];
  };
  readonly creativeVolume: {
    recommendedCount: number;
    minimumCount: number;
    maximumCount: number;
    rationale: string;
  };
  readonly forbiddenClaims: string[];
  readonly forbiddenWords: string[];
  readonly disclaimers: string[];
  readonly evidence: string[];
  readonly gaps: string[];
  readonly assumptions: string[];
  readonly missingFromContext: string[];
  readonly hardConstraints: string[];
  readonly rawJson: string;
};

function mapRecommendation(
  item: MarketingDecisionRecord["channelRecommendations"][number],
  kind: "recommendation" | "constraint"
): MarketingDecisionRecommendationView {
  return {
    id: item.id,
    label: sanitizeDevDisplayText(item.label),
    status: item.status,
    rank: item.rank,
    score: item.score,
    evidenceLabels: sanitizeDevDisplayList(item.evidence.map((e) => e.label)),
    constraints: sanitizeDevDisplayList(item.constraints),
    kind: item.status === "BLOCKED" || (item.constraints?.length ?? 0) > 0 ? "constraint" : kind,
  };
}

export function presentMarketingDecisionInspectorView(input: {
  record: MarketingDecisionRecord | null;
  assumptions?: readonly string[];
  missingFromContext?: readonly string[];
}): MarketingDecisionInspectorView | null {
  if (!input.record) {
    return null;
  }

  const record = input.record;
  const hardConstraints = [
    ...record.constraints.hardBlocks,
    ...record.eligibility.blockedReasons,
  ];

  return {
    available: true,
    status: record.status,
    objective: sanitizeDevDisplayText(record.objective),
    eligibility: {
      canExecute: record.eligibility.canExecute,
      canGenerateCreative: record.eligibility.canGenerateCreative,
      canPublish: record.eligibility.canPublish,
      blockedReasons: sanitizeDevDisplayList(record.eligibility.blockedReasons),
    },
    readiness: {
      ready: record.readiness.ready,
      understandingCompleteness: record.readiness.understandingCompleteness,
      maxConfidence: record.readiness.maxConfidence,
      warnings: sanitizeDevDisplayList(record.readiness.warnings),
    },
    approvalPolicy: {
      mode: record.approvalPolicy.mode,
      brandReviewRequired: record.approvalPolicy.brandReviewRequired,
      legalReviewRequired: record.approvalPolicy.legalReviewRequired,
      reasons: sanitizeDevDisplayList(record.approvalPolicy.reasons),
    },
    budgetPolicy: {
      maxMonthlySpend:
        record.budgetPolicy.maxMonthlySpend === null
          ? "Not set (dev playground)"
          : String(record.budgetPolicy.maxMonthlySpend),
      paidChannelsAllowed: record.budgetPolicy.paidChannelsAllowed,
      spendAutonomous: record.budgetPolicy.spendAutonomous,
      reasons: sanitizeDevDisplayList(record.budgetPolicy.reasons),
    },
    channelRecommendations: record.channelRecommendations.map((item) =>
      mapRecommendation(item, "recommendation")
    ),
    contentTypeRecommendations: record.contentTypeRecommendations.map((item) => ({
      id: item.id,
      label: sanitizeDevDisplayText(item.label),
      status: item.status,
      rank: item.rank,
      score: item.score,
      evidenceLabels: sanitizeDevDisplayList(item.evidence.map((e) => e.label)),
      constraints: sanitizeDevDisplayList(item.constraints),
      kind:
        item.status === "BLOCKED" || (item.constraints?.length ?? 0) > 0
          ? "constraint"
          : "recommendation",
    })),
    ctaStrategy: {
      primaryPattern: sanitizeDevDisplayText(record.ctaStrategy.primaryPattern),
      secondaryPattern: sanitizeDevDisplayText(record.ctaStrategy.secondaryPattern),
      constraints: sanitizeDevDisplayList(record.ctaStrategy.constraints),
    },
    creativeVolume: { ...record.creativeVolume },
    forbiddenClaims: sanitizeDevDisplayList(record.forbiddenClaims),
    forbiddenWords: sanitizeDevDisplayList(record.forbiddenWords),
    disclaimers: sanitizeDevDisplayList(
      record.requiredDisclaimers.map((d) => d.text)
    ),
    evidence: sanitizeDevDisplayList(record.evidence.map((e) => `${e.kind}: ${e.label}`)),
    gaps: sanitizeDevDisplayList(record.gaps),
    assumptions: sanitizeDevDisplayList(input.assumptions ?? []),
    missingFromContext: sanitizeDevDisplayList(input.missingFromContext ?? []),
    hardConstraints: sanitizeDevDisplayList(hardConstraints),
    rawJson: JSON.stringify(record, null, 2),
  };
}

export function assembleDevMarketingDecision(input: {
  contextPackage: ContextPackage;
  controls: DevMarketingDecisionControls;
}): {
  record: MarketingDecisionRecord;
  build: DevMarketingDecisionSourceBuildResult;
} {
  const build = buildDevMarketingDecisionSourceFromContextPackage(input);
  const record = assembleMarketingDecision(build.source);
  return { record, build };
}

export function sanitizeDevAssemblyError(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof error.code === "string" ? error.code : error.name;
    return {
      code,
      message: sanitizeDevDisplayText(error.message) || "Creative brief assembly failed.",
    };
  }
  return { code: "UNKNOWN", message: "Creative brief assembly failed." };
}
