import type {
  ActivityEntry,
  BusinessDomain,
  ExecutiveBrief,
  Opportunity,
  QualitativeHealthState,
  RecommendedAction,
} from "./types";

export function getExecutiveBrief(
  hasPeers: boolean,
  hasWebsite: boolean
): ExecutiveBrief {
  if (!hasPeers && !hasWebsite) {
    return {
      conclusion: "Not enough context to brief you with confidence yet.",
      rationale: "No website analysis and no peers on record.",
      primaryAction: {
        label: "See website analysis",
        href: "/website-intelligence",
      },
    };
  }

  if (!hasPeers && hasWebsite) {
    return {
      conclusion: "Your public presence is on file. No one is inside yet.",
      rationale: "Website signals exist — a workforce is the missing piece.",
      primaryAction: {
        label: "See recommended roles",
        href: "/website-intelligence",
      },
    };
  }

  return {
    conclusion: "Workforce is live. The business picture is still forming.",
    rationale: "Deployment is clear; connected sources will sharpen confidence.",
    primaryAction: {
      label: "Deepen business context",
      href: "/knowledge",
    },
  };
}

export function getOverallHealthState(
  completenessPercent: number
): QualitativeHealthState {
  if (completenessPercent === 0) {
    return "more-data-required";
  }

  if (completenessPercent < 40) {
    return "baseline-in-progress";
  }

  return "preliminary";
}

export const BUSINESS_DOMAINS: BusinessDomain[] = [
  {
    id: "marketing",
    name: "Marketing",
    state: "needs-data",
    note: "Awaiting analytics",
  },
  {
    id: "operations",
    name: "Operations",
    state: "not-assessed",
    note: "Scan not completed",
  },
  {
    id: "sales",
    name: "Sales",
    state: "developing",
    note: "Early website signals",
  },
  {
    id: "customer-experience",
    name: "Customer Experience",
    state: "needs-data",
    note: "No CRM connected",
  },
  {
    id: "automation",
    name: "Automation",
    state: "developing",
    note: "Peers deployed",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    state: "needs-data",
    note: "No documents uploaded",
  },
];

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "planning",
    rank: 1,
    title: "Planning & scheduling coverage",
    impactType: "Time recovery",
    estimate: "More data required",
    confidence: "low",
    signals: ["Manual scheduling mentioned in common SME workflows"],
    missingData: ["Calendar integration", "Operations Scan", "Booking volume"],
    action: {
      label: "Review AI workforce",
      href: "/peers",
    },
  },
  {
    id: "marketing",
    rank: 2,
    title: "Marketing consistency",
    impactType: "Growth efficiency",
    estimate: "Provisional — moderate content bottleneck likely",
    confidence: "low",
    signals: ["Website presence detected", "No analytics connected"],
    missingData: ["Google Analytics", "Campaign performance history"],
    action: {
      label: "Connect Google Analytics",
      disabled: true,
    },
  },
  {
    id: "support",
    rank: 3,
    title: "Customer support response",
    impactType: "Customer retention",
    estimate: "More data required",
    confidence: "low",
    signals: ["Support-style website content patterns"],
    missingData: ["Ticket volume", "CRM", "Knowledge uploads"],
    action: {
      label: "Upload company knowledge",
      href: "/knowledge",
    },
  },
];

export const RECOMMENDED_ACTIONS: RecommendedAction[] = [
  {
    id: "operations-scan",
    label: "Operations Scan",
    description: "Scheduling handoffs may be leaking time.",
    disabled: true,
    disabledReason: "Coming soon",
  },
  {
    id: "google-analytics",
    label: "Google Analytics",
    description: "No traffic history — marketing stays low-confidence.",
    disabled: true,
    disabledReason: "Coming soon",
  },
  {
    id: "knowledge",
    label: "Company knowledge",
    description: "Capability rises once the business context is on file.",
    href: "/knowledge",
  },
  {
    id: "workforce",
    label: "AI workforce",
    description: "Peers already shape how I read operations.",
    href: "/peers",
  },
];

export const RECENT_ACTIVITY: ActivityEntry[] = [
  {
    id: "activity-1",
    time: "Today · 09:10",
    title: "Website context reviewed",
    description: "Follow-up opportunities noted.",
  },
  {
    id: "activity-2",
    time: "Yesterday · 16:42",
    title: "Workforce recommendation ready",
    description: "Support peer may reduce repeat questions.",
  },
  {
    id: "activity-3",
    time: "Yesterday · 11:05",
    title: "Knowledge gap noted",
    description: "Documents would improve answer confidence.",
  },
];
