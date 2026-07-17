import type { WebsiteIntelligenceAssessment, WorkforceRecommendation } from "@/lib/website-intelligence";
import { buildBusinessBrainReasoningViewModel } from "@/lib/website-intelligence/assessment-presenter";
import type { HireLiveStatus } from "./types";

export type HireEmployeeCard = {
  name: string;
  role: string;
  focus: string;
  bullets: string[];
  gradient: string;
};

export type HireIntegration = {
  id: string;
  label: string;
  state: "connected" | "recommended" | "optional";
  href?: string;
};

export type HirePersonalisationAnswers = {
  crm: string;
  leadRecipient: string;
  handover: string;
  language: string;
};

export type HireTeamViewModel = {
  companyName: string;
  websiteUrl: string;
  salesPeer: HireEmployeeCard;
  marketingPeer: HireEmployeeCard;
  salesRecommendation: WorkforceRecommendation;
  marketingRecommendation: WorkforceRecommendation;
  integrations: HireIntegration[];
  timelineSteps: string[];
  liveStatuses: HireLiveStatus[];
};

function findPeer(
  recommendations: WorkforceRecommendation[],
  role: string
): WorkforceRecommendation | undefined {
  return recommendations.find((r) => r.role === role);
}

function toEmployeeCard(
  rec: WorkforceRecommendation,
  focus: string,
  bullets: string[]
): HireEmployeeCard {
  return {
    name: rec.name,
    role: rec.role,
    focus,
    bullets,
    gradient: rec.gradient,
  };
}

function resolveCompanyName(assessment: WebsiteIntelligenceAssessment): string {
  const trimmed = assessment.meta.companyName?.trim();
  if (trimmed) return trimmed;

  try {
    const hostname = new URL(assessment.meta.url).hostname.replace(/^www\./, "");
    const segment = hostname.split(".")[0];
    if (segment) {
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  } catch {
    // fall through
  }

  return "your company";
}

export function buildHireTeamViewModel(
  assessment: WebsiteIntelligenceAssessment
): HireTeamViewModel {
  const recommendations = assessment.workforceRecommendations.recommendations;
  const salesRec = findPeer(recommendations, "Sales") ?? recommendations[0];
  const marketingRec =
    findPeer(recommendations, "Marketing") ?? recommendations[2] ?? recommendations[1];

  const reasoning = buildBusinessBrainReasoningViewModel(assessment);

  const integrations: HireIntegration[] = reasoning.waitingFor.map((chip, index) => ({
    id: chip.id,
    label: chip.label,
    state: index === 0 ? "recommended" : "optional",
    href: chip.href,
  }));

  if (integrations.length === 0) {
    integrations.push(
      { id: "crm", label: "HubSpot", state: "recommended" },
      { id: "analytics", label: "Google Analytics", state: "optional" },
      { id: "knowledge", label: "Knowledge Base", state: "optional" },
      { id: "operations-scan", label: "Search Console", state: "optional" }
    );
  }

  return {
    companyName: resolveCompanyName(assessment),
    websiteUrl: assessment.meta.url,
    salesRecommendation: salesRec,
    marketingRecommendation: marketingRec,
    salesPeer: toEmployeeCard(salesRec, "Revenue", [
      "Qualifies inbound leads",
      "Converts interest into meetings",
      "Keeps follow-up moving",
    ]),
    marketingPeer: toEmployeeCard(marketingRec, "Demand", [
      "Creates qualified demand",
      "Improves campaign execution",
      "Works alongside Sales Peer",
    ]),
    integrations,
    timelineSteps: [
      "Creating the shared workspace",
      "Building company memory",
      "Sales Peer learning products and services",
      "Marketing Peer understanding customers and positioning",
      "Connecting available company systems",
      "Team coordination ready",
    ],
    liveStatuses: [
      { label: salesRec.name, peer: "sales", message: "Learning your products…" },
      { label: marketingRec.name, peer: "marketing", message: "Understanding your customers…" },
      { label: "Business Brain", peer: "shared", message: "Building shared knowledge…" },
      { label: "Revenue team", peer: "team", message: "Preparing the first workflow…" },
    ],
  };
}

export const CRM_OPTIONS = [
  "HubSpot",
  "Salesforce",
  "Pipedrive",
  "Another CRM",
  "None yet",
] as const;

export const HANDOVER_OPTIONS = [
  "During business hours",
  "Any time",
  "Only for qualified opportunities",
  "I'll decide later",
] as const;

export const LANGUAGE_OPTIONS = [
  "Dutch",
  "English",
  "German",
  "Match the visitor",
] as const;

export const DEFAULT_PERSONALISATION: HirePersonalisationAnswers = {
  crm: "",
  leadRecipient: "",
  handover: "",
  language: "",
};

export function isEmailLike(value: string): boolean {
  return value.includes("@");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
