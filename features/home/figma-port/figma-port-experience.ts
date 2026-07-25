import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomeCopy } from "@/lib/i18n";
import type {
  HomeMorningNarrative,
  HomeMovementItem,
  HomeNeedsYouItem,
  HomeTeamPulseItem,
  HomeViewModel,
} from "@/lib/home";
import { narrativeForBriefing } from "@/features/home/briefing/briefing-presenters";

/** Executive-assistant tone — built only from real view model fields. */
export function composeExecutiveNarrative(
  viewModel: HomeViewModel | null,
  handoff: HandoffState,
  copy: HomeCopy
): HomeMorningNarrative {
  const base = narrativeForBriefing(viewModel, handoff);

  if (!viewModel || viewModel.isEmpty) {
    return base;
  }

  const movementSource =
    viewModel.awayMovement.length > 0 ? viewModel.awayMovement : viewModel.recentMovement;
  const movement = movementSource.slice(0, 3);
  const needsYou = viewModel.needsYou;
  const working = viewModel.teamPulse.filter((p) => p.statusKind === "working");

  let headline = base.headline;
  let detail = base.detail;

  if (movement.length > 0) {
    headline = whileAwayHeadline(movement);
  }

  detail = executiveDetail({ needsYou, working, fallback: detail, copy });

  return {
    greeting: base.greeting,
    headline,
    detail,
  };
}

function whileAwayHeadline(movement: HomeMovementItem[]): string {
  const lines = movement.map(formatColleagueMoment);
  if (lines.length === 1) {
    return `While you were away, ${lines[0]}.`;
  }
  if (lines.length === 2) {
    return `While you were away, ${lines[0]}, and ${lines[1]}.`;
  }
  return `While you were away, ${lines.slice(0, -1).join(", ")}, and ${lines.at(-1)}.`;
}

function formatColleagueMoment(item: HomeMovementItem): string {
  const title = item.title.trim();
  const peer = item.peerName.trim();
  if (!title) return `${peer} moved work forward`;

  const lower =
    title.charAt(0).toLowerCase() + title.slice(1);
  if (lower.toLowerCase().startsWith(peer.toLowerCase())) {
    return lower;
  }

  const withPeer = `${peer} ${lower}`;
  if (/^(finished|completed|prepared|resolved|drafted|updated|sent|published|reviewed|scheduled|booked)/i.test(title)) {
    return withPeer;
  }

  if (item.description?.trim()) {
    return `${peer} ${item.description.trim().charAt(0).toLowerCase()}${item.description.trim().slice(1)}`;
  }

  return withPeer;
}

function executiveDetail(input: {
  needsYou: HomeNeedsYouItem[];
  working: HomeTeamPulseItem[];
  fallback?: string;
  copy: HomeCopy;
}): string | undefined {
  const { needsYou, working, fallback, copy } = input;

  if (needsYou.length === 1) {
    const item = needsYou[0]!;
    const task = item.subtitle || item.title;
    return `${item.peerName} finished ${task.charAt(0).toLowerCase()}${task.slice(1)} and is waiting for you. The rest of your workforce is already on today's priorities.`;
  }

  if (needsYou.length > 1) {
    const lead = needsYou[0]!;
    const others = needsYou.length - 1;
    const othersLabel =
      others === 1 ? "1 other colleague needs your judgment" : `${others} other colleagues need your judgment`;
    return `${lead.peerName} and ${othersLabel}. Everything else is already under control.`;
  }

  if (working.length > 0) {
    const names = working.slice(0, 2).map((p) => p.name);
    if (names.length === 1) {
      return `${names[0]} is already working through today's priorities. Nothing needs you right now.`;
    }
    return `${names.join(" and ")} are already working through today's priorities. Nothing needs you right now.`;
  }

  return fallback ?? copy.allCaughtUpBody;
}

/** Alive micro-copy for peer cards — derived from real status fields. */
export function peerPresenceLabel(item: HomeTeamPulseItem, copy: HomeCopy): string {
  if (item.detail?.trim()) {
    const detail = item.detail.trim();
    if (detail.endsWith("…") || detail.endsWith("...")) return detail;
    if (item.statusKind === "working") return `${detail}…`;
    return detail;
  }

  switch (item.statusKind) {
    case "working":
      return `${copy.teamStatus.working.toLowerCase()}…`;
    case "waiting":
      return "Waiting for your approval…";
    case "blocked":
      return "Needs your input…";
    case "paused":
      return `${copy.teamStatus.paused.toLowerCase()}…`;
    default:
      return `${copy.teamStatus.idle.toLowerCase()}…`;
  }
}

/** Peer names to highlight in morning brief prose. */
export function collectBriefPeerNames(viewModel: HomeViewModel | null): string[] {
  if (!viewModel) return [];
  const names = new Set<string>();
  for (const item of viewModel.recentMovement) names.add(item.peerName);
  for (const item of viewModel.needsYou) names.add(item.peerName);
  for (const item of viewModel.teamPulse) names.add(item.name);
  return [...names].filter(Boolean).sort((a, b) => b.length - a.length);
}
