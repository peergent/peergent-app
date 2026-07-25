import { formatRelativeTime } from "../emma-narrative";
import {
  evaluateResponsibility,
} from "../responsibilities/evaluation-engine";
import {
  approvalPolicyLabel,
  autonomyDisplayLabel,
  cadenceLabel,
  projectsForResponsibility,
} from "../responsibilities/responsibility-engine";
import {
  MARKETING_RESPONSIBILITY_HEALTH_LABELS,
  type MarketingResponsibilityHealth,
} from "../responsibilities/types";
import { getResponsibilityHref } from "../navigation/marketing-peer-links";
import type { MarketingPeerDomainInput } from "./marketing-peer-domain-input";

export type MarketingResponsibilityCardViewModel = {
  id: string;
  title: string;
  goal: string;
  cadenceLabel: string;
  autonomyLabel: string;
  approvalLabel: string;
  health: MarketingResponsibilityHealth;
  healthLabel: string;
  healthReason?: string;
  lastEvaluationLabel: string;
  nextEvaluationLabel: string;
  enabled: boolean;
  activeProjectCount: number;
  planningMessage?: string;
  canApprovePlan: boolean;
  href: string;
};

export type MarketingResponsibilitiesViewModel = {
  cards: MarketingResponsibilityCardViewModel[];
  enabledCount: number;
  emptyMessage: string;
  introMessage: string;
};

function evaluationLabel(iso: string | null | undefined, fallback: string): string {
  if (!iso) return fallback;
  return formatRelativeTime(iso);
}

export function buildMarketingResponsibilitiesViewModel(
  input: MarketingPeerDomainInput
): MarketingResponsibilitiesViewModel {
  const enabled = input.responsibilities.filter((r) => r.enabled);

  const cards: MarketingResponsibilityCardViewModel[] = input.responsibilities.map(
    (responsibility) => {
      const evaluation = evaluateResponsibility({
        responsibility,
        projects: input.projects,
        plan: input.plan,
        connections: input.connections,
        peerName: input.peerName,
      });

      const activeProjects = projectsForResponsibility(responsibility.id, input.projects);
      const canApprovePlan =
        evaluation.action === "create_project" &&
        responsibility.autonomyLevel !== "manual";

      return {
        id: responsibility.id,
        title: responsibility.title,
        goal: responsibility.goal,
        cadenceLabel: cadenceLabel(responsibility.cadence),
        autonomyLabel: autonomyDisplayLabel(responsibility.autonomyLevel),
        approvalLabel: approvalPolicyLabel(responsibility.approvalPolicy),
        health: evaluation.health,
        healthLabel: MARKETING_RESPONSIBILITY_HEALTH_LABELS[evaluation.health],
        healthReason: evaluation.healthReason,
        lastEvaluationLabel: evaluationLabel(
          responsibility.lastEvaluation,
          "Not evaluated yet"
        ),
        nextEvaluationLabel: evaluationLabel(
          responsibility.nextEvaluation,
          "Pending first evaluation"
        ),
        enabled: responsibility.enabled,
        activeProjectCount: activeProjects.length,
        planningMessage:
          evaluation.action === "create_project" || evaluation.action === "recommend_strategy"
            ? evaluation.planningMessage ?? evaluation.reason
            : undefined,
        canApprovePlan,
        href: getResponsibilityHref(input.peerId, responsibility.id),
      };
    }
  );

  cards.sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return {
    cards,
    enabledCount: enabled.length,
    emptyMessage: "No responsibilities configured yet.",
    introMessage: `${input.peerName} owns long-term outcomes. Projects are temporary work she creates to fulfill these responsibilities.`,
  };
}
