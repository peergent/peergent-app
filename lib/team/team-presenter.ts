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
import { TEAM_FEATURED_PEER_LIMIT } from "./types";

type WorkspaceTemplate = {
  roleFocus: string;
  gradient: string;
  statusLabel: string;
  currentTask: string;
  todayMetrics: PeerTodayMetric[];
};

const WORKSPACE_TEMPLATES: Record<string, WorkspaceTemplate> = {
  Sales: {
    roleFocus: "Revenue",
    gradient: "from-violet-500 to-blue-600",
    statusLabel: "Working",
    currentTask: "Helping a visitor choose the right solar solution.",
    todayMetrics: [
      { label: "Conversations", value: "18" },
      { label: "Qualified leads", value: "6" },
      { label: "Meetings", value: "2" },
    ],
  },
  Marketing: {
    roleFocus: "Demand",
    gradient: "from-fuchsia-500 to-violet-600",
    statusLabel: "Working",
    currentTask: "Preparing tomorrow's LinkedIn campaign.",
    todayMetrics: [
      { label: "Posts", value: "3" },
      { label: "Campaigns", value: "2" },
      { label: "Approval pending", value: "1" },
    ],
  },
  Support: {
    roleFocus: "Customer care",
    gradient: "from-cyan-500 to-blue-600",
    statusLabel: "Working",
    currentTask: "Answering a product question from a returning customer.",
    todayMetrics: [
      { label: "Questions", value: "24" },
      { label: "Resolved", value: "22" },
      { label: "Rating", value: "4.9" },
    ],
  },
  Planning: {
    roleFocus: "Scheduling",
    gradient: "from-orange-500 to-pink-600",
    statusLabel: "Working",
    currentTask: "Coordinating meeting availability for the sales team.",
    todayMetrics: [
      { label: "Appointments", value: "4" },
      { label: "Reminders", value: "8" },
      { label: "Rescheduled", value: "1" },
    ],
  },
};

const DEFAULT_TEMPLATE: WorkspaceTemplate = {
  roleFocus: "Operations",
  gradient: "from-slate-500 to-slate-700",
  statusLabel: "Working",
  currentTask: "Ready to assist your team.",
  todayMetrics: [
    { label: "Tasks", value: "0" },
    { label: "Completed", value: "0" },
    { label: "Active", value: "0" },
  ],
};

const TEAM_IMPACT_STATS: TeamImpactStat[] = [
  { id: "conversations", value: "18", label: "Conversations" },
  { id: "leads", value: "6", label: "Qualified leads" },
  { id: "meetings", value: "2", label: "Meetings" },
  { id: "campaigns", value: "1", label: "Campaign" },
];

const TEAM_ACTIVITY: TeamActivityEvent[] = [
  {
    id: "a1",
    peerName: "Marketing Peer",
    tone: "marketing",
    message: "Finished tomorrow's LinkedIn campaign",
    relativeTime: "Just now",
  },
  {
    id: "a2",
    peerName: "Sales Peer",
    tone: "sales",
    message: "Qualified a lead from ACME Solar",
    relativeTime: "2 minutes ago",
  },
  {
    id: "a3",
    peerName: "Sales Peer",
    tone: "sales",
    message: "Booked a meeting",
    relativeTime: "12 minutes ago",
  },
  {
    id: "a4",
    peerName: "Marketing Peer",
    tone: "marketing",
    message: "Suggested three content ideas for next week",
    relativeTime: "28 minutes ago",
  },
];

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
    workspaceHref: `/peers/${peer.id}`,
  };
}

function resolvePeerName(peers: PeerWorkspace[], role: "Sales" | "Marketing"): string {
  const match = peers.find((p) => p.name.toLowerCase().includes(role.toLowerCase()));
  return match?.name ?? `${role} Peer`;
}

function buildActivityForPeers(peers: PeerWorkspace[]): TeamActivityEvent[] {
  if (peers.length === 0) return TEAM_ACTIVITY;

  const salesName = resolvePeerName(peers, "Sales");
  const marketingName = resolvePeerName(peers, "Marketing");

  return TEAM_ACTIVITY.map((event) => ({
    ...event,
    peerName:
      event.tone === "sales"
        ? salesName
        : event.tone === "marketing"
          ? marketingName
          : event.peerName,
  }));
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
    workforceHref: "/peers",
  };
}

export function buildTeamWorkspaceViewModel(peerRows: PeerRow[]): TeamWorkspaceViewModel {
  if (peerRows.length === 0) {
    return {
      isEmpty: true,
      greeting: getTimeGreeting(),
      companyName: "",
      subheadline: "",
      impactStats: [],
      featuredPeers: [],
      workforceSummary: null,
      activity: [],
    };
  }

  const allPeers = peerRows.map(mapPeerToWorkspace);
  const featuredPeers = selectFeaturedPeers(peerRows, allPeers);
  const companyName = companyFromWebsite(peerRows[0].website);

  return {
    isEmpty: false,
    greeting: getTimeGreeting(),
    companyName,
    subheadline: "Your AI team is already working.",
    impactStats: TEAM_IMPACT_STATS,
    featuredPeers,
    workforceSummary: buildWorkforceSummary(peerRows),
    activity: buildActivityForPeers(allPeers),
  };
}
