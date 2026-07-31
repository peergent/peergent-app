import type { PresenceLine } from "@/lib/design-system/foundation";

/**
 * §4.5 Performance, expressed peer-agnostically.
 *
 * Interrogation mode: the customer wants to reach their own conclusion, not
 * receive one. Depth is unrestricted; every number carries its interpretation.
 */

/* ---------------- Filters (§4.5: period, campaign, channel, content type) --- */

export const PERFORMANCE_PERIODS = ["7d", "30d", "90d", "all"] as const;
export type PerformancePeriod = (typeof PERFORMANCE_PERIODS)[number];

export const PERIOD_DAYS: Record<PerformancePeriod, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

export type PerformanceFilters = {
  period: PerformancePeriod;
  campaignId: string | null;
  channel: string | null;
  contentType: string | null;
};

export const DEFAULT_PERFORMANCE_FILTERS: PerformanceFilters = {
  period: "30d",
  campaignId: null,
  channel: null,
  contentType: null,
};

export type PerformanceFilterOption = {
  id: string;
  label: string;
  active: boolean;
  /** URL-reflected so a filtered view is shareable (§4.5). */
  href: string;
};

export type PerformanceFilterGroup = {
  id: "period" | "campaign" | "channel" | "contentType";
  label: string;
  options: PerformanceFilterOption[];
};

/* ---------------- Observed facts, kept separate from interpretation -------- */

/**
 * A measured value. `source` records where it came from so the UI can be
 * explicit about what is internally counted versus channel-reported.
 */
export type PerformanceMetric = {
  id: string;
  label: string;
  value: string;
  /** Present only when genuinely computable against the previous period. */
  comparison: {
    direction: "up" | "down" | "flat";
    label: string;
  } | null;
  /** What this number is counted from. Shown as methodology (§4.5). */
  methodology: string;
  source: "counted" | "channel";
};

export type PerformanceTrendPoint = {
  at: string;
  value: number;
};

export type PerformanceTrend = {
  label: string;
  points: PerformanceTrendPoint[];
  methodology: string;
} | null;

export type PerformanceCutRow = {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  share: string | null;
  href: string | null;
};

export type PerformanceCut = {
  id: string;
  title: string;
  valueHeader: string;
  rows: PerformanceCutRow[];
  methodology: string;
};

/* ---------------- Honest gaps (§4.5) -------------------------------------- */

export type PerformanceGap = {
  id: string;
  /** What she cannot see. */
  missing: string;
  /** The specific insight connecting it would unlock. */
  unlocks: string;
  ctaLabel: string;
  ctaHref: string;
};

/* ---------------- Interpretation, explicitly separated -------------------- */

/**
 * §4.5 Clear separation between observed fact, interpretation and
 * recommendation. A signal may only be constructed from a measured value.
 */
export type PerformanceSignal = {
  id: string;
  /** The observed fact, stated plainly. */
  fact: string;
  /** What she makes of it. Never rendered without `fact` behind it. */
  interpretation: string;
  /** What she would do. Optional — not every reading implies an action. */
  recommendation: string | null;
  /** Relative size of the movement, used to decide whether it is notable. */
  magnitude: number;
  /** Optional benchmark context (§4.5). */
  benchmark: string | null;
};

export type PerformanceViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  /** §4.5 Her read on the *current filtered view*, produced by the grounding gate. */
  presence: PresenceLine;
  filters: PerformanceFilters;
  filterGroups: PerformanceFilterGroup[];
  /** §4.5 Four metrics maximum. */
  metrics: PerformanceMetric[];
  trend: PerformanceTrend;
  cuts: PerformanceCut[];
  gaps: PerformanceGap[];
  signals: PerformanceSignal[];
  copy: PerformanceCopy;
};

export type PerformanceCopy = {
  title: string;
  subtitle: string;
  periodLabel: string;
  campaignLabel: string;
  channelLabel: string;
  contentTypeLabel: string;
  allLabel: string;
  gapsHeading: string;
  trendHeading: string;
  methodologyPrefix: string;
  observedHeading: string;
  connectLabel: string;
  /** Section title for measurements that do not exist yet. */
  futureHeading: string;
  /** Why a chart is empty — stated once, never as a per-chart apology. */
  notReportedYet: string;
  trendFuture: string;
  /** Turns a gap's fragment into a sentence in her voice. */
  willShow: (what: string) => string;
};

/** §4.5 Below this, a reading is an early read rather than a conclusion. */
export const MIN_DAYS_FOR_CONCLUSION = 7;

/** A movement smaller than this is not notable enough to interpret. */
export const NOTABLE_MAGNITUDE = 0.15;
