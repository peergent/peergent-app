import { gapToKnowledgeSection, knowledgeSectionHref } from "@/lib/knowledge";
import { formatGapLabel } from "@/lib/marketing-workspace/experience/activity-feed";
import type { ActivityFeedItem } from "@/lib/marketing-workspace/experience/types";
import {
  buildMarketingTimelineNodes,
} from "@/lib/marketing-workspace/timeline-nodes";
import { buildAttentionItems } from "@/lib/inbox";
import { getHomeCopy } from "@/lib/i18n";
import type {
  BuildHomeViewModelInput,
  HomeContextHealth,
  HomeMorningNarrative,
  HomeMovementItem,
  HomeNeedsYouItem,
  HomeSuggestedStart,
  HomeTeamPulseItem,
  HomeViewModel,
  HomeWorkstreamItem,
} from "./types";
import {
  activitySourcesFromMarketingSnapshots,
  buildWorkforceSummary,
  emptyWorkforceSummary,
} from "./build-workforce-summary";
import { buildTeamPulseItems } from "./build-team-pulse";
import {
  companyNameFromPeers,
  getTimeGreeting,
  marketingWorkspaceHref,
} from "./load-home-data";

function greetingWithName(firstName: string | undefined, _locale: import("@/lib/i18n").HomeLocale): string {
  const base = getTimeGreeting();
  if (!firstName?.trim()) return base;
  return `${base}, ${firstName.trim()}`;
}

