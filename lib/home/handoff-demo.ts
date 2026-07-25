import type { HandoffScene, HandoffState } from "./handoff-types";
import { HANDOFF_REFERENCE_DEMO } from "./handoff-visual";

/** Isolated preview fixtures for localhost review via ?handoff=<scene> */
export function handoffPreviewState(scene: HandoffScene): HandoffState {
  if (scene === "completed") {
    return { ...HANDOFF_REFERENCE_DEMO, isPreview: true };
  }

  const base = {
    isPreview: true as const,
    secondaryWork: [] as HandoffState["secondaryWork"],
    secondaryPriorities: HANDOFF_REFERENCE_DEMO.secondaryPriorities,
    companyActivity: { activeCount: 2, intensity: "medium" as const },
    responsiblePeer: { id: "preview-lolo", name: "LoLo", role: "Marketing" },
    destination: "/peers",
    personalGreeting: "Good morning.",
    headline: "LoLo finished your most important work.",
    categoryLabel: "STRATEGY",
    teamWorkingVisible: true,
  };

  switch (scene) {
    case "urgent":
      return {
        ...base,
        scene: "urgent",
        urgency: "urgent",
        greeting: "Morning.",
        briefingLines: ["This needs you before we can publish."],
        headline: "LoLo needs your decision before publishing.",
        primaryWork: {
          id: "preview-draft",
          title: "Q1 Launch Post",
          peerName: "LoLo",
          peerId: "preview-lolo",
          completedAt: new Date().toISOString(),
          completedAtLabel: "Today, 07:15",
          contextLine: "Waiting for your review",
          destination: "/peers",
          kind: "draft",
        },
        secondaryPriorities: [
          {
            id: "s1",
            title: "Competitor context",
            subtitle: "Data collection in progress",
            icon: "chart",
          },
        ],
        companyActivity: { activeCount: 1, intensity: "high" },
      };
    case "calm":
      return {
        ...base,
        scene: "calm",
        urgency: "calm",
        greeting: "Morning.",
        briefingLines: ["Nothing urgent.", "I'm planning next week's content."],
        headline: "LoLo is preparing your next priorities.",
        categoryLabel: "WORK",
        primaryWork: {
          id: "preview-plan",
          title: "Next Week's Plan",
          peerName: "LoLo",
          peerId: "preview-lolo",
          completedAt: null,
          completedAtLabel: null,
          contextLine: "In progress",
          destination: "/peers",
          kind: "workspace",
        },
        secondaryPriorities: [],
        companyActivity: { activeCount: 1, intensity: "low" },
      };
    case "blocked":
      return {
        ...base,
        scene: "blocked",
        urgency: "blocked",
        greeting: "Morning.",
        briefingLines: ["I can't move forward without competitor context."],
        headline: "LoLo is waiting on missing context.",
        categoryLabel: "CONTEXT",
        blockedReason: "Competitor context",
        primaryWork: {
          id: "preview-context",
          title: "Competitor Context",
          peerName: "LoLo",
          peerId: "preview-lolo",
          completedAt: null,
          completedAtLabel: null,
          contextLine: "Needed to continue",
          destination: "/knowledge",
          kind: "context",
        },
        secondaryPriorities: [],
        companyActivity: { activeCount: 0, intensity: "low" },
        teamWorkingVisible: false,
      };
    case "empty":
      return {
        ...base,
        scene: "empty",
        urgency: "calm",
        greeting: "Your studio is ready.",
        briefingLines: ["Hire your first colleague to get started."],
        personalGreeting: "Your studio is ready.",
        headline: "Your studio is ready to begin.",
        categoryLabel: "GET STARTED",
        primaryWork: {
          id: "preview-onboard",
          title: "Begin",
          peerName: "Peergent",
          peerId: "",
          completedAt: null,
          completedAtLabel: null,
          destination: "/website-intelligence",
          kind: "onboarding",
        },
        responsiblePeer: null,
        destination: "/website-intelligence",
        secondaryPriorities: [],
        companyActivity: { activeCount: 0, intensity: "low" },
        teamWorkingVisible: false,
      };
    default:
      return handoffPreviewState("completed");
  }
}

export const HANDOFF_PREVIEW_SCENES = [
  "completed",
  "urgent",
  "calm",
  "blocked",
  "empty",
] as const;
