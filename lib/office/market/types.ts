import type { PresenceLine } from "@/lib/design-system/foundation";
import type {
  DataSourceId,
  EvidenceCategory,
  QualitativeConfidence,
} from "@/lib/website-intelligence/types";

/**
 * §4.7 Market, expressed peer-agnostically.
 *
 * The only destination about the world rather than about you. It exists to
 * elevate the Peer from executor to advisor — not to become a second
 * analytics dashboard. Market awareness and performance analytics stay
 * strictly separate: nothing here reports on the customer's own results.
 *
 * The evidence vocabulary is reused from website-intelligence rather than
 * redefined: `observed` is a fact, `likely` is an inference, and
 * `unknown` / `requires-more-data` are honest absences.
 */

export type MarketEvidence = EvidenceCategory;
export type MarketSource = DataSourceId;

/** Anything the Peer states about the outside world, with its provenance. */
export type MarketObservation = {
  id: string;
  /** What is being claimed. */
  statement: string;
  /** Fact, inference, or acknowledged gap — never blurred. */
  evidence: MarketEvidence;
  source: MarketSource;
  sourceLabel: string;
  /** Which competitor this concerns, by stable id. Null when general. */
  competitorId: string | null;
};

/** A competitor as the customer's own knowledge describes them. */
export type MarketCompetitor = {
  /** Stable id. Competitors are never matched by display name. */
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  /** True when the record carries nothing beyond a name. */
  isThin: boolean;
};

/**
 * §4.7 The customer's own standing, shown only when the inputs are genuinely
 * comparable. Positioning here is *stated* positioning drawn from the
 * customer's own knowledge — never a measured or scored market position.
 */
export type MarketPosition = {
  /** How the customer describes themselves. */
  ownStatement: string;
  ownDifferentiators: string[];
  /** What each competitor leads with, for side-by-side reading. */
  competitors: { id: string; name: string; leadsWith: string[] }[];
  /** Always shown: this is stated positioning, not measured share. */
  caveat: string;
};

/** Why no position comparison is available, when there is none. */
export type MarketPositionUnavailable = {
  reason: string;
};

export type MarketFreshness = {
  /** ISO timestamp of the knowledge this page is built from. */
  assembledAt: string | null;
  label: string | null;
  /** True once the underlying knowledge is older than the staleness window. */
  isStale: boolean;
  staleNotice: string | null;
  /**
   * Reserved for website-intelligence's ConfidenceSnapshot. Currently null: that
   * snapshot is not reachable from the domain input, and approximating it from
   * a different signal would misrepresent its meaning.
   */
  confidence: QualitativeConfidence | null;
  /** Set when competitor knowledge is explicitly flagged incomplete. */
  knownGap: string | null;
};

/** Emma's reading — always separated from the facts it rests on. */
export type MarketInterpretation = {
  /** The observations this reading is built from, by id. */
  basedOn: string[];
  text: string;
  recommendation: string | null;
};

export type MarketViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  presence: PresenceLine;
  competitors: MarketCompetitor[];
  /** Facts, kept apart from inferences in the UI. */
  observedFacts: MarketObservation[];
  /** Inferences, explicitly labelled as such. */
  inferences: MarketObservation[];
  interpretation: MarketInterpretation | null;
  position: MarketPosition | null;
  positionUnavailable: MarketPositionUnavailable | null;
  freshness: MarketFreshness;
  /** Set when there are no competitors recorded at all. */
  noCompetitors: { voice: string; next: string; ctaLabel: string; ctaHref: string } | null;
  /** Set when competitors exist but carry too little to say anything. */
  partialData: string | null;
  copy: MarketCopy;
};

export type MarketCopy = {
  title: string;
  subtitle: string;
  competitorsHeading: string;
  observedHeading: string;
  inferredHeading: string;
  interpretationHeading: string;
  positionHeading: string;
  strengthsLabel: string;
  weaknessesLabel: string;
  differentiatorsLabel: string;
  youLabel: string;
  sourceLabel: (source: string) => string;
  evidenceObserved: string;
  evidenceLikely: string;
  thinRecord: string;
  /** What this destination will hold once competitors are recorded. */
  futureHeading: string;
  futurePromise: string;
  /** Heading above her recommendation. Held here so it is audited as copy. */
  recommendationHeading: string;
};

/** Knowledge older than this is flagged as stale rather than presented as current. */
export const MARKET_STALE_AFTER_DAYS = 30;

/** Below this, the competitor set is too small to compare positions against. */
export const MIN_COMPETITORS_FOR_POSITION = 2;
