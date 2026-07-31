import type { PresenceLine } from "@/lib/design-system/foundation";

/**
 * §4.6 Content, expressed peer-agnostically.
 *
 * The body of work — the most legible proof an AI employee produces. Every
 * Peer produces artefacts (§10): Sales sequences, Support macros, Legal
 * clauses. Only the noun and the preview shape differ.
 */

export const CONTENT_STATES = [
  "planned",
  "draft",
  "awaiting_review",
  // Approved and scheduled are separated only because the work lifecycle
  // carries genuinely distinct `approved` and `scheduled` stages. Without that
  // signal they would stay combined rather than imply a schedule we don't have.
  "approved",
  "scheduled",
  "published",
  "failed",
] as const;

export type ContentState = (typeof CONTENT_STATES)[number];

/** A measured outcome. Only ever present when a live source reports it. */
export type ContentPerformanceStat = {
  label: string;
  value: string;
};

export type ContentFailure = {
  /** In her voice, never an API or HTTP error. */
  voice: string;
  /** What survived. Required — "nothing is lost" is the point. */
  preserved: string;
  retryLabel: string;
};

export type ContentItem = {
  id: string;
  state: ContentState;
  statusLabel: string;
  title: string;
  /** A real excerpt of the actual content. Never a placeholder. */
  preview: string | null;
  channelId: string | null;
  channelLabel: string | null;
  /** Stable id — campaign attribution never matches on title. */
  campaignId: string | null;
  campaignTitle: string | null;
  dateLabel: string | null;
  /** Populated only when a live reporting source supports it (§4.6). */
  performance: ContentPerformanceStat[] | null;
  /** Stated when no source can report on this item yet. */
  performanceAbsence: string | null;
  href: string | null;
  /** Whether this item can enter review mode right now. */
  canReview: boolean;
  failure: ContentFailure | null;
  /** ISO timestamp used for deterministic ordering. Never rendered. */
  sortAt: string | null;
  /** Full body text, searched but not displayed. */
  searchBody: string | null;
};

export type ContentGroup = {
  state: ContentState;
  title: string;
  items: ContentItem[];
};

export type ContentFilterOption = {
  id: string;
  label: string;
  active: boolean;
  href: string;
};

export type ContentFilterGroup = {
  id: "state" | "channel" | "campaign";
  label: string;
  options: ContentFilterOption[];
};

export type ContentFilters = {
  state: ContentState | null;
  channel: string | null;
  campaignId: string | null;
  /** Free-text archive search across title, body, channel, campaign and status. */
  query: string | null;
  page: number;
};

/** Archive page size. Ordering is deterministic so pages never shuffle. */
export const CONTENT_PAGE_SIZE = 24;

export type ContentPagination = {
  page: number;
  pageCount: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
};

export type ContentViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  /** §4.6 Her read on the corpus, not a count. */
  presence: PresenceLine;
  filters: ContentFilters;
  filterGroups: ContentFilterGroup[];
  groups: ContentGroup[];
  totalCount: number;
  pagination: ContentPagination;
  /** Set when a search returned nothing, so the UI can say so specifically. */
  noSearchResults: string | null;
  /** §4.6 Points at the unblock rather than apologising. */
  empty: { voice: string; next: string | null; href: string | null } | null;
  copy: ContentCopy;
};

export type ContentCopy = {
  title: string;
  subtitle: string;
  stateLabel: string;
  channelLabel: string;
  campaignLabel: string;
  allLabel: string;
  reviewCta: string;
  approveCta: string;
  askForChangesCta: string;
  openCta: string;
  noOutcomeYet: string;
  reviewTitle: string;
  changesPlaceholder: string;
  changesHint: string;
  cancelCta: string;
  searchLabel: string;
  searchPlaceholder: string;
  noResults: (query: string) => string;
  pageLabel: (page: number, total: number) => string;
  prevPage: string;
  nextPage: string;
  /** What this destination will hold once she has produced anything. */
  futureHeading: string;
  futurePromise: string;
};

/** Length of the excerpt shown on a card before it is truncated. */
export const CONTENT_PREVIEW_CHARS = 180;
