import type { HomeCopy } from "@/lib/i18n";
import type {
  HomeMovementItem,
  HomeTeamPulseItem,
  HomeViewModel,
  HomeWorkstreamItem,
} from "@/lib/home";

export type PeerRecentAction = {
  title: string;
  time: string;
  href: string;
};

export type PeerAttentionItem = {
  title: string;
  context?: string;
  status: string;
  href: string;
  urgent: boolean;
};

export type PeerNextStep = {
  label: string;
  href: string;
};

export type PeerLiveStatus = {
  headline: string;
  action: string;
  timestampLabel?: string;
};

export type PeerCurrentWork = {
  title?: string;
  detail?: string;
  metadata: string[];
};

export type PeerColleagueView = {
  liveStatus: PeerLiveStatus;
  currentWork?: PeerCurrentWork;
  recentActions: PeerRecentAction[];
  attention: PeerAttentionItem[];
  nextStep?: PeerNextStep;
};

function normalizeText(value: string): string {
  return value.trim().replace(/\.{2,3}$/, "").replace(/…$/, "");
}

function textsEqual(a: string, b: string): boolean {
  return normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
}

/** Natural current-action sentence for collapsed cards — never duplicates status chip. */
export function peerCurrentAction(item: HomeTeamPulseItem, copy: HomeCopy): string {
  const detail = normalizeText(item.detail || "");
  const status = normalizeText(item.statusLabel || "");

  if (detail && !textsEqual(detail, status)) return detail;
  if (detail) return detail;

  switch (item.statusKind) {
    case "working":
      return copy.teamStatus.working;
    case "waiting":
      return "Waiting for your review";
    case "blocked":
      return copy.contextNotLoadedBody || "Needs your input to continue";
    case "paused":
      return copy.teamStatus.paused;
    default:
      return copy.teamStatus.idle;
  }
}

/** Short status chip — omitted when it would repeat the current action. */
export function peerStatusChip(item: HomeTeamPulseItem, currentAction: string): string | null {
  const status = normalizeText(item.statusLabel || "");
  if (!status || textsEqual(status, currentAction)) return null;
  return status;
}

function liveHeadline(statusKind: HomeTeamPulseItem["statusKind"]): string {
  switch (statusKind) {
    case "working":
      return "Working now";
    case "waiting":
      return "Waiting for you";
    case "blocked":
      return "Needs your input";
    case "paused":
      return "Paused";
    default:
      return "Standing by";
  }
}

function timestampPrefix(statusKind: HomeTeamPulseItem["statusKind"]): string {
  switch (statusKind) {
    case "working":
      return "Started or updated";
    case "waiting":
    case "blocked":
      return "Updated";
    default:
      return "Last activity";
  }
}

function movementsForPeer(
  viewModel: HomeViewModel,
  peerId: string,
  peerName: string
): HomeMovementItem[] {
  return viewModel.recentMovement.filter(
    (item) => item.id.startsWith(`${peerId}-`) || item.peerName === peerName
  );
}

function workstreamForPeer(
  viewModel: HomeViewModel,
  peerId: string
): HomeWorkstreamItem | undefined {
  return viewModel.workstreams.find((item) => item.peerId === peerId);
}

