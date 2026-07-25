import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { ContentCalendarEntry, MarketingPlan } from "@/lib/marketing-intelligence/types/plan";
import type { MarketingStrategy } from "@/lib/marketing-intelligence/types/strategy";

import type { CampaignSource } from "./campaign-source";
import {
  CampaignContradictoryStatusError,
  CampaignInvalidBudgetError,
  CampaignInvalidCampaignIdError,
  CampaignInvalidCompletionError,
  CampaignInvalidOrganizationIdError,
  CampaignInvalidProgressError,
  CampaignInvalidTimelineError,
  CampaignOrganizationMismatchError,
  CampaignUnsupportedWorkforceRoleError,
} from "./errors";
import type {
  Campaign,
  CampaignApprovalMode,
  CampaignAudience,
  CampaignBudget,
  CampaignChannelPlan,
  CampaignExecution,
  CampaignGoal,
  CampaignMilestone,
  CampaignPerformance,
  CampaignReferences,
  CampaignStatus,
  CampaignTimeline,
  CampaignWorker,
  CampaignWorkforce,
} from "./types";
import {
  CAMPAIGN_WORKFORCE_ROLE_LABELS,
  CAMPAIGN_WORKFORCE_ROLES,
} from "./types";

const STATUS_FROM_FLAGS: Readonly<
  Partial<Record<keyof NonNullable<CampaignSource["statusFlags"]>, CampaignStatus>>
> = {
  blocked: "blocked",
  cancelled: "cancelled",
  completed: "completed",
  paused: "paused",
  ready: "ready",
  active: "active",
};

/**
 * Status precedence when resolving conflicts between explicit `status` and flags:
 * 1. If explicit `status` disagrees with any set flag's implied status → throw.
 * 2. If multiple flags imply different statuses → throw.
 * 3. Else explicit `status` wins.
 * 4. Else first matching flag in order: blocked, cancelled, completed, paused, ready, active.
 * 5. Else any decision with status `blocked` → blocked.
 * 6. Else strategy or plan present → planning (never `active`).
 * 7. Else draft.
 */
export function deriveCampaignStatus(source: CampaignSource): CampaignStatus {
  const flags = source.statusFlags ?? {};
  const flagged: CampaignStatus[] = [];
  for (const key of Object.keys(STATUS_FROM_FLAGS) as (keyof typeof STATUS_FROM_FLAGS)[]) {
    if (flags[key]) {
      const mapped = STATUS_FROM_FLAGS[key];
      if (mapped) {
        flagged.push(mapped);
      }
    }
  }

  const uniqueFlagged = [...new Set(flagged)];
  if (uniqueFlagged.length > 1) {
    throw new CampaignContradictoryStatusError(
      `Conflicting status flags: ${uniqueFlagged.join(", ")}.`
    );
  }

  if (source.status && uniqueFlagged.length === 1 && source.status !== uniqueFlagged[0]) {
    throw new CampaignContradictoryStatusError(
      `Explicit status "${source.status}" conflicts with status flag "${uniqueFlagged[0]}".`
    );
  }

  if (source.status) {
    return source.status;
  }

  if (uniqueFlagged.length === 1) {
    return uniqueFlagged[0]!;
  }

  if (source.decisions?.some((d) => d.status === "blocked")) {
    return "blocked";
  }

  if (source.strategy || source.plan) {
    return "planning";
  }

  return "draft";
}

function assertOrganizationId(organizationId: string): void {
  if (!organizationId?.trim()) {
    throw new CampaignInvalidOrganizationIdError();
  }
}

function assertCampaignId(campaignId: string): void {
  if (!campaignId?.trim()) {
    throw new CampaignInvalidCampaignIdError();
  }
}

function validateDecisionsOrganization(
  organizationId: string,
  decisions: readonly MarketingDecisionRecord[] | undefined
): void {
  if (!decisions?.length) {
    return;
  }
  for (const decision of decisions) {
    if (decision.organizationId !== organizationId) {
      throw new CampaignOrganizationMismatchError(
        "decision",
        organizationId,
        decision.organizationId
      );
    }
  }
}

