import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Megaphone,
  MessageCircle,
  PhoneCall,
  Rocket,
  Sparkles,
  Target,
  Bot,
} from "lucide-react";
import type { PrimaryActionPresentation } from "@/features/home/action/action-presenters";
import { primaryActionForHome } from "@/features/home/action/action-presenters";
import type { HandoffState, HandoffUrgency, HandoffWorkKind } from "@/lib/home/handoff-types";
import type { HomeCopy } from "@/lib/i18n";
import type { HomeMovementItem, HomeNeedsYouItem, HomeTeamPulseItem, HomeViewModel } from "@/lib/home";
import {
  buildExecutiveDecisionCard,
  buildExecutiveMorningBrief,
  type ExecutiveDecisionCardProps,
  type ExecutiveMorningBrief,
} from "./executive-brief";
import { collectBriefPeerNames } from "./figma-port-experience";
import { peerCurrentAction, peerStatusChip } from "./figma-port-peer-detail";

const KIND_ICONS = {
  strategy: Target,
  plan: Calendar,
  draft: FileText,
  publication: Rocket,
  context: Building2,
  onboarding: Sparkles,
  workspace: Briefcase,
} satisfies Record<HandoffWorkKind, LucideIcon>;

export type FigmaSlide = {
  id: string;
  Icon: LucideIcon;
  agent: string;
  dept: string;
  status: string;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
  color: string;
  bg: string;
  title: string;
  desc: string;
  meta: string[];
  cta: string;
  secondary: string;
  destination: string;
  secondaryHref?: string;
};

export type FigmaActivityRow = {
  id: string;
  title: string;
  desc: string;
  time: string;
  color: string;
  href: string;
};

export type FigmaPeerCard = {
  peerId: string;
  name: string;
  dept: string;
  currentAction: string;
  statusChip: string | null;
  statusKind: HomeTeamPulseItem["statusKind"];
  statusLabel: string;
  color: string;
  bg: string;
  Icon: LucideIcon;
  delay: number;
  href: string;
  isWorking: boolean;
};

function palette(role: string, urgency?: HandoffUrgency) {
  const r = role.toLowerCase();
  if (r.includes("marketing")) {
    return {
      color: "#4472FF",
      bg: "rgba(68,114,255,0.12)",
      statusColor: urgency === "urgent" ? "#F59E0B" : "#4472FF",
      statusBg: urgency === "urgent" ? "rgba(245,158,11,0.1)" : "rgba(68,114,255,0.1)",
      statusBorder: urgency === "urgent" ? "rgba(245,158,11,0.25)" : "rgba(68,114,255,0.25)",
    };
  }
  if (r.includes("sales")) {
    return {
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.12)",
      statusColor: "#8B5CF6",
      statusBg: "rgba(139,92,246,0.1)",
      statusBorder: "rgba(139,92,246,0.25)",
    };
  }
  if (r.includes("support")) {
    return {
      color: "#14B8A6",
      bg: "rgba(20,184,166,0.12)",
      statusColor: "#14B8A6",
      statusBg: "rgba(20,184,166,0.1)",
      statusBorder: "rgba(20,184,166,0.25)",
    };
  }
  if (r.includes("finance")) {
    return {
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.12)",
      statusColor: "#F59E0B",
      statusBg: "rgba(52,211,153,0.1)",
      statusBorder: "rgba(52,211,153,0.2)",
    };
  }
  return {
    color: "#7B6FFF",
    bg: "rgba(123,111,255,0.12)",
    statusColor: urgency === "urgent" ? "#F59E0B" : "#7B6FFF",
    statusBg: urgency === "urgent" ? "rgba(245,158,11,0.1)" : "rgba(123,111,255,0.1)",
    statusBorder: urgency === "urgent" ? "rgba(245,158,11,0.25)" : "rgba(123,111,255,0.25)",
  };
}

function iconForRole(role: string, kind?: HandoffWorkKind): LucideIcon {
  if (kind && KIND_ICONS[kind]) return KIND_ICONS[kind];
  const r = role.toLowerCase();
  if (r.includes("marketing")) return Megaphone;
  if (r.includes("sales")) return PhoneCall;
  if (r.includes("support")) return MessageCircle;
  return Bot;
}

