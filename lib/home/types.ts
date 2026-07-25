import type { PeerRow } from "@/lib/peer-display";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { MarketingWorkspacePersistedState } from "@/lib/marketing-workspace/types";
import type { ActivityFeedItem } from "@/lib/marketing-workspace/experience/types";
import type { WorkforceSummary } from "./workforce-summary-types";

export type HomePeerWorkspaceSnapshot = {
  peer: PeerRow;
  workspace: MarketingWorkspacePersistedState;
};

export type HomeNeedsYouPriority = "urgent" | "normal" | "low";

export type HomeNeedsYouItem = {
  id: string;
  priority: HomeNeedsYouPriority;
  title: string;
  subtitle: string;
  context?: string;
  peerId: string;
  peerName: string;
  href: string;
  timestamp?: string;
};

export type HomeSuggestedStart = {
  headline: string;
  detail?: string;
  ctaLabel: string;
  href: string;
};

export type HomeTeamPulseItem = {
  peerId: string;
  name: string;
  role: string;
  statusLabel: string;
  statusKind: "waiting" | "working" | "idle" | "blocked" | "paused";
  detail: string;
  href: string;
};

export type HomeMovementItem = {
  id: string;
  title: string;
  description: string;
  peerName: string;
  timestamp: string;
  href: string;
};

export type HomeWorkstreamItem = {
  id: string;
  peerId: string;
  peerName: string;
  title: string;
  progressLabel: string;
  statusLabel: string;
  href: string;
};

export type HomeContextHealth = {
  available: boolean;
  confidencePercent: number | null;
  label: string;
  gapLabel: string | null;
  improveHref: string | null;
};

export type HomeMorningNarrative = {
  greeting: string;
  headline: string;
  detail?: string;
};

export type HomeViewModel = {
  narrative: HomeMorningNarrative;
  needsYou: HomeNeedsYouItem[];
  suggestedStart: HomeSuggestedStart | null;
  teamPulse: HomeTeamPulseItem[];
  recentMovement: HomeMovementItem[];
  /** Movement since the user's last home visit — feeds the morning brief. */
  awayMovement: HomeMovementItem[];
  contextHealth: HomeContextHealth;
  workstreams: HomeWorkstreamItem[];
  isEmpty: boolean;
  allCaughtUp: boolean;
  /** Aggregated workforce accomplishments since last home visit — Morning Brief source of truth */
  workforceSummary: WorkforceSummary;
};

export type BuildHomeViewModelInput = {
  firstName?: string;
  companyName?: string;
  peers: PeerRow[];
  marketingSnapshots: HomePeerWorkspaceSnapshot[];
  understanding: MarketingUnderstanding | null;
  lastVisitAt: string | null;
  locale?: import("@/lib/i18n").HomeLocale;
};
