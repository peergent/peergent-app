import type { HandoffPrimaryWork, HandoffState, HandoffWorkKind } from "./handoff-types";

/** Reference visual demo — isolated fixtures for localhost review. */
export const HANDOFF_REFERENCE_DEMO: HandoffState = {
  scene: "completed",
  urgency: "normal",
  greeting: "Good morning, Djemo.",
  briefingLines: ["LoLo finished your most important work."],
  personalGreeting: "Good morning, Djemo.",
  headline: "LoLo finished your most important work.",
  categoryLabel: "STRATEGY",
  waitLine: undefined,
  primaryWork: {
    id: "demo-launch-strategy",
    title: "Launch Strategy",
    peerName: "LoLo",
    peerId: "demo-lolo",
    completedAt: new Date().toISOString(),
    completedAtLabel: "Today, 08:42",
    contextLine: undefined,
    destination: "/peers",
    kind: "strategy",
  },
  secondaryWork: [],
  secondaryPriorities: [
    {
      id: "demo-campaign",
      title: "Campaign content",
      subtitle: "Ready when you are",
      icon: "document",
    },
    {
      id: "demo-competitor",
      title: "Competitor context",
      subtitle: "Data collection in progress",
      icon: "chart",
    },
  ],
  responsiblePeer: { id: "demo-lolo", name: "LoLo", role: "Marketing" },
  destination: "/peers",
  companyActivity: { activeCount: 2, intensity: "medium" },
  teamWorkingVisible: true,
  isPreview: true,
};

export function kindToCategoryLabel(kind: HandoffWorkKind): string {
  switch (kind) {
    case "strategy":
      return "STRATEGY";
    case "plan":
      return "CAMPAIGN PLAN";
    case "draft":
      return "DRAFT";
    case "publication":
      return "PUBLICATION";
    case "context":
      return "CONTEXT";
    case "onboarding":
      return "GET STARTED";
    default:
      return "WORK";
  }
}

export function formatCompletionLabel(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

    return isToday ? `Today, ${time}` : time;
  } catch {
    return null;
  }
}

export function buildPersonalGreeting(firstName?: string): string {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  if (!firstName?.trim()) return `${salutation}.`;
  return `${salutation}, ${firstName.trim()}.`;
}

export function buildHeadline(peerName: string, scene: HandoffState["scene"]): string {
  switch (scene) {
    case "urgent":
      return `${peerName} needs your decision before publishing.`;
    case "calm":
      return `${peerName} is preparing your next priorities.`;
    case "blocked":
      return `${peerName} is waiting on missing context.`;
    case "empty":
      return "Your studio is ready to begin.";
    default:
      return `${peerName} finished your most important work.`;
  }
}

export function secondaryPriorityFromLabel(
  id: string,
  label: string,
  destination?: string
): HandoffState["secondaryPriorities"][number] {
  const lower = label.toLowerCase();
  const icon = lower.includes("context") || lower.includes("competitor") ? "chart" : "document";
  let subtitle = "Ready when you are";
  if (lower.includes("context") || lower.includes("competitor")) {
    subtitle = "Data collection in progress";
  } else if (lower.includes("publication")) {
    subtitle = "Awaiting confirmation";
  }

  return {
    id,
    title: label,
    subtitle,
    destination,
    icon,
  };
}

export function enrichHandoffVisual(state: HandoffState, firstName?: string): HandoffState {
  const peerName = state.primaryWork?.peerName ?? state.responsiblePeer?.name ?? "Your peer";
  const personalGreeting = state.personalGreeting || buildPersonalGreeting(firstName);
  const headline = state.headline || buildHeadline(peerName, state.scene);
  const categoryLabel =
    state.categoryLabel || kindToCategoryLabel(state.primaryWork?.kind ?? "workspace");

  const completedAtLabel =
    state.primaryWork?.completedAtLabel ??
    formatCompletionLabel(state.primaryWork?.completedAt ?? null);

  const primaryWork = state.primaryWork
    ? { ...state.primaryWork, completedAtLabel: completedAtLabel ?? state.primaryWork.completedAtLabel }
    : null;

  const secondaryPriorities =
    state.secondaryPriorities.length > 0
      ? state.secondaryPriorities
      : state.secondaryWork.map((item) =>
          secondaryPriorityFromLabel(item.id, item.label, item.destination)
        );

  return {
    ...state,
    personalGreeting,
    headline,
    categoryLabel,
    primaryWork,
    secondaryPriorities: secondaryPriorities.slice(0, 2),
    teamWorkingVisible: state.teamWorkingVisible ?? state.companyActivity.activeCount > 0,
  };
}
