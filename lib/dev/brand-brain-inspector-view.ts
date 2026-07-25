import type { BrandBrainContextSlice, BrandBrainGap } from "@/lib/brand-brain/types";
import type { SourceRef } from "@/lib/context-engine/types/sources";

const REDACTED = "[redacted]";

const SENSITIVE_DISPLAY_PATTERNS: RegExp[] = [
  /\bsupabase\b/i,
  /\bpostgres(?:ql)?\b/i,
  /\bPGRST\d+/i,
  /\bservice_role\b/i,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /\bapikey\b/i,
  /\bsecret\b/i,
  /\bpassword\b/i,
];

export function sanitizeDevDisplayText(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return "";
  }
  for (const pattern of SENSITIVE_DISPLAY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return REDACTED;
    }
  }
  return trimmed;
}

export function sanitizeDevDisplayList(values: readonly string[] | undefined): string[] {
  if (!values?.length) {
    return [];
  }
  return values.map((entry) => sanitizeDevDisplayText(entry)).filter(Boolean);
}

export type BrandBrainInspectorModuleState = "present" | "empty" | "missing";

export type BrandBrainInspectorView = {
  availability: {
    available: boolean;
    degraded: boolean;
    completeness: number;
    assembledAt: string;
  };
  identity: {
    organizationName: string;
    story: string;
    positioning: string;
    tagline: string;
    valueProposition: string;
    keyMessages: string[];
    marketCategory: string;
    moduleState: BrandBrainInspectorModuleState;
  };
  voice: {
    summary: string;
    personalityTraits: string[];
    dos: string[];
    donts: string[];
    preferredCtaPatterns: string[];
    forbiddenPhrases: string[];
    emojiPolicy: string;
    moduleState: BrandBrainInspectorModuleState;
  };
  visualIdentity: {
    colors: { state: BrandBrainInspectorModuleState; items: readonly unknown[] };
    typography: { state: BrandBrainInspectorModuleState; items: readonly unknown[] };
    logoRules: { state: BrandBrainInspectorModuleState; items: readonly unknown[] };
  };
  creativeRules: {
    layoutConstraints: { state: BrandBrainInspectorModuleState; items: readonly unknown[] };
    hierarchyNote: string;
    channelConstraintsNote: string;
    safeAreasNote: string;
  };
  assetReferences: {
    moduleState: BrandBrainInspectorModuleState;
    items: readonly unknown[];
  };
  gaps: BrandBrainGap[];
  sources: Array<{ id: string; label: string; type: string; freshness: string }>;
  warnings: string[];
  rawJson: string;
};

function moduleStateFromGap(
  gap: BrandBrainGap,
  gaps: readonly BrandBrainGap[],
  hasContent: boolean
): BrandBrainInspectorModuleState {
  if (gaps.includes(gap)) {
    return "missing";
  }
  return hasContent ? "present" : "empty";
}

function visualSubmoduleState(
  gap: BrandBrainGap,
  gaps: readonly BrandBrainGap[],
  count: number
): { state: BrandBrainInspectorModuleState; items: readonly unknown[] } {
  const items: readonly unknown[] = count > 0 ? Array(count).fill(null) : [];
  if (gaps.includes(gap)) {
    return { state: "missing", items: [] };
  }
  return { state: count > 0 ? "present" : "empty", items };
}

export function isBrandBrainDegraded(
  slice: BrandBrainContextSlice | undefined,
  sources: readonly SourceRef[],
  warnings: readonly string[]
): boolean {
  if (!slice) {
    return true;
  }
  if (slice.available) {
    return false;
  }
  const sourceLabels = sources.map((s) => s.label.toLowerCase());
  if (sourceLabels.some((label) => label.includes("unavailable"))) {
    return true;
  }
  return warnings.some((w) => w.toLowerCase().includes("brand brain unavailable"));
}

export function filterBrandBrainSources(sources: readonly SourceRef[]): SourceRef[] {
  return sources.filter(
    (source) =>
      source.id.startsWith("brand-brain") ||
      source.label.toLowerCase().includes("brand brain")
  );
}

export function filterBrandBrainWarnings(warnings: readonly string[]): string[] {
  return warnings.filter((warning) => warning.toLowerCase().includes("brand brain"));
}

