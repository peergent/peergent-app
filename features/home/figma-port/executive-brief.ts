import type { HandoffState } from "@/lib/home/handoff-types";
import type { HomeCopy } from "@/lib/i18n";
import type { HomeMovementItem, HomeViewModel } from "@/lib/home";

/** Known activity tokens from movement IDs — includes current + future Peer domains */
const ACTIVITY_TOKENS: readonly string[] = [
  "publication_prepared",
  "publication_ready",
  "understanding_loaded",
  "strategy_completed",
  "waiting_approval",
  "draft_generated",
  "draft_approved",
  "draft_rejected",
  "plan_completed",
  "gap_detected",
  "focus_updated",
  "conversation",
  "published",
  // Sales (future)
  "lead_qualified",
  "lead_generated",
  "lead_captured",
  "meeting_booked",
  "meeting_scheduled",
  // Support (future)
  "support_resolved",
  "ticket_resolved",
  "issue_resolved",
  // Finance (future)
  "invoice_prepared",
  "invoice_sent",
  "invoice_generated",
  // Planner (future)
  "plan_scheduled",
  "schedule_updated",
  "roadmap_completed",
  // HR (future)
  "onboarding_completed",
  "hr_task_completed",
  "policy_updated",
  // Operations (future)
  "operation_completed",
  "process_automated",
  // Generic cross-domain completions
  "task_completed",
  "workflow_completed",
];

export type WorkforceMetricKey =
  | "conversations"
  | "qualified_leads"
  | "meetings"
  | "support_tickets"
  | "marketing_tasks"
  | "invoices"
  | "planner_tasks"
  | "hr_tasks"
  | "operations_tasks"
  | "completed_work";

type WorkforceMetricConfig = {
  key: WorkforceMetricKey;
  label: (count: number) => string;
  /** Matched from movement item IDs — extend when new Peer types add activity feed entries */
  activityTokens: readonly string[];
};

/**
 * Registry order defines bullet order in the Morning Brief.
 * New Peer domains only need new tokens here — no UI changes required.
 */
export const WORKFORCE_METRIC_REGISTRY: readonly WorkforceMetricConfig[] = [
  {
    key: "conversations",
    label: (n) => (n === 1 ? "handled 1 conversation" : `handled ${n} conversations`),
    activityTokens: ["conversation"],
  },
  {
    key: "qualified_leads",
    label: (n) => (n === 1 ? "generated 1 qualified lead" : `generated ${n} qualified leads`),
    activityTokens: ["lead_qualified", "lead_generated", "lead_captured"],
  },
  {
    key: "meetings",
    label: (n) => (n === 1 ? "booked 1 meeting" : `booked ${n} meetings`),
    activityTokens: ["meeting_booked", "meeting_scheduled"],
  },
  {
    key: "support_tickets",
    label: (n) =>
      n === 1 ? "resolved 1 support ticket" : `resolved ${n} support tickets`,
    activityTokens: ["support_resolved", "ticket_resolved", "issue_resolved"],
  },
  {
    key: "marketing_tasks",
    label: (n) =>
      n === 1 ? "completed 1 marketing task" : `completed ${n} marketing tasks`,
    activityTokens: [
      "draft_generated",
      "draft_approved",
      "publication_prepared",
      "publication_ready",
      "published",
      "strategy_completed",
      "plan_completed",
    ],
  },
  {
    key: "invoices",
    label: (n) => (n === 1 ? "prepared 1 invoice" : `prepared ${n} invoices`),
    activityTokens: ["invoice_prepared", "invoice_sent", "invoice_generated"],
  },
  {
    key: "planner_tasks",
    label: (n) =>
      n === 1 ? "completed 1 planning task" : `completed ${n} planning tasks`,
    activityTokens: ["plan_scheduled", "schedule_updated", "roadmap_completed"],
  },
  {
    key: "hr_tasks",
    label: (n) => (n === 1 ? "completed 1 HR task" : `completed ${n} HR tasks`),
    activityTokens: ["onboarding_completed", "hr_task_completed", "policy_updated"],
  },
  {
    key: "operations_tasks",
    label: (n) =>
      n === 1 ? "completed 1 operations task" : `completed ${n} operations tasks`,
    activityTokens: ["operation_completed", "process_automated"],
  },
  {
    key: "completed_work",
    label: (n) => (n === 1 ? "completed 1 task" : `completed ${n} tasks`),
    activityTokens: ["task_completed", "workflow_completed"],
  },
];