function parseDateMs(value: string): number | null {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function validateTimeline(timeline: CampaignSource["timeline"]): void {
  if (!timeline) {
    return;
  }
  const { startDate, endDate } = timeline;
  if (startDate) {
    if (parseDateMs(startDate) === null) {
      throw new CampaignInvalidTimelineError(`Invalid timeline startDate "${startDate}".`);
    }
  }
  if (endDate) {
    if (parseDateMs(endDate) === null) {
      throw new CampaignInvalidTimelineError(`Invalid timeline endDate "${endDate}".`);
    }
  }
  if (startDate && endDate) {
    const start = parseDateMs(startDate)!;
    const end = parseDateMs(endDate)!;
    if (start > end) {
      throw new CampaignInvalidTimelineError("timeline startDate must not be after endDate.");
    }
  }
  for (const milestone of timeline.milestones ?? []) {
    if (milestone.dueDate && parseDateMs(milestone.dueDate) === null) {
      throw new CampaignInvalidTimelineError(
        `Invalid milestone dueDate "${milestone.dueDate}" for "${milestone.label}".`
      );
    }
  }
}

function validateBudget(budget: CampaignSource["budget"]): void {
  if (!budget) {
    return;
  }
  if (budget.allocated !== undefined && (budget.allocated < 0 || !Number.isFinite(budget.allocated))) {
    throw new CampaignInvalidBudgetError("budget.allocated must be a non-negative finite number.");
  }
  if (budget.spent !== undefined && (budget.spent < 0 || !Number.isFinite(budget.spent))) {
    throw new CampaignInvalidBudgetError("budget.spent must be a non-negative finite number.");
  }
}

function validateProgress(progress: CampaignSource["progress"]): void {
  const value = progress?.percentComplete;
  if (value === undefined) {
    return;
  }
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new CampaignInvalidProgressError(
      "progress.percentComplete must be a finite number between 0 and 100."
    );
  }
}

function normalizeChannelId(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function buildGoal(source: CampaignSource): CampaignGoal {
  const strategy = source.strategy;
  const plan = source.plan;
  const primaryDecision = source.decisions?.[0];

  const businessObjective =
    strategy?.positioningRecommendations[0]?.recommendation?.trim() ||
    plan?.basedOnStrategySummary?.trim() ||
    "";

  const marketingObjective =
    strategy?.summary?.trim() ||
    plan?.summary?.trim() ||
    primaryDecision?.objective?.trim() ||
    "";

  const successMetrics = (plan?.successMetrics ?? []).map((metric, index) => ({
    id: `plan-metric-${index + 1}`,
    label: metric.metric,
    target: metric.target,
  }));

  return {
    businessObjective,
    marketingObjective,
    successMetrics,
  };
}

function buildAudience(source: CampaignSource): CampaignAudience {
  const input = source.audience;
  const primarySegment =
    source.strategy?.targetAudiences.find((a) => a.priority === "primary") ??
    source.strategy?.targetAudiences[0];

  return {
    targetAudience:
      input?.targetAudience?.trim() ||
      primarySegment?.segment?.trim() ||
      "",
    personas: input?.personas ?? [],
    segments: input?.segments ?? [],
  };
}

function collectChannels(
  plan: MarketingPlan | undefined,
  activities: readonly ContentCalendarEntry[] | undefined
): CampaignChannelPlan[] {
  const seen = new Set<string>();
  const channels: CampaignChannelPlan[] = [];

  const add = (label: string) => {
    const channelId = normalizeChannelId(label);
    if (seen.has(channelId)) {
      return;
    }
    seen.add(channelId);
    channels.push({ channelId, label: label.trim() });
  };

  for (const activity of activities ?? []) {
    if (activity.channel) {
      add(activity.channel);
    }
  }

  for (const campaign of plan?.campaigns ?? []) {
    for (const channel of campaign.channels) {
      add(channel);
    }
  }

  return channels;
}

function buildTimeline(source: CampaignSource): CampaignTimeline {
  const input = source.timeline;
  if (input) {
    return {
      startDate: input.startDate,
      endDate: input.endDate,
      milestones: input.milestones ?? [],
    };
  }

  const milestones: CampaignMilestone[] = [];
  for (const activity of source.selectedPlanActivities ?? []) {
    milestones.push({
      id: `activity-week-${activity.scheduledWeek}-${normalizeChannelId(activity.title)}`,
      label: activity.title,
      dueDate: undefined,
    });
  }

  const planCampaigns = source.plan?.campaigns ?? [];
  if (planCampaigns.length > 0) {
    const startWeek = Math.min(...planCampaigns.map((c) => c.startWeek));
    const endWeek = Math.max(...planCampaigns.map((c) => c.endWeek));
    milestones.push({
      id: "plan-window",
      label: `Plan weeks ${startWeek}–${endWeek}`,
    });
  }

  return {
    milestones,
  };
}

function buildBudget(source: CampaignSource): CampaignBudget {
  const budget = source.budget;
  if (!budget) {
    return {};
  }
  return {
    currency: budget.currency,
    allocated: budget.allocated,
    spent: budget.spent,
    notes: budget.notes,
  };
}

function resolveApprovalMode(source: CampaignSource): CampaignApprovalMode {
  if (source.approvalMode) {
    return source.approvalMode;
  }
  const fromDecision = source.decisions?.[0]?.approvalPolicy.mode;
  if (fromDecision) {
    return fromDecision;
  }
  return "approval_before_publication";
}

function buildReferences(source: CampaignSource): CampaignReferences {
  return {
    marketingDecisionIds: (source.decisions ?? []).map((d) => d.id),
    creativeBriefIds: [...(source.creativeBriefIds ?? [])],
    generatedContentIds: [...(source.generatedContentIds ?? [])],
    assetIds: [...(source.assetIds ?? [])],
  };
}

function buildPerformance(source: CampaignSource): CampaignPerformance {
  const percentComplete = source.progress?.percentComplete ?? 0;

  return {
    kpiPlaceholders: [...(source.kpiPlaceholders ?? [])],
    progress: {
      percentComplete,
      summary: source.progress?.summary,
      updatedAt: source.updatedAt ?? source.assembledAt,
    },
    recommendations: [...(source.recommendations ?? [])],
  };
}

function assertValidCompletion(role: string, completion: number): number {
  if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
    throw new CampaignInvalidCompletionError(role, completion);
  }
  return completion;
}