export function presentBrandBrainInspectorView(input: {
  slice: BrandBrainContextSlice | undefined;
  sources?: readonly SourceRef[];
  warnings?: readonly string[];
  organizationName?: string;
}): BrandBrainInspectorView | null {
  const { slice, organizationName } = input;
  if (!slice) {
    return null;
  }

  const brandSources = filterBrandBrainSources(input.sources ?? []);
  const brandWarnings = sanitizeDevDisplayList(
    filterBrandBrainWarnings(input.warnings ?? [])
  );
  const degraded = isBrandBrainDegraded(slice, brandSources, brandWarnings);

  const snapshot = slice.snapshot;
  const identity = snapshot.identity;
  const voice = snapshot.voice;
  const visual = snapshot.visualIdentity;
  const creative = snapshot.creativeRules;
  const assets = snapshot.assetReferences ?? [];

  const colors = visual?.colors ?? [];
  const typography = visual?.typography ?? [];
  const logoRules = visual?.logoRules ?? [];
  const layouts = creative?.layoutConstraints ?? [];

  const identityHasContent = Boolean(
    identity?.story ||
      identity?.positioningStatement ||
      identity?.tagline ||
      identity?.valueProposition ||
      identity?.marketCategory ||
      (identity?.keyMessages?.length ?? 0) > 0
  );

  const voiceHasContent = Boolean(
    voice?.summary ||
      (voice?.personalityTraits?.length ?? 0) > 0 ||
      (voice?.dos?.length ?? 0) > 0 ||
      (voice?.donts?.length ?? 0) > 0 ||
      (voice?.preferredCtaPatterns?.length ?? 0) > 0 ||
      (voice?.forbiddenPhrases?.length ?? 0) > 0
  );

  const safeSliceForJson: BrandBrainContextSlice = {
    ...slice,
    snapshot: slice.snapshot,
  };

  return {
    availability: {
      available: slice.available,
      degraded,
      completeness: slice.completeness,
      assembledAt: slice.assembledAt,
    },
    identity: {
      organizationName: sanitizeDevDisplayText(
        organizationName ?? snapshot.profile?.name ?? ""
      ),
      story: sanitizeDevDisplayText(identity?.story),
      positioning: sanitizeDevDisplayText(identity?.positioningStatement),
      tagline: sanitizeDevDisplayText(identity?.tagline),
      valueProposition: sanitizeDevDisplayText(identity?.valueProposition),
      keyMessages: sanitizeDevDisplayList(identity?.keyMessages),
      marketCategory: sanitizeDevDisplayText(identity?.marketCategory),
      moduleState: moduleStateFromGap("identity", slice.gaps, identityHasContent),
    },
    voice: {
      summary: sanitizeDevDisplayText(voice?.summary),
      personalityTraits: sanitizeDevDisplayList(voice?.personalityTraits),
      dos: sanitizeDevDisplayList(voice?.dos),
      donts: sanitizeDevDisplayList(voice?.donts),
      preferredCtaPatterns: sanitizeDevDisplayList(voice?.preferredCtaPatterns),
      forbiddenPhrases: sanitizeDevDisplayList(voice?.forbiddenPhrases),
      emojiPolicy: sanitizeDevDisplayText(voice?.emojiPolicy ?? ""),
      moduleState: moduleStateFromGap("voice", slice.gaps, voiceHasContent),
    },
    visualIdentity: {
      colors: {
        ...visualSubmoduleState("visual-colors", slice.gaps, colors.length),
        items: colors,
      },
      typography: {
        ...visualSubmoduleState("visual-typography", slice.gaps, typography.length),
        items: typography,
      },
      logoRules: {
        ...visualSubmoduleState("logo-rules", slice.gaps, logoRules.length),
        items: logoRules,
      },
    },
    creativeRules: {
      layoutConstraints: {
        ...visualSubmoduleState("layout-constraints", slice.gaps, layouts.length),
        items: layouts,
      },
      hierarchyNote:
        "Hierarchy rules are not modeled separately in Brand Brain v1; infer from voice and layout constraints.",
      channelConstraintsNote:
        layouts.length > 0
          ? "Channel constraints are listed per layout constraint entry."
          : slice.gaps.includes("layout-constraints")
            ? "Missing — gap: layout-constraints"
            : "No channel constraints recorded.",
      safeAreasNote:
        layouts.some((layout) => layout.safeAreaInsetsPx)
          ? "Safe areas are defined on one or more layout constraints."
          : slice.gaps.includes("layout-constraints")
            ? "Missing — gap: layout-constraints"
            : "No safe area insets recorded.",
    },
    assetReferences: {
      moduleState: moduleStateFromGap(
        "asset-references",
        slice.gaps,
        assets.length > 0
      ),
      items: assets,
    },
    gaps: [...slice.gaps],
    sources: brandSources.map((source) => ({
      id: source.id,
      label: sanitizeDevDisplayText(source.label),
      type: source.type,
      freshness: source.freshness,
    })),
    warnings: brandWarnings,
    rawJson: JSON.stringify(safeSliceForJson, null, 2),
  };
}