export type WorkforceAccomplishment = {
  key: WorkforceMetricKey;
  count: number;
  label: string;
};

export type ExecutiveBriefImpact = {
  hoursSaved: number;
  businessValueEur: number;
};

export type ExecutiveMorningBrief = {
  kicker: string;
  greeting: string;
  workforceIntro?: string;
  accomplishments: WorkforceAccomplishment[];
  /** Shown when no away/recent movement metrics exist */
  fallbackProse?: string;
  impact?: ExecutiveBriefImpact;
  /** Empty-state lines from handoff when view model is unavailable */
  legacyLines?: string[];
};

export type ExecutiveDecisionCardProps = {
  title: string;
  body: string;
  href: string;
  ctaLabel: string;
};

const JUDGMENT_CTA = "View all tasks →";

function parseActivityToken(movementId: string): string | null {
  for (const token of [...ACTIVITY_TOKENS].sort((a, b) => b.length - a.length)) {
    const marker = `-${token}`;
    if (movementId.includes(marker)) return token;
  }
  return null;
}

export function aggregateWorkforceMetrics(
  movements: HomeMovementItem[]
): WorkforceAccomplishment[] {
  const counts = new Map<WorkforceMetricKey, number>();

  for (const config of WORKFORCE_METRIC_REGISTRY) {
    counts.set(config.key, 0);
  }

  let unmatched = 0;

  for (const item of movements) {
    const token = parseActivityToken(item.id);
    if (!token) {
      unmatched += 1;
      continue;
    }

    let matched = false;
    for (const config of WORKFORCE_METRIC_REGISTRY) {
      if (config.activityTokens.includes(token)) {
        counts.set(config.key, (counts.get(config.key) ?? 0) + 1);
        matched = true;
        break;
      }
    }

    if (!matched) unmatched += 1;
  }

  const accomplishments: WorkforceAccomplishment[] = [];

  for (const config of WORKFORCE_METRIC_REGISTRY) {
    const count = counts.get(config.key) ?? 0;
    if (count > 0) {
      accomplishments.push({
        key: config.key,
        count,
        label: config.label(count),
      });
    }
  }

  if (accomplishments.length === 0 && unmatched > 0) {
    accomplishments.push({
      key: "completed_work",
      count: unmatched,
      label:
        unmatched === 1
          ? "moved 1 piece of work forward"
          : `moved ${unmatched} pieces of work forward`,
    });
  }

  return accomplishments;
}

function formatGreeting(greeting: string): string {
  const trimmed = greeting.trim();
  if (!trimmed) return trimmed;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(trimmed)) return trimmed;
  const base = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  return `${base} 👋`;
}

function buildImpact(_viewModel: HomeViewModel): ExecutiveBriefImpact | undefined {
  /**
   * Requires production aggregates on HomeViewModel (not yet shipped):
   * - hoursSaved: sum of peer-reported durationMinutes on completed activities since lastVisitAt
   * - businessValueEur: sum of attributed revenue/value fields on leads, deals, invoices, etc.
   * Omit until both values exist — never derive from heuristics or per-activity guesses.
   */
  return undefined;
}

function fallbackProse(viewModel: HomeViewModel, copy: HomeCopy): string | null {
  const working = viewModel.teamPulse.filter((p) => p.statusKind === "working");
  if (working.length === 0) {
    return viewModel.allCaughtUp ? copy.allCaughtUpBody : null;
  }
  const names = working.slice(0, 2).map((p) => p.name);
  if (names.length === 1) {
    return `${names[0]} is already working through today's priorities.`;
  }
  return `${names.join(" and ")} are already working through today's priorities.`;
}

