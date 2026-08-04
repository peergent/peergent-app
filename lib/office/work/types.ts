import type { PresenceLine } from "@/lib/design-system/foundation";
import type { MarketingWorkBucket } from "./resolve-marketing-work-bucket";

/**
 * §4.2 Work, expressed peer-agnostically.
 *
 * Grouped by *state*, never by date or type — state is what the customer is
 * scanning for. The group order is specified and load-bearing: blocked-on-you
 * comes first, always.
 *
 * §10 "Campaign" generalises to Deal · Case · Report · Requisition · Matter.
 * The groups and the layout do not change between Peers.
 */

export const WORK_GROUPS = [
  "blocked_on_you",
  "blocked_elsewhere",
  "moving",
  "queued",
  "finished",
] as const;

export type WorkGroupId = (typeof WORK_GROUPS)[number];

/** §4.2 Surfaced per item, before the work is produced rather than after. */
export type WorkChannel = {
  id: string;
  label: string;
  connected: boolean;
};

export type WorkItem = {
  id: string;
  name: string;
  stageLabel: string;
  /** Primary card line — scheduled date, next step, etc. */
  primaryText: string | null;
  /** Secondary supporting line — e.g. publishing not connected. */
  secondaryText: string | null;
  /** Visible action label when the card opens the campaign. */
  actionLabel: string | null;
  /** @deprecated Prefer primaryText — kept for legacy WorkView adapter. */
  nextStep: string | null;
  /**
   * §4.2 Who is holding it up — the single highest-value fact on the page,
   * and the one absent from most competitors. Null when nothing is blocking.
   */
  blockedBy: string | null;
  expectedLabel: string | null;
  href: string;
  channels: WorkChannel[];
  bucket: MarketingWorkBucket;
};

export type WorkGroup = {
  id: WorkGroupId;
  title: string;
  items: WorkItem[];
  /** §4.2 Recently finished is collapsed by default. */
  collapsedByDefault: boolean;
};

/**
 * §4.2 An empty state that does work — she proposes rather than apologises.
 *
 * The proposal is only ever as specific as the business knowledge allows.
 * `basedOn` names where the recommendation came from, so the customer can judge
 * it rather than take it on trust; it is null when she is only guessing.
 */
export type WorkProposal = {
  voice: string;
  next: string | null;
  acceptLabel: string;
  briefLabel: string;
  /** What the recommendation rests on. Null when nothing is known yet. */
  basedOn: string | null;
  /** The channel she would start with, when the recommendation is grounded. */
  channel: string | null;
  /**
   * How a campaign actually moves once started. This is the product's real
   * lifecycle described in customer language — not invented customer data.
   */
  stages: WorkStagePreview[];
  stagesHeading: string;
  /**
   * §4.2 What turns a sentence into a proposal worth approving.
   *
   * Every field here is quoted from something already recorded — a strategy's
   * stated objective, its own rationale, the channels it names — or is a fact
   * about the product itself. Nothing is predicted. A field is null when the
   * recorded strategy does not say, and the UI simply omits it rather than
   * filling the gap.
   */
  terms: WorkProposalTerms | null;
};

export type WorkProposalTerm = {
  id: string;
  label: string;
  value: string;
};

export type WorkProposalTerms = {
  heading: string;
  items: WorkProposalTerm[];
};

export type WorkStagePreview = {
  id: string;
  label: string;
  description: string;
  /** True for the step that needs the customer, so approval is never a surprise. */
  needsYou: boolean;
};

export type WorkViewModel = {
  peerId: string;
  peerName: string;
  peerRole: string;
  presence: PresenceLine | null;
  groups: WorkGroup[];
  proposal: WorkProposal | null;
  copy: WorkCopy;
};

export type WorkCopy = {
  title: string;
  createLabel: string;
  nextStepLabel: string;
  blockedLabel: string;
  notConnectedLabel: (channel: string) => string;
  showFinished: string;
  hideFinished: string;
  whereIdStart: string;
  basedOnPrefix: string;
  startingOnPrefix: string;
};

export const WORK_GROUP_ORDER: readonly WorkGroupId[] = WORK_GROUPS;
