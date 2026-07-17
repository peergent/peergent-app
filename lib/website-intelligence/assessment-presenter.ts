import type {
  DataSourceId,
  QualitativeConfidence,
  WebsiteIntelligenceAssessment,
  WorkforceRecommendation,
} from "./types";
import { collectAllFindings } from "./demo-assessment";

export type TeamMemberView = {
  name: string;
  role: string;
};

export type BusinessBrainViewModel = {
  companyName: string;
  hostname: string;
  understandingFill: number;
  opportunity: string;
  opportunityReason: string;
  recommendedTeam: TeamMemberView[];
  hirePeer: WorkforceRecommendation;
};

export type WaitingForChip = {
  id: string;
  label: string;
  href?: string;
};

export type ReasoningConfidence = "Strong" | "Growing" | "Moderate" | "Early";

export type BusinessBrainReasoningViewModel = {
  observed: string[];
  likely: string[];
  waitingFor: WaitingForChip[];
  confidence: ReasoningConfidence;
};

function clampWords(text: string, maxWords: number): string {
  const words = text
    .replace(/[.,—–;:!?()[\]]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function dedupeLabels(labels: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const label of labels) {
    const key = label.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(label);
    if (result.length >= limit) break;
  }

  return result;
}

function deriveUnderstandingFill(confidence: QualitativeConfidence): number {
  if (confidence === "high") return 0.82;
  if (confidence === "moderate") return 0.58;
  return 0.34;
}

function deriveOpportunity(assessment: WebsiteIntelligenceAssessment): string {
  const journey = assessment.customerJourney.opportunities[0]?.statement;
  const ops = assessment.operations.areas
    .flatMap((area) => area.findings)
    .find((f) => f.category === "likely" || f.category === "observed")?.statement;

  const raw = journey ?? ops ?? "Capture inbound demand";
  const lower = raw.toLowerCase();

  if (lower.includes("qualif")) return "Lead qualification";
  if (lower.includes("hour") || lower.includes("always-on")) return "Capture inbound after hours";
  if (lower.includes("schedul") || lower.includes("appointment")) return "Reduce manual scheduling";
  if (lower.includes("support") || lower.includes("question")) return "Increase self-service";
  if (lower.includes("follow")) return "Automate lead follow-up";

  return clampWords(raw, 4);
}

function deriveOpportunityReason(assessment: WebsiteIntelligenceAssessment): string {
  const friction = assessment.customerJourney.frictionPoints[0]?.statement;
  const inbound = assessment.operations.areas
    .flatMap((area) => area.findings)
    .find((f) => f.id === "ops-lead-1" || f.statement.toLowerCase().includes("qualif"))
    ?.statement;

  const raw =
    inbound ??
    friction ??
    assessment.executiveSummary.rationale.split(".")[0] ??
    "Inbound interest is not yet being captured";

  return clampWords(raw, 12);
}

function findPeer(
  recommendations: WorkforceRecommendation[],
  matcher: (rec: WorkforceRecommendation) => boolean
) {
  return recommendations.find(matcher);
}

function buildRecommendedTeam(
  recommendations: WorkforceRecommendation[]
): TeamMemberView[] {
  const sales =
    findPeer(recommendations, (r) => r.role === "Sales") ?? recommendations[0];
  const marketing =
    findPeer(recommendations, (r) => r.role === "Marketing") ?? recommendations[2];

  const team: TeamMemberView[] = [];
  if (sales) team.push({ name: sales.name, role: sales.role });
  if (marketing) team.push({ name: marketing.name, role: marketing.role });
  return team;
}

const waitingForLabels: Record<DataSourceId, string> = {
  website: "Website",
  analytics: "Google Analytics",
  knowledge: "Knowledge Base",
  crm: "HubSpot",
  "operations-scan": "Search Console",
};

function toObservedLabel(statement: string): string {
  const lower = statement.toLowerCase();
  if (lower.includes("contact")) return "Contact form detected";
  if (lower.includes("pricing")) return "Pricing page found";
  if (lower.includes("public website") || lower.includes("site reachable"))
    return "Public website live";
  if (lower.includes("service")) return "High-value service";
  if (lower.includes("marketing channel")) return "Owned web channel";
  if (lower.includes("presents as")) return "Business profile identified";
  return clampWords(statement, 3);
}

function toLikelyLabel(statement: string): string {
  const lower = statement.toLowerCase();
  if (lower.includes("qualif")) return "Manual qualification";
  if (lower.includes("follow-up") || lower.includes("follow up")) return "Human follow-up";
  if (lower.includes("consultative") || lower.includes("trust")) return "Consultative sales";
  if (lower.includes("decision-maker")) return "B2B buyer journey";
  if (lower.includes("schedul") || lower.includes("appointment")) return "Manual scheduling";
  if (lower.includes("inbound") || lower.includes("enquir")) return "High-value leads";
  if (lower.includes("navigate")) return "Multi-step journey";
  if (lower.includes("testimonial") || lower.includes("case stud")) return "Trust-led conversion";
  if (lower.includes("automation")) return "Automation opportunity";
  if (lower.includes("content marketing")) return "Content-led demand";
  return clampWords(statement, 3);
}

function deriveReasoningConfidence(fill: number): ReasoningConfidence {
  if (fill >= 0.75) return "Strong";
  if (fill >= 0.55) return "Growing";
  if (fill >= 0.4) return "Moderate";
  return "Early";
}

function collectWaitingFor(assessment: WebsiteIntelligenceAssessment): WaitingForChip[] {
  const slots = [
    ...assessment.marketingGrowth.enrichmentSlots,
    ...assessment.operations.enrichmentSlots,
  ];
  const seen = new Set<string>();
  const chips: WaitingForChip[] = [];

  for (const slot of slots) {
    if (slot.status === "connected" || seen.has(slot.source)) continue;
    seen.add(slot.source);
    chips.push({
      id: slot.source,
      label: waitingForLabels[slot.source] ?? slot.label,
      href: slot.href,
    });
    if (chips.length >= 4) break;
  }

  return chips;
}

export function buildBusinessBrainReasoningViewModel(
  assessment: WebsiteIntelligenceAssessment
): BusinessBrainReasoningViewModel {
  const allFindings = collectAllFindings(assessment);

  const observed = dedupeLabels(
    allFindings
      .filter((f) => f.category === "observed")
      .map((f) => toObservedLabel(f.statement)),
    3
  );

  const likely = dedupeLabels(
    allFindings
      .filter((f) => f.category === "likely")
      .map((f) => toLikelyLabel(f.statement)),
    3
  );

  if (observed.length === 0) observed.push("Website signals detected");
  if (likely.length === 0) likely.push("Inbound conversion gaps");

  const fill = deriveUnderstandingFill(assessment.confidenceSnapshot.overall);

  return {
    observed,
    likely,
    waitingFor: collectWaitingFor(assessment),
    confidence: deriveReasoningConfidence(fill),
  };
}

export function buildBusinessBrainViewModel(
  assessment: WebsiteIntelligenceAssessment
): BusinessBrainViewModel {
  const hostname = assessment.meta.url
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const recommendations = assessment.workforceRecommendations.recommendations;
  const hirePeer =
    findPeer(recommendations, (r) => r.role === "Sales") ?? recommendations[0];

  return {
    companyName: assessment.meta.companyName,
    hostname,
    understandingFill: deriveUnderstandingFill(assessment.confidenceSnapshot.overall),
    opportunity: deriveOpportunity(assessment),
    opportunityReason: deriveOpportunityReason(assessment),
    recommendedTeam: buildRecommendedTeam(recommendations),
    hirePeer,
  };
}
