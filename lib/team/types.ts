export type TeamImpactStat = {
  id: string;
  value: string;
  label: string;
};

export type PeerWorkStatus = "working" | "paused" | "idle";

export type PeerTodayMetric = {
  label: string;
  value: string;
};

export type PeerWorkspace = {
  id: string;
  name: string;
  role: string;
  roleFocus: string;
  gradient: string;
  workStatus: PeerWorkStatus;
  statusLabel: string;
  currentTask: string;
  todayMetrics: PeerTodayMetric[];
  workspaceHref: string;
  workspaceLabel: string;
};

export type ActivityPeerTone = "sales" | "marketing" | "neutral";

export type TeamActivityEvent = {
  id: string;
  peerName: string;
  tone: ActivityPeerTone;
  message: string;
  relativeTime: string;
};

export type WorkforceSummary = {
  totalCount: number;
  roles: string[];
  workforceHref: string;
};

export type TeamWorkspaceViewModel = {
  isEmpty: boolean;
  greeting: string;
  companyName: string;
  subheadline: string;
  impactStats: TeamImpactStat[];
  featuredPeers: PeerWorkspace[];
  workforceSummary: WorkforceSummary | null;
  activity: TeamActivityEvent[];
};

/** Peers page href that expands the full workforce list (not the featured subset). */
export const TEAM_PEERS_VIEW_ALL_HREF = "/team?view=all";

export const TEAM_FEATURED_PEER_LIMIT = 2;
