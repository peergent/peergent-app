import type { MarketingPeerTabId } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";

export type MarketingWorkspaceLiveFeedItem = {
  id: string;
  timeLabel: string;
  text: string;
};

export type MarketingWorkspaceAgentViewModel = {
  name: string;
  roleLabel: string;
  workingLine: string;
  workingProjectName: string | null;
  liveStateLabel: string;
  metaLine: string;
  decisionCount: number;
  reviewHref: string;
  settingsHref: string;
  liveFeed: MarketingWorkspaceLiveFeedItem[];
};

export type MarketingWorkspaceObjectiveViewModel = {
  hasObjective: boolean;
  goalText: string | null;
  progressPercent: number | null;
  progressLabel: string | null;
  responsibilitiesHref: string;
};

export type MarketingWorkspaceShellViewModel = {
  peerId: string;
  peerName: string;
  breadcrumbTeamHref: string;
  agent: MarketingWorkspaceAgentViewModel;
  objective: MarketingWorkspaceObjectiveViewModel;
  activeTab: MarketingPeerTabId;
};