function buildMovementItems(
  snapshots: BuildHomeViewModelInput["marketingSnapshots"],
  limit = 5
): HomeMovementItem[] {
  const rows: HomeMovementItem[] = [];

  for (const { peer, workspace } of snapshots) {
    for (const item of workspace.activityFeed ?? []) {
      rows.push(activityToMovement(item, peer.name, peer.id));
    }
  }

  return rows
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

function activityToMovement(
  item: ActivityFeedItem,
  peerName: string,
  peerId: string
): HomeMovementItem {
  return {
    id: `${peerId}-${item.id}`,
    title: item.title,
    description: item.description,
    peerName,
    timestamp: item.timestamp,
    href: marketingWorkspaceHref(peerId),
  };
}

function movementSince(lastVisitAt: string | null, movement: HomeMovementItem[]): HomeMovementItem[] {
  if (!lastVisitAt) return movement;
  const since = new Date(lastVisitAt).getTime();
  return movement.filter((item) => new Date(item.timestamp).getTime() > since);
}

function buildWorkstreams(
  snapshots: BuildHomeViewModelInput["marketingSnapshots"],
  understanding: BuildHomeViewModelInput["understanding"]
): HomeWorkstreamItem[] {
  const items: HomeWorkstreamItem[] = [];

  for (const { peer, workspace } of snapshots) {
    if (!workspace.plan) continue;

    const timeline = buildMarketingTimelineNodes({
      generating: null,
      understanding,
      strategy: workspace.strategy ?? null,
      plan: workspace.plan,
      drafts: workspace.drafts ?? [],
      publicationPackages: workspace.publicationPackages ?? [],
    });

    const { nodes, currentNodeId } = timeline;
    const current = nodes.find((node) => node.id === currentNodeId);
    const completed = nodes.filter((node) => node.progress === "completed").length;

    items.push({
      id: `${peer.id}-workstream`,
      peerId: peer.id,
      peerName: peer.name,
      title: workspace.plan.summary?.slice(0, 80) ?? "Campaign",
      progressLabel: `${completed} of ${nodes.length} steps`,
      statusLabel:
        current?.activityTitle ??
        (current?.milestone ? current.milestone : "In progress"),
      href: marketingWorkspaceHref(peer.id),
    });
  }

  return items;
}

function buildContextHealth(
  understanding: BuildHomeViewModelInput["understanding"],
  copy: ReturnType<typeof getHomeCopy>
): HomeContextHealth {
  if (!understanding?.available) {
    return {
      available: false,
      confidencePercent: null,
      label: copy.contextNotLoaded,
      gapLabel: copy.contextNotLoadedBody,
      improveHref: "/company",
    };
  }

  const firstGap = understanding.gaps[0];
  return {
    available: true,
    confidencePercent: understanding.completeness,
    label: `${understanding.completeness}% confident`,
    gapLabel: firstGap ? formatGapLabel(firstGap) : null,
    improveHref: firstGap
      ? knowledgeSectionHref(gapToKnowledgeSection(firstGap))
      : "/company",
  };
}

function buildNarrative(input: {
  copy: ReturnType<typeof getHomeCopy>;
  greeting: string;
  needsYou: HomeNeedsYouItem[];
  awayMovement: HomeMovementItem[];
  primaryMarketingName: string | null;
  isEmpty: boolean;
}): HomeMorningNarrative {
  const { copy, greeting, needsYou, awayMovement, primaryMarketingName, isEmpty } = input;

  if (isEmpty) {
    return {
      greeting,
      headline: copy.narratives.welcome,
      detail: copy.narratives.welcomeBody,
    };
  }

  if (awayMovement.length > 0) {
    const summary = awayMovement[0]?.title.toLowerCase() ?? "your team made progress";
    return {
      greeting,
      headline: copy.narratives.whileAway(summary),
      detail:
        needsYou.length > 0
          ? needsYou.length === 1
            ? copy.narratives.needsYouSingle(needsYou[0]!.peerName, needsYou[0]!.title)
            : copy.narratives.needsYouMultiple(needsYou.length)
          : undefined,
    };
  }

  if (needsYou.length === 1) {
    const item = needsYou[0]!;
    return {
      greeting,
      headline: copy.narratives.needsYouSingle(item.peerName, item.title),
      detail: item.subtitle,
    };
  }

  if (needsYou.length > 1) {
    return {
      greeting,
      headline: copy.narratives.needsYouMultiple(needsYou.length),
    };
  }

  if (primaryMarketingName) {
    return {
      greeting,
      headline: copy.narratives.calm(primaryMarketingName),
      detail: copy.allCaughtUpBody,
    };
  }

  return {
    greeting,
    headline: copy.allCaughtUp,
    detail: copy.allCaughtUpBody,
  };
}

function buildSuggestedStart(
  needsYou: HomeNeedsYouItem[],
  snapshots: BuildHomeViewModelInput["marketingSnapshots"],
  copy: ReturnType<typeof getHomeCopy>
): HomeSuggestedStart | null {
  const top = needsYou[0];
  if (top) {
    const isReview = top.title === copy.needsYouItems.reviewDraft;
    return {
      headline: isReview ? `${top.subtitle}` : top.title,
      detail: isReview
        ? `${top.peerName} · ${copy.estReviewMinutes}`
        : top.subtitle,
      ctaLabel: top.title,
      href: top.href,
    };
  }

  const firstMarketing = snapshots[0];
  if (firstMarketing) {
    return {
      headline: copy.teamPulseViewTeam,
      detail: firstMarketing.peer.name,
      ctaLabel: "Open workspace",
      href: marketingWorkspaceHref(firstMarketing.peer.id),
    };
  }

  return null;
}

export function buildHomeViewModel(input: BuildHomeViewModelInput): HomeViewModel {
  const locale = input.locale ?? "en";
  const copy = getHomeCopy(locale);
  const isEmpty = input.peers.length === 0;
  const greeting = greetingWithName(input.firstName, locale);

  const needsYou: HomeNeedsYouItem[] = buildAttentionItems({
    marketingSnapshots: input.marketingSnapshots,
    understanding: input.understanding,
    locale,
  });

  const recentMovement = buildMovementItems(input.marketingSnapshots);
  const awayMovement = movementSince(input.lastVisitAt, recentMovement);

  const teamPulse: HomeTeamPulseItem[] = buildTeamPulseItems({
    peers: input.peers.slice(0, 5),
    marketingSnapshots: input.marketingSnapshots,
    understanding: input.understanding,
    locale,
  });

  const primaryMarketingName =
    input.marketingSnapshots[0]?.peer.name ??
    input.peers.find((peer) => peer.role === "Marketing")?.name ??
    null;

  const narrative = buildNarrative({
    copy,
    greeting,
    needsYou,
    awayMovement,
    primaryMarketingName,
    isEmpty,
  });

  const workforceSummary = isEmpty
    ? emptyWorkforceSummary()
    : buildWorkforceSummary({
        activitySources: activitySourcesFromMarketingSnapshots(input.marketingSnapshots),
        lastVisitAt: input.lastVisitAt,
        teamPulse,
        needsYou,
      });

  return {
    narrative,
    needsYou: needsYou.slice(0, 5),
    suggestedStart: isEmpty
      ? {
          headline: copy.emptyPeersTitle,
          detail: copy.emptyPeersBody,
          ctaLabel: copy.emptyPeersCta,
          href: "/website-intelligence",
        }
      : buildSuggestedStart(needsYou, input.marketingSnapshots, copy),
    teamPulse,
    recentMovement,
    awayMovement,
    contextHealth: buildContextHealth(input.understanding, copy),
    workstreams: buildWorkstreams(input.marketingSnapshots, input.understanding),
    isEmpty,
    allCaughtUp: !isEmpty && needsYou.length === 0,
    workforceSummary,
  };
}
