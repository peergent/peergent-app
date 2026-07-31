/**
 * Peergent Foundation — Product Design Specification (frozen-v1).
 *
 * Typed counterparts to the CSS foundation layer. These constants are
 * specified by the frozen spec; changing them requires a spec revision.
 */

/* ============================================================
   §10 Peer roles — one architecture, every role.
   ============================================================ */

export const PEER_ROLES = [
  "marketing",
  "sales",
  "support",
  "finance",
  "planning",
  "hr",
  "recruitment",
  "legal",
  "operations",
] as const;

export type PeerRole = (typeof PEER_ROLES)[number];

/**
 * §2 A Peer's colour identifies who is speaking, not what to click.
 * Permitted on the avatar ring, their presence line, and their rail row.
 * Never on controls.
 */
export function peerAccentVar(role: string | null | undefined): string {
  const key = (role ?? "").trim().toLowerCase();
  const match = PEER_ROLES.find((r) => r === key);
  return `var(--pg-peer-${match ?? "marketing"})`;
}

/* ============================================================
   §5 Status vocabulary — one set of words, product-wide.
   Every Peer uses these; only the work noun changes.
   ============================================================ */

export const PEER_STATUSES = [
  "draft",
  "needs_your_approval",
  "approved",
  "scheduled",
  "published",
  "completed",
  "needs_help",
] as const;

export type PeerStatus = (typeof PEER_STATUSES)[number];

/** Tone drives form as well as text, so state reads at a glance (§5). */
export type PeerStatusTone = "neutral" | "decision" | "progress" | "complete" | "fault";

export const PEER_STATUS_TONE: Record<PeerStatus, PeerStatusTone> = {
  draft: "neutral",
  needs_your_approval: "decision",
  approved: "progress",
  scheduled: "progress",
  published: "complete",
  completed: "complete",
  needs_help: "fault",
};

/* ============================================================
   §5.1 The presence ladder.
   The line always says something true. It never fills. When she has less to
   offer she descends a rung rather than manufacturing a judgement.
   ============================================================ */

export const PRESENCE_RUNGS = [
  "interpretation",
  "qualified",
  "observation",
  "orientation",
  "gap",
  "fault",
  "dormant",
] as const;

export type PresenceRung = (typeof PRESENCE_RUNGS)[number];

export type PresenceLine = {
  rung: PresenceRung;
  /** One sentence, in the Peer's voice. Never two. */
  text: string;
  /** Optional destination — §1: every interpretation is a doorway. */
  href?: string | null;
  /** Mono timestamp shown beside the line. */
  timeLabel?: string | null;
  /** Drives the breathing dot (§8). True only while genuinely working. */
  working?: boolean;
};

/**
 * Rung precedence for choosing what to show when more than one is available.
 * A fault outranks everything: withholding a failure is the dishonesty the
 * product refuses everywhere else (§6).
 */
export const PRESENCE_RUNG_PRIORITY: Record<PresenceRung, number> = {
  fault: 0,
  interpretation: 1,
  qualified: 2,
  observation: 3,
  gap: 4,
  orientation: 5,
  dormant: 6,
};

/**
 * §5.1 The anti-generic test — if a sentence could appear unchanged on another
 * customer's screen, it is not rung 1 or 2. Demote it to observation.
 *
 * Deliberately conservative: it only catches sentences with no specific
 * referent at all. Judgement still belongs to whoever writes the line.
 */
export function demoteIfGeneric(line: PresenceLine): PresenceLine {
  if (line.rung !== "interpretation" && line.rung !== "qualified") return line;

  const hasSpecificReferent =
    /\d/.test(line.text) || /["“”']/.test(line.text) || /\b[A-Z][a-z]+\b/.test(line.text.slice(1));

  return hasSpecificReferent ? line : { ...line, rung: "observation" };
}

/** Picks the single line to show. Never merges two rungs into one sentence. */
export function selectPresenceLine(
  candidates: readonly PresenceLine[]
): PresenceLine | null {
  if (candidates.length === 0) return null;
  const ranked = [...candidates]
    .map(demoteIfGeneric)
    .sort(
      (a, b) => PRESENCE_RUNG_PRIORITY[a.rung] - PRESENCE_RUNG_PRIORITY[b.rung]
    );
  return ranked[0] ?? null;
}

/* ============================================================
   §2 Motion — durations mirrored from CSS for JS-driven timing.
   ============================================================ */

export const MOTION = {
  state: 120,
  enter: 200,
  mode: 320,
  breathe: 3400,
} as const;

/* ============================================================
   §4.1a Earned autonomy — the conditions under which she may ask.
   ============================================================ */

export const AUTONOMY_RULES = {
  /** Consecutive unchanged approvals of the same work kind. */
  minConsecutiveApprovals: 5,
  /** A pattern, not a busy week. */
  minSpanDays: 21,
  /** Between any two requests, however many boundaries qualify. */
  minDaysBetweenRequests: 30,
  /** After a decline, before raising the same boundary again. */
  minDaysAfterDecline: 90,
  /** After this many declines on one boundary, she never asks again. */
  maxDeclinesPerBoundary: 2,
  /** No requests at all during the opening period of the relationship. */
  relationshipGraceDays: 30,
} as const;