export function buildExecutiveMorningBrief(input: {
  viewModel: HomeViewModel | null;
  handoff: HandoffState;
  copy: HomeCopy;
}): ExecutiveMorningBrief {
  const { viewModel, handoff, copy } = input;

  let kicker = copy.ui.morningBriefing;
  try {
    kicker = `${new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date())} · ${copy.ui.morningBriefing}`;
  } catch {
    /* keep fallback */
  }

  const greeting = formatGreeting(viewModel?.narrative.greeting ?? handoff.personalGreeting);

  if (!viewModel || viewModel.isEmpty) {
    return {
      kicker,
      greeting,
      accomplishments: [],
      legacyLines: handoff.briefingLines.filter(Boolean),
    };
  }

  const movementSource =
    viewModel.awayMovement.length > 0 ? viewModel.awayMovement : viewModel.recentMovement;

  const accomplishments = aggregateWorkforceMetrics(movementSource);
  const hasAccomplishments = accomplishments.length > 0;

  let resolvedFallback: string | undefined;
  if (!hasAccomplishments) {
    resolvedFallback = fallbackProse(viewModel, copy) ?? undefined;
  }

  const impact = buildImpact(viewModel);

  return {
    kicker,
    greeting,
    workforceIntro: hasAccomplishments ? "While you were away, your AI workforce:" : undefined,
    accomplishments,
    fallbackProse: resolvedFallback,
    impact,
  };
}

export function buildExecutiveDecisionCard(
  viewModel: HomeViewModel | null,
  handoff: HandoffState,
  _copy: HomeCopy
): ExecutiveDecisionCardProps | null {
  const needsYou = viewModel?.needsYou ?? [];

  if (needsYou.length > 1) {
    const lead = needsYou[0]!;
    const others = needsYou.length - 1;
    const othersLabel =
      others === 1
        ? "1 other colleague is waiting for your decision"
        : `${others} other colleagues are waiting for your decision`;

    return {
      title: "Needs your judgment",
      body: `${lead.peerName} and ${othersLabel}.\n\nEverything else is already moving forward.`,
      href: "/inbox",
      ctaLabel: JUDGMENT_CTA,
    };
  }

  if (needsYou.length === 1) {
    const item = needsYou[0]!;
    const context =
      item.subtitle && item.subtitle !== item.peerName ? item.subtitle : item.title;
    const contextPhrase =
      context && context !== item.peerName
        ? ` on ${context.charAt(0).toLowerCase()}${context.slice(1)}`
        : "";

    return {
      title: "Needs your judgment",
      body: `${item.peerName} is waiting for your decision${contextPhrase}.\n\nEverything else is already moving forward.`,
      href: item.href,
      ctaLabel: JUDGMENT_CTA,
    };
  }

  const primaryWork = handoff.primaryWork;
  if (primaryWork) {
    return {
      title: "Needs your judgment",
      body: `${primaryWork.peerName} is waiting for your decision.\n\nEverything else is already moving forward.`,
      href: primaryWork.destination,
      ctaLabel: JUDGMENT_CTA,
    };
  }

  if (viewModel?.suggestedStart) {
    return {
      title: "Needs your judgment",
      body: `${viewModel.suggestedStart.headline}\n\nEverything else is already moving forward.`,
      href: viewModel.suggestedStart.href,
      ctaLabel: JUDGMENT_CTA,
    };
  }

  return null;
}

/** Aggregate accomplishment categories with production data today */
export const EXECUTIVE_BRIEF_AVAILABLE_METRICS = [
  "conversations (Marketing peer activity feed)",
  "marketing tasks (Marketing peer activity feed)",
  "decisions waiting (needsYou — shown in Executive Decision card only)",
  "active peers (teamPulse / companyActivity)",
] as const;

/** Metrics intentionally omitted — not present in production view models */
export const EXECUTIVE_BRIEF_OMITTED_METRICS = [
  "qualified leads (until Sales peer activity feed ships)",
  "meetings booked (until Sales peer activity feed ships)",
  "support tickets resolved (until Support peer activity feed ships)",
  "invoices prepared (until Finance peer activity feed ships)",
  "planning tasks (until Planner peer activity feed ships)",
  "HR tasks (until HR peer activity feed ships)",
  "operations tasks (until Operations peer activity feed ships)",
  "working hours saved",
  "estimated business value (€)",
] as const;

/**
 * Future impact calculation (requires backend aggregates — do not heuristic-guess):
 * - hoursSaved: Σ durationMinutes on completed activities since lastVisitAt across all peers
 * - businessValueEur: Σ attributed value on leads, closed deals, invoices, and resolved tickets
 */
export const EXECUTIVE_BRIEF_IMPACT_REQUIREMENTS = {
  hoursSaved:
    "Sum peer-reported durationMinutes on completed activity feed entries since lastVisitAt",
  businessValueEur:
    "Sum attributed revenue/value on Sales leads, Finance invoices, and Support resolutions",
} as const;
