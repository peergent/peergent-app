export type ParsedMarketingCreativeDirection = {
  readonly campaignConcept: string;
  readonly campaignAngle: string;
  readonly toneOfVoice: {
    readonly directive: string;
    readonly traits: readonly string[];
    readonly avoid: readonly string[];
  };
  readonly visualDirection: {
    readonly summary: string;
    readonly mustInclude: readonly string[];
    readonly mustAvoid: readonly string[];
  };
  readonly messagingHierarchy: {
    readonly primaryMessage: string;
    readonly supportingMessages: readonly string[];
    readonly proofPoints: readonly string[];
  };
  readonly ctaDirection: {
    readonly primary: string;
    readonly secondary?: string;
  };
  readonly mandatoryBrandConstraints: {
    readonly forbiddenClaims: readonly string[];
    readonly forbiddenWords: readonly string[];
    readonly requiredDisclaimers: readonly string[];
  };
  readonly creativeRecommendations: readonly string[];
};

export type ParseMarketingCreativeBriefResult =
  | { success: true; direction: ParsedMarketingCreativeDirection; warnings: string[] }
  | { success: false; error: string; warnings: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown, field: string, warnings: string[]): string | null {
  if (typeof value !== "string" || !value.trim()) {
    warnings.push(`Missing or invalid string for ${field}.`);
    return null;
  }
  return value.trim();
}

function asStringArray(value: unknown, field: string, warnings: string[]): string[] {
  if (!Array.isArray(value)) {
    warnings.push(`Expected array for ${field}.`);
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export function parseMarketingCreativeBriefResponse(text: string): ParseMarketingCreativeBriefResult {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    return { success: false, error: "Creative direction response was not valid JSON.", warnings };
  }

  if (!isRecord(parsed)) {
    return { success: false, error: "Creative direction response must be a JSON object.", warnings };
  }

  const campaignConcept = asString(parsed.campaignConcept, "campaignConcept", warnings);
  const campaignAngle = asString(parsed.campaignAngle, "campaignAngle", warnings);
  if (!campaignConcept || !campaignAngle) {
    return {
      success: false,
      error: "Creative direction is missing campaign concept or angle.",
      warnings,
    };
  }

  const toneRaw = parsed.toneOfVoice;
  const toneDirective = isRecord(toneRaw)
    ? asString(toneRaw.directive, "toneOfVoice.directive", warnings)
    : null;
  if (!toneDirective) {
    return { success: false, error: "Creative direction is missing tone of voice.", warnings };
  }

  const visualRaw = parsed.visualDirection;
  const visualSummary = isRecord(visualRaw)
    ? asString(visualRaw.summary, "visualDirection.summary", warnings)
    : null;
  if (!visualSummary) {
    return { success: false, error: "Creative direction is missing visual direction.", warnings };
  }

  const msgRaw = parsed.messagingHierarchy;
  const primaryMessage = isRecord(msgRaw)
    ? asString(msgRaw.primaryMessage, "messagingHierarchy.primaryMessage", warnings)
    : null;
  if (!primaryMessage) {
    return { success: false, error: "Creative direction is missing messaging hierarchy.", warnings };
  }

  const ctaRaw = parsed.ctaDirection;
  const ctaPrimary = isRecord(ctaRaw) ? asString(ctaRaw.primary, "ctaDirection.primary", warnings) : null;
  if (!ctaPrimary) {
    return { success: false, error: "Creative direction is missing CTA guidance.", warnings };
  }

  const constraintsRaw = parsed.mandatoryBrandConstraints;
  const forbiddenClaims = isRecord(constraintsRaw)
    ? asStringArray(constraintsRaw.forbiddenClaims, "mandatoryBrandConstraints.forbiddenClaims", warnings)
    : [];
  const forbiddenWords = isRecord(constraintsRaw)
    ? asStringArray(constraintsRaw.forbiddenWords, "mandatoryBrandConstraints.forbiddenWords", warnings)
    : [];
  const requiredDisclaimers = isRecord(constraintsRaw)
    ? asStringArray(
        constraintsRaw.requiredDisclaimers,
        "mandatoryBrandConstraints.requiredDisclaimers",
        warnings
      )
    : [];

  return {
    success: true,
    direction: {
      campaignConcept,
      campaignAngle,
      toneOfVoice: {
        directive: toneDirective,
        traits: isRecord(toneRaw) ? asStringArray(toneRaw.traits, "toneOfVoice.traits", warnings) : [],
        avoid: isRecord(toneRaw) ? asStringArray(toneRaw.avoid, "toneOfVoice.avoid", warnings) : [],
      },
      visualDirection: {
        summary: visualSummary,
        mustInclude: isRecord(visualRaw)
          ? asStringArray(visualRaw.mustInclude, "visualDirection.mustInclude", warnings)
          : [],
        mustAvoid: isRecord(visualRaw)
          ? asStringArray(visualRaw.mustAvoid, "visualDirection.mustAvoid", warnings)
          : [],
      },
      messagingHierarchy: {
        primaryMessage,
        supportingMessages: isRecord(msgRaw)
          ? asStringArray(msgRaw.supportingMessages, "messagingHierarchy.supportingMessages", warnings)
          : [],
        proofPoints: isRecord(msgRaw)
          ? asStringArray(msgRaw.proofPoints, "messagingHierarchy.proofPoints", warnings)
          : [],
      },
      ctaDirection: {
        primary: ctaPrimary,
        ...(isRecord(ctaRaw) && typeof ctaRaw.secondary === "string" && ctaRaw.secondary.trim()
          ? { secondary: ctaRaw.secondary.trim() }
          : {}),
      },
      mandatoryBrandConstraints: {
        forbiddenClaims,
        forbiddenWords,
        requiredDisclaimers,
      },
      creativeRecommendations: asStringArray(
        parsed.creativeRecommendations,
        "creativeRecommendations",
        warnings
      ),
    },
    warnings,
  };
}
