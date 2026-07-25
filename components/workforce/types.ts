import type { HandoffPrimaryWork, HandoffUrgency } from "@/lib/home/handoff-types";
import type {
  HomeMorningNarrative,
  HomeMovementItem,
  HomeNeedsYouItem,
  HomeTeamPulseItem,
} from "@/lib/home";
import type { HomeUiCopy } from "@/lib/i18n";

/** Presentation props for the primary work / agent-action card. */
export type PrimaryWorkCardProps = {
  work: HandoffPrimaryWork;
  categoryLabel: string;
  urgency: HandoffUrgency;
  peerRole?: string;
  ctaLabel?: string;
  secondaryCtaLabel?: string;
  secondaryHref?: string;
  sectionLabel?: string;
  statusCopy?: Pick<
    HomeUiCopy,
    | "primaryStatusWaitingReview"
    | "primaryStatusNeededToContinue"
    | "primaryStatusInProgress"
    | "primaryStatusReadyForReview"
    | "completedBy"
  >;
  className?: string;
  onActivate?: () => void;
};

export type PeerWorkCardProps = {
  item: HomeTeamPulseItem;
  openWorkspaceLabel?: string;
  className?: string;
};

export type PeerWorkGridProps = {
  items: HomeTeamPulseItem[];
  activeCount?: number;
  title?: string;
  activeBadgeLabel?: string;
  footerHref?: string;
  footerLabel?: string;
  openWorkspaceLabel?: string;
  className?: string;
};

export type AttentionQueueProps = {
  items: HomeNeedsYouItem[];
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
};

export type BriefingNarrativeProps = {
  narrative: HomeMorningNarrative;
  awayMovement?: HomeMovementItem[];
  kickerLabel?: string;
  morningBriefingLabel?: string;
  className?: string;
};

export type BriefingDecisionProps = {
  title: string;
  href: string;
  ctaLabel: string;
};

export type WorkforceStatusLineProps = {
  activeCount: number;
  visible?: boolean;
  prefixLabel?: string;
  activeLabel?: string;
  className?: string;
};

export type ActivityTimelineProps = {
  items: HomeMovementItem[];
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyMessage?: string;
  formatRelativeTime?: (iso: string) => string;
  className?: string;
};
