import type { MarketingPlan } from "@/lib/marketing-intelligence";
import type { IntegrationConnection } from "@/lib/integrations/types";
import type { MarketingProject } from "../projects/types";
import { integrationForCategory } from "./responsibility-catalog";
import type {
  MarketingAutonomyLevel,
  MarketingResponsibility,
  MarketingResponsibilityHealth,
  ResponsibilityEvaluationAction,
  ResponsibilityEvaluationResult,
  ResponsibilityPlanningItem,
} from "./types";
import { MARKETING_AUTONOMY_LEVEL_LABELS } from "./types";

export type EvaluateResponsibilityInput = {
  responsibility: MarketingResponsibility;
  projects: MarketingProject[];
  plan: MarketingPlan | null;
  connections: IntegrationConnection[];
  peerName: string;
};

function channelMatchesCategory(text: string, category: MarketingResponsibility["category"]): boolean {
  const haystack = text.toLowerCase();
  switch (category) {
    case "instagram":
      return haystack.includes("instagram");
    case "linkedin":
      return haystack.includes("linkedin");
    case "newsletter":
      return haystack.includes("newsletter") || haystack.includes("email");
    case "seo":
      return haystack.includes("seo") || haystack.includes("search");
    case "google_ads":
      return haystack.includes("google") && haystack.includes("ad");
    case "meta_ads":
      return haystack.includes("meta") || haystack.includes("facebook");
    case "blog":
      return haystack.includes("blog");
    case "website":
      return haystack.includes("landing") || haystack.includes("website");
    default:
      return haystack.includes(category.replace(/_/g, " "));
  }
}

function activeProjectsForResponsibility(
  responsibility: MarketingResponsibility,
  projects: MarketingProject[]
): MarketingProject[] {
  return projects.filter(
    (p) =>
      p.responsibilityId === responsibility.id ||
      (p.responsibilityId == null &&
        channelMatchesCategory(`${p.title} ${p.goal} ${p.campaignType}`, responsibility.category))
  ).filter((p) => !p.archivedAt);
}

function integrationBlocked(
  responsibility: MarketingResponsibility,
  connections: IntegrationConnection[]
): { blocked: boolean; reason?: string } {
  const integrationId = integrationForCategory(responsibility.category);
  if (!integrationId) return { blocked: false };

  const connection = connections.find((c) => c.id === integrationId);
  if (!connection) {
    return {
      blocked: true,
      reason: `${responsibility.title} platform is not connected.`,
    };
  }
  if (connection.status === "needs_reconnect") {
    return {
      blocked: true,
      reason: `${connection.label} connection expired.`,
    };
  }
  if (connection.status !== "connected") {
    return {
      blocked: true,
      reason: `${connection.label} is not connected.`,
    };
  }
  return { blocked: false };
}

function calendarGapForCategory(
  plan: MarketingPlan | null,
  category: MarketingResponsibility["category"]
): boolean {
  if (!plan?.contentCalendar?.length) return false;
  const matching = plan.contentCalendar.filter((item) =>
    channelMatchesCategory(`${item.title} ${item.contentType}`, category)
  );
  if (matching.length === 0) return true;
  const maxWeek = Math.max(...plan.contentCalendar.map((c) => c.scheduledWeek ?? 0));
  const nearTerm = matching.filter((c) => (c.scheduledWeek ?? 0) <= maxWeek && (c.scheduledWeek ?? 0) >= maxWeek - 1);
  return nearTerm.length === 0;
}

