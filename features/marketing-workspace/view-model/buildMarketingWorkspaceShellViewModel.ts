import type { PeerRow } from "@/lib/peer-display";
import { resolveMarketingWorkflowFocus } from "@/lib/marketing-workspace/workflow-focus";
import { buildEmmaPresenceLine } from "@/lib/peer-experience/marketing/build-emma-presence-line";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import {
  getResponsibilitiesHref,
  getReviewHref,
  getSettingsHref,
  type MarketingPeerTabId,
} from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import { buildAllMarketingApprovalQueue } from "@/lib/peer-experience/marketing/view-models/build-marketing-activity-mappers";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import {
  deriveProjectProgress,
  deriveProjectStatus,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type {
  MarketingWorkspaceAgentViewModel,
  MarketingWorkspaceObjectiveViewModel,
  MarketingWorkspaceShellViewModel,
} from "./marketing-workspace-types";

function countCompletedTasks(input: MarketingPeerDomainInput): number {
  const completedUnits = input.workUnits.filter(
    (u) => u.status === "published" || u.status === "monitoring"
  ).length;
  const publishedDrafts = input.drafts.filter((d) => d.status === "published").length;
  return completedUnits + publishedDrafts;
}

function formatMemberSince(createdAt?: string): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function buildWorkingLine(input: MarketingPeerDomainInput, presenceLine: string): {
  line: string;
  projectName: string | null;
} {
  const activeUnit =
    input.workUnits.find((u) => u.id === input.activeWorkUnitId) ??
    input.workUnits.find((u) => !u.paused && !u.cancelled && u.status !== "published" && u.status !== "monitoring");

  const project = activeUnit?.projectId
    ? input.projects.find((p) => p.id === activeUnit.projectId)
    : input.projects.find((p) => {
        const status = deriveProjectStatus(p, input.workUnits, input.drafts, new Set());
        return !["completed", "archived", "monitoring_results"].includes(status);
      });

  const projectName = project?.title ?? null;
  if (projectName && input.generatingActivity) {
    return {
      line: `Working on the ${projectName} — ${input.generatingActivity.replace(/\.$/, "").toLowerCase()} right now.`,
      projectName,
    };
  }
  if (projectName) {
    return {
      line: `Working on the ${projectName} — ${presenceLine.replace(/\.$/, "").toLowerCase()}.`,
      projectName,
    };
  }
  return { line: presenceLine, projectName: null };
}

function buildLiveFeed(input: MarketingPeerDomainInput): MarketingWorkspaceAgentViewModel["liveFeed"] {
  return input.activityFeed.slice(0, 4).map((item, index) => ({
    id: item.id ?? `feed-${index}`,
    timeLabel: item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—",
    text: item.description,
  }));
}

function buildObjective(
  input: MarketingPeerDomainInput,
  peer: PeerRow
): MarketingWorkspaceObjectiveViewModel {
  const responsibilitiesHref = getResponsibilitiesHref(input.peerId);
  const primary =
    input.responsibilities.find((r) => r.enabled && r.goal?.trim()) ??
    input.responsibilities.find((r) => r.enabled);

  const goalText =
    primary?.goal?.trim() ||
    peer.objective?.trim() ||
    null;

  if (!goalText) {
    return {
      hasObjective: false,
      goalText: null,
      progressPercent: null,
      progressLabel: null,
      responsibilitiesHref,
    };
  }

  const activeProjects = input.projects.filter((p) => {
    const status = deriveProjectStatus(p, input.workUnits, input.drafts, new Set());
    return !["completed", "archived"].includes(status);
  });

  let progressPercent: number | null = null;
  if (activeProjects.length > 0) {
    const sum = activeProjects.reduce((acc, p) => {
      const status = deriveProjectStatus(p, input.workUnits, input.drafts, new Set());
      return acc + deriveProjectProgress(p, input.workUnits, status);
    }, 0);
    progressPercent = Math.round(sum / activeProjects.length);
  }

  return {
    hasObjective: true,
    goalText,
    progressPercent,
    progressLabel:
      progressPercent != null ? `${progressPercent}% there` : null,
    responsibilitiesHref,
  };
}

export function buildMarketingWorkspaceShellViewModel(input: {
  peer: PeerRow;
  domainInput: MarketingPeerDomainInput;
  activeTab: MarketingPeerTabId;
}): MarketingWorkspaceShellViewModel {
  const { peer, domainInput } = input;
  const focus = resolveMarketingWorkflowFocus({
    generating: domainInput.generating,
    generatingActivity: domainInput.generatingActivity,
    understanding: domainInput.understanding,
    strategy: domainInput.strategy,
    plan: domainInput.plan,
    drafts: domainInput.drafts,
    publicationPackages: domainInput.publicationPackages,
  });
  const presenceLine = buildEmmaPresenceLine(focus);
  const { line: workingLine, projectName } = buildWorkingLine(domainInput, presenceLine);

  const pending = buildAllMarketingApprovalQueue(domainInput);
  const completed = countCompletedTasks(domainInput);
  const since = formatMemberSince(peer.created_at);
  const metaParts = [`${completed} tasks completed`];
  if (since) metaParts.push(`with Peergent since ${since}`);

  const activeUnit =
    domainInput.workUnits.find((u) => u.id === domainInput.activeWorkUnitId) ??
    domainInput.workUnits.find((u) => !u.cancelled && u.status !== "published");

  let liveStateLabel = "Live";
  if (activeUnit?.updatedAt) {
    liveStateLabel = `Updated ${formatRelativeTime(activeUnit.updatedAt)}`;
  } else if (domainInput.generating) {
    liveStateLabel = "Working now";
  }

  const agent: MarketingWorkspaceAgentViewModel = {
    name: peer.name,
    roleLabel: peer.role,
    workingLine,
    workingProjectName: projectName,
    liveStateLabel,
    metaLine: metaParts.join(" · "),
    decisionCount: pending.length,
    reviewHref: getReviewHref(domainInput.peerId),
    settingsHref: getSettingsHref(domainInput.peerId),
    liveFeed: buildLiveFeed(domainInput),
  };

  return {
    peerId: domainInput.peerId,
    peerName: peer.name,
    breadcrumbTeamHref: "/team",
    agent,
    objective: buildObjective(domainInput, peer),
    activeTab: input.activeTab,
  };
}
