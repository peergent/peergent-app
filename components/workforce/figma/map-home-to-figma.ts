import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";
import type { HandoffUrgency, HandoffWorkKind } from "@/lib/home/handoff-types";
import type { HomeMovementItem, HomeNeedsYouItem, HomeTeamPulseItem } from "@/lib/home";
import type { PrimaryActionPresentation } from "@/features/home/action/action-presenters";

export type FigmaDeptPalette = {
  color: string;
  bg: string;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
};

const KIND_ICONS = {
  strategy: Target,
  plan: Calendar,
  draft: FileText,
  publication: Rocket,
  context: Building2,
  onboarding: Sparkles,
  workspace: Briefcase,
} satisfies Record<HandoffWorkKind, LucideIcon>;

export function iconForWorkKind(kind: HandoffWorkKind): LucideIcon {
  return KIND_ICONS[kind] ?? Briefcase;
}

export function paletteForRole(role?: string, urgency?: HandoffUrgency): FigmaDeptPalette {
  const r = role?.toLowerCase() ?? "";
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
      statusBg: "rgba(245,158,11,0.1)",
      statusBorder: "rgba(245,158,11,0.2)",
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

export type FigmaAgentSlide = {
  id: string;
  title: string;
  desc: string;
  peerName: string;
  peerRole?: string;
  status: string;
  palette: FigmaDeptPalette;
  meta: string[];
  cta: string;
  secondary: string;
  destination: string;
  secondaryHref?: string;
  kind: HandoffWorkKind;
};

export function agentSlidesFromPrimary(
  primary: PrimaryActionPresentation | null,
  statusLabels: {
    waiting: string;
    blocked: string;
    inProgress: string;
    ready: string;
  },
  openLabel: string,
  openWorkspaceLabel: string
): FigmaAgentSlide[] {
  if (!primary) return [];

  const { work, urgency, peerRole, categoryLabel, ctaLabel } = primary;
  const palette = paletteForRole(peerRole ?? work.peerName, urgency);

  const status =
    work.contextLine ??
    (urgency === "urgent"
      ? statusLabels.waiting
      : urgency === "blocked"
        ? statusLabels.blocked
        : urgency === "calm"
          ? statusLabels.inProgress
          : statusLabels.ready);

  const meta: string[] = [];
  if (work.completedAtLabel) meta.push(work.completedAtLabel);
  if (categoryLabel) meta.push(categoryLabel);

  return [
    {
      id: work.id,
      title: work.title,
      desc: work.contextLine && work.contextLine !== status ? work.contextLine : status,
      peerName: work.peerName,
      peerRole,
      status,
      palette,
      meta,
      cta: ctaLabel ?? openLabel,
      secondary: openWorkspaceLabel,
      destination: work.destination,
      secondaryHref: work.peerId ? `/team/${work.peerId}` : undefined,
      kind: work.kind,
    },
  ];
}

export function activityColorForPeer(peerName: string): string {
  return paletteForRole(peerName).color;
}

export function peerPalette(name: string, role: string, index: number): FigmaDeptPalette & { delay: number } {
  const palette = paletteForRole(role);
  return { ...palette, delay: index * 0.3 };
}

export function movementToActivityRows(items: HomeMovementItem[]) {
  return items.map((item, index) => ({
    id: item.id,
    title: item.title,
    desc: item.description || item.peerName,
    time: item.timestamp,
    href: item.href,
    color: activityColorForPeer(item.peerName),
    emphasis: index === 0,
    opacity: index === 0 ? 1 : Math.max(0.38, 1 - index * 0.1),
  }));
}

export function teamPulseToPeerCards(items: HomeTeamPulseItem[]) {
  return items.map((item, index) => ({
    ...item,
    palette: peerPalette(item.name, item.role, index),
    isWorking: item.statusKind === "working",
  }));
}

export function attentionRows(items: HomeNeedsYouItem[]) {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: [item.subtitle, item.context].filter(Boolean).join(" · "),
    href: item.href,
    urgent: item.priority === "urgent",
  }));
}