function daysSince(iso: string | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function canAutoCreateProject(autonomy: MarketingAutonomyLevel): boolean {
  return autonomy === "autonomous" || autonomy === "full";
}

function canSuggestProject(autonomy: MarketingAutonomyLevel): boolean {
  return autonomy !== "manual";
}

export function evaluateResponsibility(
  input: EvaluateResponsibilityInput
): ResponsibilityEvaluationResult {
  const { responsibility, projects, plan, connections, peerName } = input;
  const evaluatedAt = new Date().toISOString();
  const active = activeProjectsForResponsibility(responsibility, projects);
  const connection = integrationBlocked(responsibility, connections);

  if (!responsibility.enabled) {
    return {
      responsibilityId: responsibility.id,
      evaluatedAt,
      action: "no_action",
      reason: "Responsibility is paused.",
      health: "waiting",
      healthReason: "Paused by you",
    };
  }

  if (connection.blocked) {
    return {
      responsibilityId: responsibility.id,
      evaluatedAt,
      action: "ask_user",
      reason: connection.reason ?? "Connection required.",
      health: "blocked",
      healthReason: connection.reason,
      planningMessage: `${peerName} cannot execute ${responsibility.title} work until the channel is connected.`,
    };
  }

  if (!plan) {
    return {
      responsibilityId: responsibility.id,
      evaluatedAt,
      action: "recommend_strategy",
      reason: "Campaign plan required before Emma can schedule work.",
      health: "needs_attention",
      healthReason: "No campaign plan yet",
      planningMessage: `${peerName} needs a campaign plan before she can plan ${responsibility.title} work.`,
    };
  }

  const hasGap = calendarGapForCategory(plan, responsibility.category);
  const lastProject = active.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];
  const daysSinceLast = daysSince(lastProject?.updatedAt);
  const cadenceDays =
    responsibility.cadence.type === "weekly"
      ? 7
      : responsibility.cadence.type === "monthly"
        ? 28
        : responsibility.cadence.evaluationIntervalDays ?? 7;

  if (active.some((p) => !p.archivedAt && p.updatedAt > new Date(Date.now() - 86400000).toISOString())) {
    return {
      responsibilityId: responsibility.id,
      evaluatedAt,
      action: "no_action",
      reason: "Emma is already working on a project for this responsibility.",
      health: "healthy",
    };
  }

  const overdue =
    daysSinceLast === null ? hasGap : daysSinceLast >= cadenceDays || hasGap;

  if (overdue && canSuggestProject(responsibility.autonomyLevel)) {
    const title =
      responsibility.category === "newsletter"
        ? `${responsibility.title} ${new Date().toLocaleString("default", { month: "long" })}`
        : `${responsibility.title} Campaign`;
    const planningMessage =
      responsibility.category === "instagram"
        ? `I've noticed next week has no scheduled Instagram content. I recommend preparing content for ${responsibility.title}.`
        : hasGap
          ? `There's a gap in planned ${responsibility.title} work. I recommend starting a new project.`
          : `It's time for the next ${responsibility.title} cycle based on your cadence.`;

    return {
      responsibilityId: responsibility.id,
      evaluatedAt,
      action: "create_project",
      reason: hasGap ? "Content gap detected in campaign plan." : "Cadence interval reached.",
      health: hasGap ? "needs_attention" : "healthy",
      healthReason: hasGap ? "No content planned for upcoming period" : undefined,
      planningMessage,
      proposedProject: {
        title,
        goal: responsibility.goal,
        channel: responsibility.title,
        deliverableKind: responsibility.category,
        rawRequest: `${planningMessage} Goal: ${responsibility.goal}`,
      },
    };
  }

  return {
    responsibilityId: responsibility.id,
    evaluatedAt,
    action: "no_action",
    reason: `${responsibility.title} is on track.`,
    health: "healthy" as MarketingResponsibilityHealth,
  };
}

export function buildResponsibilityPlanningItems(
  responsibilities: MarketingResponsibility[],
  evaluations: ResponsibilityEvaluationResult[],
  peerId: string,
  getHref: (responsibilityId: string) => string
): ResponsibilityPlanningItem[] {
  return evaluations
    .filter((e) => e.action === "create_project" || e.action === "recommend_strategy")
    .map((evaluation) => {
      const responsibility = responsibilities.find((r) => r.id === evaluation.responsibilityId)!;
      const canAuto = canAutoCreateProject(responsibility.autonomyLevel);
      return {
        responsibilityId: evaluation.responsibilityId,
        responsibilityTitle: responsibility.title,
        message: evaluation.planningMessage ?? evaluation.reason,
        action: evaluation.action,
        canAutoExecute: canAuto && evaluation.action === "create_project",
        approveLabel:
          evaluation.action === "recommend_strategy"
            ? "Create strategy"
            : canAuto
              ? "Allow automatic planning"
              : "Approve plan",
        href: getHref(evaluation.responsibilityId),
      };
    });
}

export function autonomyLevelLabel(level: MarketingAutonomyLevel): string {
  return MARKETING_AUTONOMY_LEVEL_LABELS[level];
}
