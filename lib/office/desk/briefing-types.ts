import type { PresenceRung } from "@/lib/design-system/foundation";

/**
 * The Desk briefing — the Desk's answer to "what is happening?".
 *
 * §4.1 The Desk is not a homepage that links elsewhere; it is where the Peer
 * reports on her whole job. Every other destination therefore contributes a
 * short, honest account of itself, built from the *same* view models those
 * destinations render. Nothing here is computed twice and nothing is invented:
 * a panel either carries real numbers or it carries a `future`, which explains
 * what will appear and what unlocks it.
 *
 * Peer-agnostic (§10). A Sales Peer contributes deals where Marketing
 * contributes campaigns; the shape and the composition do not change.
 */

export const BRIEFING_PANELS = [
  "work",
  "performance",
  "content",
  "market",
  "agreement",
] as const;

export type BriefingPanelId = (typeof BRIEFING_PANELS)[number];

/**
 * How a figure should read at a glance.
 *
 * `attention` is reserved for things that are genuinely blocked on the
 * customer — it is the only tone that competes with a decision.
 */
export type BriefingTone = "neutral" | "attention" | "positive" | "quiet";

export type BriefingStat = {
  id: string;
  label: string;
  /** Always a measured value or a count. Never an estimate. */
  value: string;
  /** The specific thing behind the number, when naming it adds meaning. */
  hint: string | null;
  tone: BriefingTone;
};

/**
 * What a destination will be able to say once it can say anything.
 *
 * This is the replacement for "No data". It is only ever built from a real
 * gap the domain already reports — a missing connection, an unrecorded
 * competitor — so the promise is specific rather than marketing copy.
 */
export type BriefingFuture = {
  /** What will appear here. */
  promise: string;
  /** The concrete thing that unlocks it. */
  unlocks: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type BriefingPanel = {
  id: BriefingPanelId;
  eyebrow: string;
  /** Her one-line reading of this part of her job, in her voice. */
  headline: string;
  stats: BriefingStat[];
  /** Present only when the panel has nothing real to report yet. */
  future: BriefingFuture | null;
  href: string;
  openLabel: string;
};

/**
 * §4.1 The Focus Anchor — the work context the customer should understand.
 *
 * This is a *third* concept, deliberately separate from the two it is
 * constantly confused with:
 *
 * - **Presence** is Emma's current truthful state. One rung, one sentence,
 *   chosen by the ladder in §5.1. "Two items need your review."
 * - **Attention** is what requires the customer to act. Decision cards.
 * - **Focus Anchor** is what the work *is* right now. It is not a state and
 *   it is not a request; it is the subject of the day.
 *
 * They were competing for one slot, which is why the Desk had an empty hero
 * whenever presence resolved to "needs you": the ladder correctly promoted the
 * request, and the work context had nowhere left to go. Separating them lets
 * all three be true at once without any of them being weakened.
 *
 * The anchor is derived, never authored: every field traces to a work item, a
 * campaign or a proposal that already exists in a destination view model, and
 * `subjectId` records which one so the claim can be checked.
 */
export type FocusAnchorSource =
  /** Verified work currently in progress. */
  | "in_progress"
  /** A verified campaign or piece being prepared. */
  | "preparing"
  /** Verified scheduled or published work still being watched. */
  | "monitoring"
  /** A grounded recommendation, when there is nothing running. */
  | "recommendation"
  /** The designed calm state. Reached only when all of the above are absent. */
  | "calm";

export type DeskFocusAnchor = {
  source: FocusAnchorSource;
  eyebrow: string;
  /** What the work is, in her voice. */
  headline: string;
  detail: string | null;
  /**
   * The work item or campaign this describes, by stable id.
   *
   * Null only for `recommendation` and `calm`, which describe work that does
   * not exist yet and the absence of work respectively. For every other source
   * this must resolve to something a destination is already showing — an
   * anchor that names work no page can produce is a fabrication.
   */
  subjectId: string | null;
  href: string | null;
  ctaLabel: string | null;
  /** Expected date or similar, when the underlying item carries one. */
  meta: string | null;
};

/**
 * §4.1 One recommended next step, and the reason for it.
 *
 * Chosen by severity from facts that already exist: a decision outranks a
 * blocked connection, which outranks an unstarted recommendation. She never
 * invents a step to have something to say — when nothing qualifies this is null.
 */
export type BriefingNextStep = {
  label: string;
  why: string;
  ctaLabel: string;
  href: string;
  /** Which part of her job this came from, so the suggestion is traceable. */
  origin: BriefingPanelId;
};

/** A change since the customer was last here, grouped for a single reading. */
export type BriefingChange = {
  id: string;
  label: string;
  /** The campaign it belongs to, when the outcome names one. */
  context: string | null;
  timeLabel: string | null;
  href: string | null;
};

export type DeskBriefing = {
  /** Drives the tone of the whole page without re-deriving presence. */
  rung: PresenceRung;
  /** Always present. The Desk never renders without a subject. */
  focus: DeskFocusAnchor;
  panels: BriefingPanel[];
  nextStep: BriefingNextStep | null;
  changes: BriefingChange[];
  copy: BriefingCopy;
};

export type BriefingCopy = {
  briefingHeading: string;
  nextStepHeading: string;
  whyLabel: string;
  changesHeading: string;
  futureHeading: string;
  openLabel: (destination: string) => string;
};