function assertSupportedRole(role: string): asserts role is CampaignWorker["role"] {
  if (!(CAMPAIGN_WORKFORCE_ROLES as readonly string[]).includes(role)) {
    throw new CampaignUnsupportedWorkforceRoleError(role);
  }
}

function buildWorkforce(source: CampaignSource): CampaignWorkforce {
  const byRole = new Map<string, CampaignWorker>();

  if (source.seedCanonicalWorkforce) {
    for (const role of CAMPAIGN_WORKFORCE_ROLES) {
      byRole.set(role, {
        role,
        displayName: CAMPAIGN_WORKFORCE_ROLE_LABELS[role],
        status: "idle",
        responsibility: `Awaiting assignment for ${CAMPAIGN_WORKFORCE_ROLE_LABELS[role]}.`,
        completion: 0,
      });
    }
  }

  for (const assignment of source.workforce ?? []) {
    assertSupportedRole(assignment.role);
    const completion = assertValidCompletion(
      assignment.role,
      assignment.completion ?? 0
    );
    byRole.set(assignment.role, {
      role: assignment.role,
      displayName: assignment.displayName ?? CAMPAIGN_WORKFORCE_ROLE_LABELS[assignment.role],
      status: assignment.status ?? "assigned",
      responsibility: assignment.responsibility,
      completion,
      ...(assignment.peerId ? { peerId: assignment.peerId } : {}),
    });
  }

  return {
    workers: CAMPAIGN_WORKFORCE_ROLES.filter((role) => byRole.has(role)).map(
      (role) => byRole.get(role)!
    ),
  };
}

/** Pure deterministic Campaign assembler — no AI, network, or storage. */
export function assembleCampaign(source: CampaignSource): Campaign {
  assertOrganizationId(source.organizationId);
  assertCampaignId(source.campaignId);
  validateDecisionsOrganization(source.organizationId, source.decisions);
  validateTimeline(source.timeline);
  validateBudget(source.budget);
  validateProgress(source.progress);

  const status = deriveCampaignStatus(source);
  const assembledAt = source.assembledAt;
  const createdAt = source.createdAt ?? assembledAt;
  const updatedAt = source.updatedAt ?? assembledAt;

  const execution: CampaignExecution = {
    channels: collectChannels(source.plan, source.selectedPlanActivities),
    timeline: buildTimeline(source),
    status,
    budget: buildBudget(source),
    approvalMode: resolveApprovalMode(source),
  };

  const campaign: Campaign = {
    id: source.campaignId,
    organizationId: source.organizationId,
    name: source.name,
    description: source.description,
    version: source.version ?? 1,
    createdAt,
    updatedAt,
    goal: buildGoal(source),
    audience: buildAudience(source),
    execution,
    references: buildReferences(source),
    performance: buildPerformance(source),
    workforce: buildWorkforce(source),
  };

  return campaign;
}

/** @internal Exported for tests documenting status precedence. */
export function campaignStatusFromFlagsOnly(
  flags: NonNullable<CampaignSource["statusFlags"]>
): CampaignStatus | undefined {
  const order: (keyof typeof STATUS_FROM_FLAGS)[] = [
    "blocked",
    "cancelled",
    "completed",
    "paused",
    "ready",
    "active",
  ];
  for (const key of order) {
    if (flags[key]) {
      return STATUS_FROM_FLAGS[key];
    }
  }
  return undefined;
}
