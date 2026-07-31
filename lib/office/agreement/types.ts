import type { PresenceLine } from "@/lib/design-system/foundation";

/**
 * §4.8 Working agreement, expressed peer-agnostically.
 *
 * This page is where a boundary is **reviewed, narrowed or reversed**. She
 * never lobbies here — the autonomy *request* lives on the Desk (§4.1a), and
 * this surface is deliberately rare and slightly effortful so boundary-setting
 * feels considered.
 */

/* ---------------- Boundaries ---------------------------------------------- */

export type BoundaryKind =
  /** She may act without asking. */
  | "autonomous"
  /** She prepares, and always stops for a decision. */
  | "needs_approval"
  /** She will not do this at all. */
  | "never";

export const BOUNDARY_KINDS: readonly BoundaryKind[] = [
  "autonomous",
  "needs_approval",
  "never",
];

/** A guardrail attached to a boundary, carrying where it came from. */
export type AgreementGuardrail = {
  id: string;
  label: string;
  value: string;
};

export type AgreementBoundary = {
  /** Stable responsibility id. */
  id: string;
  title: string;
  description: string;
  kind: BoundaryKind;
  /** Plain-language statement of what this permits, shown before saving. */
  consequence: string;
  /** How to undo it. Every boundary is reversible (§4.8). */
  reversal: string;
  enabled: boolean;
  /** When this boundary last moved, from the record's own timestamp. */
  lastChangedAt: string | null;
  lastChangedLabel: string | null;
  guardrails: AgreementGuardrail[];
};

/* ---------------- Provenance ---------------------------------------------- */

/**
 * §6.1 Three kinds of knowledge, never blurred.
 *
 * - `system_fact`      objective and not editable — a connection is or isn't live
 * - `customer_rule`    something the customer explicitly set
 * - `emma_understanding` derived by her from recorded knowledge; correctable
 */
export type KnowledgeProvenance =
  | "system_fact"
  | "customer_rule"
  | "emma_understanding";

export type AgreementKnowledge = {
  id: string;
  label: string;
  value: string;
  provenance: KnowledgeProvenance;
  /**
   * Only her understanding may be corrected. Correcting it records a customer
   * rule on top; it never erases the underlying record it was derived from.
   */
  correctable: boolean;
  /** Shown when a correction already overrides her reading. */
  correctedBy: string | null;
};

/* ---------------- Access -------------------------------------------------- */

export type AgreementConnection = {
  id: string;
  label: string;
  connected: boolean;
  statusLabel: string;
  /** What this connection would let her do. Never a generic pitch. */
  unlocks: string;
  href: string;
};

/* ---------------- History ------------------------------------------------- */

export type AgreementHistoryEntry = {
  id: string;
  label: string;
  at: string;
  atLabel: string;
};

/* ---------------- Save lifecycle ------------------------------------------ */

export type AgreementSaveState =
  | { status: "idle" }
  | { status: "confirming"; boundaryId: string; consequence: string }
  | { status: "saving"; boundaryId: string }
  | { status: "saved"; boundaryId: string }
  | { status: "invalid"; boundaryId: string; reason: string }
  | { status: "conflict"; boundaryId: string; reason: string }
  | { status: "failed"; boundaryId: string; voice: string; preserved: string };

export type AgreementViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  presence: PresenceLine;
  /** Grouped by boundary kind, in the specified order. */
  autonomous: AgreementBoundary[];
  needsApproval: AgreementBoundary[];
  never: AgreementBoundary[];
  /** What she knows, split by provenance. */
  knowledge: AgreementKnowledge[];
  connections: AgreementConnection[];
  history: AgreementHistoryEntry[];
  /** Set when nothing has been learned yet, so the section can say so. */
  noLearnedUnderstanding: string | null;
  /** Set when no responsibilities exist at all. */
  empty: { voice: string; next: string } | null;
  copy: AgreementCopy;
};

export type AgreementCopy = {
  title: string;
  subtitle: string;
  autonomousHeading: string;
  needsApprovalHeading: string;
  neverHeading: string;
  knowledgeHeading: string;
  connectionsHeading: string;
  historyHeading: string;
  provenanceSystem: string;
  provenanceCustomer: string;
  provenanceEmma: string;
  correctLabel: string;
  correctedLabel: (by: string) => string;
  consequenceLabel: string;
  reversalLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  savingLabel: string;
  savedLabel: string;
  connectedLabel: string;
  notConnectedLabel: string;
  lastChangedLabel: (when: string) => string;
  narrowLabel: string;
  widenLabel: string;
};

/** A boundary may only widen one notch at a time (§4.1a). */
export const MAX_WIDEN_STEPS = 1;