function slideFromNeed(item: HomeNeedsYouItem, copy: HomeCopy, handoff: HandoffState): FigmaSlide {
  const role = item.subtitle || handoff.responsiblePeer?.role || "Team";
  const pal = palette(role, item.priority === "urgent" ? "urgent" : "normal");
  const title =
    item.subtitle && item.subtitle !== item.peerName ? item.subtitle : item.title.replace(/^Review /i, "");

  return {
    id: item.id,
    Icon: iconForRole(role),
    agent: item.peerName,
    dept: role,
    status: item.priority === "urgent" ? copy.ui.primaryStatusWaitingReview : copy.ui.primaryStatusReadyForReview,
    statusColor: pal.statusColor,
    statusBg: pal.statusBg,
    statusBorder: pal.statusBorder,
    color: pal.color,
    bg: pal.bg,
    title,
    desc: item.context ?? item.subtitle ?? item.title,
    meta: item.context ? [item.context] : [],
    cta: item.title,
    secondary: copy.ui.openWorkspace,
    destination: item.href,
    secondaryHref: item.peerId ? `/team/${item.peerId}` : undefined,
  };
}

function slideFromPrimary(p: PrimaryActionPresentation, copy: HomeCopy): FigmaSlide {
  const { work, urgency, peerRole, categoryLabel, ctaLabel } = p;
  const pal = palette(peerRole ?? work.peerName, urgency);
  const status =
    work.contextLine ??
    (urgency === "urgent"
      ? copy.ui.primaryStatusWaitingReview
      : urgency === "blocked"
        ? copy.ui.primaryStatusNeededToContinue
        : urgency === "calm"
          ? copy.ui.primaryStatusInProgress
          : copy.ui.primaryStatusReadyForReview);

  const meta: string[] = [];
  if (work.completedAtLabel) meta.push(work.completedAtLabel);
  if (categoryLabel) meta.push(categoryLabel);

  return {
    id: work.id,
    Icon: iconForRole(peerRole ?? "", work.kind),
    agent: work.peerName,
    dept: peerRole ?? "Team",
    status,
    statusColor: pal.statusColor,
    statusBg: pal.statusBg,
    statusBorder: pal.statusBorder,
    color: pal.color,
    bg: pal.bg,
    title: work.title,
    desc: work.contextLine && work.contextLine !== status ? work.contextLine : status,
    meta,
    cta: ctaLabel ?? copy.ui.open,
    secondary: copy.ui.openWorkspace,
    destination: work.destination,
    secondaryHref: work.peerId ? `/team/${work.peerId}` : undefined,
  };
}

export function buildAgentSlides(handoff: HandoffState, viewModel: HomeViewModel | null, copy: HomeCopy): FigmaSlide[] {
  const needsYou = viewModel?.needsYou ?? [];
  const slides: FigmaSlide[] = [];
  const seen = new Set<string>();

  const primary = primaryActionForHome(handoff, viewModel);
  if (primary) {
    slides.push(slideFromPrimary(primary, copy));
    seen.add(primary.work.id);
  }

  for (const item of needsYou) {
    if (seen.has(item.id)) continue;
    slides.push(slideFromNeed(item, copy, handoff));
    seen.add(item.id);
  }

  return slides;
}

export function buildBrief(input: {
  viewModel: HomeViewModel | null;
  handoff: HandoffState;
  copy: HomeCopy;
}): {
  brief: ExecutiveMorningBrief;
  decision: ExecutiveDecisionCardProps | null;
  workforceLine: string | null;
  peerNames: string[];
} {
  const { viewModel, handoff, copy } = input;

  const workforceLine =
    handoff.teamWorkingVisible && handoff.companyActivity.activeCount > 0
      ? `${copy.ui.workforceWorking} ${handoff.companyActivity.activeCount === 1 ? copy.ui.colleaguesActiveSingle : copy.ui.colleaguesActiveMultiple(handoff.companyActivity.activeCount)}`
      : null;

  return {
    brief: buildExecutiveMorningBrief({ viewModel, handoff, copy }),
    decision: buildExecutiveDecisionCard(viewModel, handoff, copy),
    workforceLine,
    peerNames: collectBriefPeerNames(viewModel),
  };
}

export function buildActivityRows(
  items: HomeMovementItem[],
  formatTime: (iso: string) => string
): FigmaActivityRow[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    desc: item.description || item.peerName,
    time: formatTime(item.timestamp),
    color: palette(item.peerName).color,
    href: item.href,
  }));
}

export function buildPeerCards(items: HomeTeamPulseItem[], copy: HomeCopy): FigmaPeerCard[] {
  return items.map((item, index) => {
    const pal = palette(item.role);
    const currentAction = peerCurrentAction(item, copy);
    return {
      peerId: item.peerId,
      name: item.name,
      dept: item.role,
      currentAction,
      statusChip: peerStatusChip(item, currentAction),
      statusKind: item.statusKind,
      statusLabel: item.statusLabel,
      color: pal.color,
      bg: pal.bg,
      Icon: iconForRole(item.role),
      delay: index * 0.37,
      href: item.href,
      isWorking: item.statusKind === "working",
    };
  });
}

export function activityColor(peerName: string): string {
  return palette(peerName).color;
}
