import type { PresenceLine } from "@/lib/design-system/foundation";

/**
 * §4.1 The Desk, expressed peer-agnostically.
 *
 * Every Peer produces this same shape (§10) — only the work noun differs. A
 * Sales adapter fills `decisions` from deals, a Support adapter from cases,
 * and the view never changes.
 */

export type DeskDecision = {
  id: string;
  title: string;
  /** §4.1 What approving unblocks. Makes the decision informed, not obedient. */
  unblocks: string;
  primaryLabel: string;
  href: string;
  /** Mono age label. Null when the age is not meaningful. */
  ageLabel: string | null;
};

export type DeskInFlightItem = {
  id: string;
  /** What she is doing, in her words. */
  what: string;
  nextStep: string | null;
  /** §4.1 No progress bars unless a real step count exists. */
  expected: string | null;
  href: string | null;
};

export type DeskCompletedItem = {
  id: string;
  label: string;
  /**
   * The campaign this outcome belongs to.
   *
   * Outcomes are deduplicated by campaign and category, so their labels are
   * canonical ("Content published") rather than unique. Without the campaign
   * beside it the list reads as a set of stubs; with it, each line says what
   * actually happened.
   */
  context: string | null;
  timeLabel: string | null;
  href: string | null;
};

/** §4.1a Present only when every earning condition is met. */
export type DeskAutonomyRequest = {
  id: string;
  boundaryId: string;
  evidence: string;
  proposal: string;
  scope: string;
  impact: string;
  reassurance: string;
};

export type DeskViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  presence: PresenceLine | null;
  decisions: DeskDecision[];
  inFlight: DeskInFlightItem[];
  completed: DeskCompletedItem[];
  autonomyRequest: DeskAutonomyRequest | null;
  /** §4.1 The ideal state. Set only when there is genuinely nothing to act on. */
  empty: { voice: string; next: string | null } | null;
  copy: DeskCopy;
};

export type DeskCopy = {
  decisionsHeading: (count: number) => string;
  inFlightHeading: string;
  completedHeading: string;
  viewAllCompleted: string;
  askPlaceholderName: string;
  askPlaceholder: string;
  rightNowHeading: string;
  openCampaign: string;
};

/** §4.1 Completed items collapse past five — history is not presence. */
export const DESK_COMPLETED_VISIBLE = 5;
