import type { PeerRow } from "@/lib/peer-display";
import type {
  PeerTodayMetric,
  PeerWorkStatus,
  PeerWorkspace,
  TeamActivityEvent,
  TeamImpactStat,
  TeamWorkspaceViewModel,
  WorkforceSummary,
} from "./types";
import { marketingPeerWorkspaceHref } from "@/lib/config/peer-studio";
import { TEAM_FEATURED_PEER_LIMIT, TEAM_PEERS_VIEW_ALL_HREF } from "./types";

type WorkspaceTemplate = {
  roleFocus: string;
  gradient: string;
  statusLabel: string;
  currentTask: string;
  workspaceLabel: string;
  todayMetrics: PeerTodayMetric[];
};

const WORKSPACE_TEMPLATES: Record<string, WorkspaceTemplate> = {
  Sales: {
    roleFocus: "Revenue",
    gradient: "from-violet-500 to-blue-600",
    statusLabel: "Available",
    currentTask: "Open the workspace to configure sales coverage and review status.",
    workspaceLabel: "Open workspace",
    todayMetrics: [],
  },
  Marketing: {
    roleFocus: "Demand",
    gradient: "from-fuchsia-500 to-violet-600",
    statusLabel: "Available",
    currentTask:
      "Open the Marketing workspace to review understanding, strategy, and content drafts.",
    workspaceLabel: "Open Marketing workspace",
    todayMetrics: [],
  },
  Support: {
    roleFocus: "Customer care",
    gradient: "from-cyan-500 to-blue-600",
    statusLabel: "Available",
    currentTask: "Open the workspace to configure support coverage.",
    workspaceLabel: "Open workspace",
    todayMetrics: [],
  },
  Planning: {
    roleFocus: "Scheduling",
    gradient: "from-orange-500 to-pink-600",
    statusLabel: "Available",
    currentTask: "Open the workspace to configure scheduling coverage.",
    workspaceLabel: "Open workspace",
    todayMetrics: [],
  },
};

const DEFAULT_TEMPLATE: WorkspaceTemplate = {
  roleFocus: "Operations",
  gradient: "from-slate-500 to-slate-700",
  statusLabel: "Available",
  currentTask: "Open this peer's workspace to review status and settings.",
  workspaceLabel: "Open workspace",
  todayMetrics: [],
};

const ROLE_DISPLAY_ORDER = ["Sales", "Marketing", "Support", "Planning", "Finance", "Custom"];

const ROLE_ACTIVITY_WEIGHT: Record<string, number> = {
  Sales: 50,
  Marketing: 40,
  Support: 20,
  Planning: 10,
  Finance: 8,
  Custom: 0,
};

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function companyFromWebsite(url: string): string {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(normalized).hostname.replace(/^www\./, "");
    const segment = hostname.split(".")[0];
    if (!segment) return "your company";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  } catch {
    return "your company";
  }
}

function toWorkStatus(peerStatus: string): PeerWorkStatus {
  if (peerStatus === "active") return "working";
  if (peerStatus === "paused") return "paused";
  return "idle";
}

function mapPeerToWorkspace(peer: PeerRow): PeerWorkspace {
  const template = WORKSPACE_TEMPLATES[peer.role] ?? DEFAULT_TEMPLATE;
  const workStatus = toWorkStatus(peer.status);

  return {
    id: peer.id,
    name: peer.name,
    role: peer.role,
    roleFocus: template.roleFocus,
    gradient: template.gradient,
    workStatus,
    statusLabel:
      workStatus === "working"
        ? template.statusLabel
        : workStatus === "paused"
          ? "Paused"
          : "Available",
    currentTask: template.currentTask,
    todayMetrics: template.todayMetrics,
    workspaceHref:
      peer.role === "Marketing"
        ? marketingPeerWorkspaceHref(peer.id)
        : `/peers/${peer.id}`,
    workspaceLabel: template.workspaceLabel,
  };
}

function selectFeaturedPeers(
  peerRows: PeerRow[],
  workspaces: PeerWorkspace[]
): PeerWorkspace[] {
  if (workspaces.length <= TEAM_FEATURED_PEER_LIMIT) {
    return workspaces;
  }

  const workspaceById = new Map(workspaces.map((peer) => [peer.id, peer]));

  const ranked = peerRows
    .map((row, index) => {
      const workspace = workspaceById.get(row.id);
      if (!workspace) return null;

      let score = peerRows.length - index;
      if (workspace.workStatus === "working") score += 100;
      if (workspace.workStatus === "paused") score += 40;
      score += ROLE_ACTIVITY_WEIGHT[row.role] ?? 0;

      return { workspace, score };
    })
    .filter((entry): entry is { workspace: PeerWorkspace; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, TEAM_FEATURED_PEER_LIMIT).map((entry) => entry.workspace);
}

function collectWorkforceRoles(peerRows: PeerRow[]): string[] {
  const unique = [...new Set(peerRows.map((peer) => peer.role))];
  return unique.sort((a, b) => {
    const aIndex = ROLE_DISPLAY_ORDER.indexOf(a);
    const bIndex = ROLE_DISPLAY_ORDER.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}

function buildWorkforceSummary(peerRows: PeerRow[]): WorkforceSummary | null {
  if (peerRows.length <= TEAM_FEATURED_PEER_LIMIT) {
    return null;
  }

  return {
    totalCount: peerRows.length,
    roles: collectWorkforceRoles(peerRows),
    workforceHref: TEAM_PEERS_VIEW_ALL_HREF,
  };
}

export type BuildTeamWorkspaceOptions = {
  /** When true, show every peer and hide the workforce summary card. */
  showAllPeers?: boolean;
};

export function buildTeamWorkspaceViewModel(
  peerRows: PeerRow[],
  options: BuildTeamWorkspaceOptions = {}
): TeamWorkspaceViewModel {
  if (peerRows.length === 0) {
    return {
      isEmpty: true,
      greeting: getTimeGreeting(),
      companyName: "",
      subheadline: "",
      impactStats: [] as TeamImpactStat[],
      featuredPeers: [],
      workforceSummary: null,
      activity: [] as TeamActivityEvent[],
    };
  }

  const allPeers = peerRows.map(mapPeerToWorkspace);
  const featuredPeers = options.showAllPeers
    ? allPeers
    : selectFeaturedPeers(peerRows, allPeers);
  const companyName = companyFromWebsite(peerRows[0].website);

  return {
    isEmpty: false,
    greeting: getTimeGreeting(),
    companyName,
    subheadline: "Open a peer workspace to review status and continue work.",
    impactStats: [],
    featuredPeers,
    workforceSummary: options.showAllPeers ? null : buildWorkforceSummary(peerRows),
    activity: [],
  };
}
