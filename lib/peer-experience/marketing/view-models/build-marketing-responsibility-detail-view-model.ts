import { formatRelativeTime } from "../emma-narrative";
import { getKnowledgeHref, getProjectHref, getResponsibilityHref } from "../navigation/marketing-peer-links";
import { evaluateResponsibility } from "../responsibilities/evaluation-engine";
import {
  approvalPolicyLabel,
  autonomyDisplayLabel,
  cadenceLabel,
} from "../responsibilities/responsibility-engine";
import {
  MARKETING_RESPONSIBILITY_HEALTH_LABELS,
  type MarketingResponsibilityGuardrails,
} from "../responsibilities/types";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type ResponsibilityProjectItem = {
  id: string;
  title: string;
  statusLabel: string;
  href: string;
  updatedLabel: string;
};

export type MarketingResponsibilityDetailViewModel = {
  id: string;
  title: string;
  description: string;
  goal: string;
  successMetric?: string;
  cadenceLabel: string;
  autonomyLabel: string;
  approvalLabel: string;
  healthLabel: string;
  healthReason?: string;
  lastEvaluationLabel: string;
  nextEvaluationLabel: string;
  enabled: boolean;
  evaluationReason: string;
  planningMessage?: string;
  canApprovePlan: boolean;
  approveLabel: string;
  projects: ResponsibilityProjectItem[];
  guardrails: Array<{ label: string; value: string }>;
  knowledgeSections: Array<{ label: string; href: string }>;
  backHref: string;
};

function guardrailEntries(guardrails: MarketingResponsibilityGuardrails): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];
  if (guardrails.maxPostsPerWeek != null) {
    entries.push({ label: "Max posts per week", value: String(guardrails.maxPostsPerWeek) });
  }
  if (guardrails.brandTone) {
    entries.push({ label: "Brand tone", value: guardrails.brandTone });
  }
  if (guardrails.maxMonthlySpend != null) {
    entries.push({ label: "Max monthly spend", value: String(guardrails.maxMonthlySpend) });
  }
  if (guardrails.approvalRequired != null) {
    entries.push({
      label: "Approval required",
      value: guardrails.approvalRequired ? "Yes" : "No",
    });
  }
  if (guardrails.imageGenerationPolicy) {
    entries.push({
      label: "Image generation",
      value: guardrails.imageGenerationPolicy.replace(/_/g, " "),
    });
  }
  if (guardrails.competitorMonitoringFrequency) {
    entries.push({
      label: "Competitor monitoring",
      value: guardrails.competitorMonitoringFrequency,
    });
  }
  if (guardrails.riskTolerance) {
    entries.push({ label: "Risk tolerance", value: guardrails.riskTolerance });
  }
  return entries;
}

export function buildMarketingResponsibilityDetailViewModel(
  input: MarketingPeerDomainInput & { responsibilityId: string }
): MarketingResponsibilityDetailViewModel | null {
  const responsibility = input.responsibilities.find((r) => r.id === input.responsibilityId);
  if (!responsibility) return null;

  const evaluation = evaluateResponsibility({
    responsibility,
    projects: input.projects,
    plan: input.plan,
    connections: input.connections,
    peerName: input.peerName,
  });

  const linkedProjects = input.projects
    .filter((p) => p.responsibilityId === responsibility.id && !p.archivedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map((project) => ({
      id: project.id,
      title: project.title,
      statusLabel: project.archivedAt ? "Archived" : "Active",
      href: getProjectHref(input.peerId, project.id),
      updatedLabel: formatRelativeTime(project.updatedAt),
    }));

  const canApprovePlan =
    evaluation.action === "create_project" && responsibility.autonomyLevel !== "manual";

  return {
    id: responsibility.id,
    title: responsibility.title,
    description: responsibility.description,
    goal: responsibility.goal,
    successMetric: responsibility.successMetric,
    cadenceLabel: cadenceLabel(responsibility.cadence),
    autonomyLabel: autonomyDisplayLabel(responsibility.autonomyLevel),
    approvalLabel: approvalPolicyLabel(responsibility.approvalPolicy),
    healthLabel: MARKETING_RESPONSIBILITY_HEALTH_LABELS[evaluation.health],
    healthReason: evaluation.healthReason,
    lastEvaluationLabel: responsibility.lastEvaluation
      ? formatRelativeTime(responsibility.lastEvaluation)
      : "Not evaluated yet",
    nextEvaluationLabel: responsibility.nextEvaluation
      ? formatRelativeTime(responsibility.nextEvaluation)
      : "Pending first evaluation",
    enabled: responsibility.enabled,
    evaluationReason: evaluation.reason,
    planningMessage: evaluation.planningMessage,
    canApprovePlan,
    approveLabel:
      evaluation.action === "recommend_strategy"
        ? "Create strategy"
        : responsibility.autonomyLevel === "autonomous" || responsibility.autonomyLevel === "full"
          ? "Allow automatic planning"
          : "Approve plan",
    projects: linkedProjects,
    guardrails: guardrailEntries(responsibility.guardrails),
    knowledgeSections: [
      { label: "Brand voice", href: getKnowledgeHref(input.peerId, "brand") },
      { label: "Products", href: getKnowledgeHref(input.peerId, "products") },
      { label: "Target audience", href: getKnowledgeHref(input.peerId, "audience") },
      { label: "Competitors", href: getKnowledgeHref(input.peerId, "competitors") },
    ],
    backHref: getResponsibilityHref(input.peerId),
  };
}