function latestTimestamp(
  movements: HomeMovementItem[],
  viewModel: HomeViewModel,
  peerId: string
): string | undefined {
  const movementTs = movements[0]?.timestamp;
  const needTs = viewModel.needsYou.find((item) => item.peerId === peerId)?.timestamp;
  const candidates = [movementTs, needTs].filter(Boolean) as string[];
  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function attentionStatus(item: HomeTeamPulseItem, copy: HomeCopy): string {
  if (item.statusKind === "waiting") return copy.teamStatus.waitingForYou;
  if (item.statusKind === "blocked") return copy.needsYouItems.improveContext;
  return item.statusLabel;
}

function buildCurrentWork(
  pulse: HomeTeamPulseItem,
  liveAction: string,
  workstream: HomeWorkstreamItem | undefined,
  movements: HomeMovementItem[]
): PeerCurrentWork | undefined {
  const metadata: string[] = [];
  const title = workstream?.title?.trim();
  const latestDescription = movements[0]?.description?.trim();

  if (workstream?.progressLabel) metadata.push(workstream.progressLabel);
  if (
    workstream?.statusLabel &&
    !metadata.some((line) => textsEqual(line, workstream.statusLabel))
  ) {
    metadata.push(workstream.statusLabel);
  }

  let detail: string | undefined;
  if (latestDescription && !textsEqual(latestDescription, liveAction)) {
    detail = latestDescription;
  } else if (
    pulse.detail &&
    !textsEqual(pulse.detail, liveAction) &&
    title &&
    !textsEqual(pulse.detail, title)
  ) {
    detail = normalizeText(pulse.detail);
  }

  const hasTitle = Boolean(title && !textsEqual(title, liveAction));
  const hasDetail = Boolean(detail);
  const hasMetadata = metadata.length > 0;

  if (!hasTitle && !hasDetail && !hasMetadata) return undefined;

  return {
    title: hasTitle ? title : undefined,
    detail: hasDetail ? detail : undefined,
    metadata,
  };
}

export function buildPeerColleagueView(
  pulse: HomeTeamPulseItem,
  viewModel: HomeViewModel,
  copy: HomeCopy,
  formatTime: (iso: string) => string
): PeerColleagueView {
  const movements = movementsForPeer(viewModel, pulse.peerId, pulse.name);
  const workstream = workstreamForPeer(viewModel, pulse.peerId);
  const liveAction = peerCurrentAction(pulse, copy);
  const ts = latestTimestamp(movements, viewModel, pulse.peerId);

  const attention = viewModel.needsYou
    .filter((item) => item.peerId === pulse.peerId)
    .map<PeerAttentionItem>((item) => ({
      title: item.title,
      context:
        item.subtitle && item.subtitle !== item.peerName ? item.subtitle : item.context,
      status:
        item.priority === "urgent"
          ? copy.teamStatus.waitingForYou
          : attentionStatus(pulse, copy),
      href: item.href,
      urgent: item.priority === "urgent",
    }));

  const recentActions = movements.slice(0, 3).map<PeerRecentAction>((item) => ({
    title: item.title,
    time: formatTime(item.timestamp),
    href: item.href,
  }));

  let nextStep: PeerNextStep | undefined;
  const topAttention = attention[0];
  if (topAttention) {
    nextStep = { label: topAttention.title, href: topAttention.href };
  } else if (pulse.statusKind === "waiting" || pulse.statusKind === "blocked") {
    nextStep = { label: liveAction, href: pulse.href };
  } else if (
    viewModel.suggestedStart &&
    viewModel.suggestedStart.href === pulse.href
  ) {
    nextStep = {
      label: viewModel.suggestedStart.ctaLabel,
      href: viewModel.suggestedStart.href,
    };
  } else {
    nextStep = { label: copy.ui.openWorkspace, href: pulse.href };
  }

  return {
    liveStatus: {
      headline: liveHeadline(pulse.statusKind),
      action: liveAction,
      timestampLabel: ts
        ? `${timestampPrefix(pulse.statusKind)} ${formatTime(ts)}`
        : undefined,
    },
    currentWork: buildCurrentWork(pulse, liveAction, workstream, movements),
    recentActions,
    attention,
    nextStep,
  };
}

export function buildAllPeerColleagueViews(
  teamPulse: HomeTeamPulseItem[],
  viewModel: HomeViewModel,
  copy: HomeCopy,
  formatTime: (iso: string) => string
): Map<string, PeerColleagueView> {
  const map = new Map<string, PeerColleagueView>();
  for (const pulse of teamPulse) {
    map.set(pulse.peerId, buildPeerColleagueView(pulse, viewModel, copy, formatTime));
  }
  return map;
}

export const buildPeerExpandedDetail = buildPeerColleagueView;
export const buildAllPeerExpandedDetails = buildAllPeerColleagueViews;
export type PeerExpandedDetail = PeerColleagueView;
