import type { CampaignExecutionPlan } from "@/lib/campaign/planner";
import type {
  CampaignWorkPackage,
  CampaignWorkPackagePhase,
  CampaignWorkPackageType,
} from "@/lib/campaign/planner/types";
import type { CampaignExecutionPlanApproval } from "@/lib/campaign/planner/types/campaign-execution-plan";
import { CAMPAIGN_WORKFORCE_ROLE_LABELS } from "@/lib/campaign/types/campaign";
import type { CampaignPlannerScopeNote } from "@/lib/campaign/planner/types";

import {
  buildAllowedChannelLabelsFromSetup,
  displayPhaseLabelForPackage,
  isActionableOptionalImprovement,
  isProductionDeliverablePackage,
  presentCustomerCompactMeta,
  presentCustomerOwnerLine,
  presentCustomerWorkItemTitle,
  shouldIncludePackageInCustomerPlan,
  type CampaignPlanPresentationContext,
} from "./campaign-execution-plan-customer-presenter";

import type {
  CampaignExecutionPlanApprovalMomentViewModel,
  CampaignExecutionPlanOverallStatus,
  CampaignExecutionPlanPhaseGroupViewModel,
  CampaignExecutionPlanPhaseViewModel,
  CampaignExecutionPlanViewModel,
  CampaignExecutionPlanWorkItemViewModel,
} from "@/lib/peer-experience/marketing/campaign-planning/campaign-execution-plan-view-model";

const PACKAGE_TYPE_LABELS: Record<CampaignWorkPackageType, string> = {
  research: "Research",
  audience_definition: "Audience",
  positioning: "Positioning",
  campaign_strategy: "Strategy",
  campaign_plan: "Campaign plan",
  creative_direction: "Creative direction",
  content_creation: "Content creation",
  design: "Design",
  review: "Review",
  publication: "Publication",
  performance_monitoring: "Performance",
  learning: "Learning",
};

const PHASE_LABELS: Record<CampaignWorkPackagePhase, string> = {
  research: "Research",
  strategy: "Strategy",
  planning: "Planning",
  creative: "Creative",
  production: "Production",
  review: "Review",
  publish: "Publication",
  measure: "Performance",
  learn: "Learning",
};

const STATUS_LABELS: Record<CampaignWorkPackage["status"], string> = {
  proposed: "Planned",
  in_progress: "In progress",
  satisfied: "Complete",
  blocked: "Blocked",
  skipped: "Skipped",
};

const PLAN_STATUS_LABELS: Record<CampaignExecutionPlanOverallStatus, string> = {
  draft: "Plan in preparation",
  ready: "Plan ready",
  restricted: "Plan needs approval",
  blocked: "Plan blocked",
};

const EFFORT_LABELS = {
  low: "Light effort",
  medium: "Moderate effort",
  high: "High effort",
} as const;

const SETUP_GAP_IDS = new Set([
  "gap-channels-deliverables",
  "gap-no-explicit-deliverables",
]);

const IMPROVE_LATER_GAP_IDS = new Set([
  "gap-strategy",
  "gap-plan",
  "gap-plan-activities-unlinked",
  "gap-plan-no-matching-activities",
  "gap-creative-brief",
]);

const IMPROVE_LATER_MESSAGES: Record<string, string> = {
  "gap-strategy":
    "A fuller marketing strategy can sharpen messaging when you add it to your workspace.",
  "gap-plan":
    "A linked marketing plan calendar can refine timing when you connect it later.",
  "gap-plan-activities-unlinked":
    "Linking workspace plan activities can refine deliverable timing later.",
  "gap-plan-no-matching-activities":
    "Matching plan activities to this campaign can improve scheduling later.",
  "gap-creative-brief":
    "Creative direction will be developed as part of planned campaign work.",
};

const SCOPE_NOTE_CUSTOMER_MESSAGES: Record<string, string> = {
  "uncertainty-peer-strategy":
    "Strategy shown applies to your marketing workspace and may support multiple initiatives.",
  "uncertainty-peer-plan":
    "Plan activities apply only when linked to work on this campaign.",
};

const FORBIDDEN_CUSTOMER_TERMS = [
  "campaign_wizard",
  "workpackage",
  "work unit",
  "work_unit",
  "scopenotes",
  "campaignexecutionplan",
  "pkg:",
  "gap-",
  "uncertainty-peer",
  "marketingdecision",
  "creativebrief",
  "assembler",
  "evidence-",
];

export function presentWorkPackageTypeLabel(type: CampaignWorkPackageType): string {
  return PACKAGE_TYPE_LABELS[type];
}

export function presentWorkPackagePhaseLabel(phase: CampaignWorkPackagePhase): string {
  return PHASE_LABELS[phase];
}

export function presentPlanOverallStatusLabel(
  status: CampaignExecutionPlanOverallStatus
): string {
  return PLAN_STATUS_LABELS[status];
}

export function translatePlannerGapToCustomerMessage(gapId: string, fallback: string): string {
  if (SETUP_GAP_IDS.has(gapId)) {
    return "Choose channels and deliverables before content work can be planned.";
  }
  return IMPROVE_LATER_MESSAGES[gapId] ?? fallback.replace(/\s+/g, " ").trim();
}

function classifyPlannerGap(
  gapId: string,
  planStatus: CampaignExecutionPlanOverallStatus
): "missing" | "improve" | "ignore" {
  if (SETUP_GAP_IDS.has(gapId)) {
    return planStatus === "ready" ? "ignore" : "missing";
  }
  if (IMPROVE_LATER_GAP_IDS.has(gapId)) {
    return "improve";
  }
  if (planStatus === "ready") return "ignore";
  return "missing";
}

function groupWorkItemsByPhase(
  items: readonly CampaignExecutionPlanWorkItemViewModel[]
): CampaignExecutionPlanPhaseGroupViewModel[] {
  const order: string[] = [];
  const map = new Map<string, CampaignExecutionPlanWorkItemViewModel[]>();
  for (const item of items) {
    if (!map.has(item.phaseLabel)) {
      order.push(item.phaseLabel);
      map.set(item.phaseLabel, []);
    }
    map.get(item.phaseLabel)!.push(item);
  }
  return order.map((phaseLabel) => ({
    phaseLabel,
    items: Object.freeze(map.get(phaseLabel)!),
  }));
}

export function dedupeCampaignApprovalMoments(
  approvals: readonly CampaignExecutionPlanApproval[],
  titleById: Map<string, string>
): CampaignExecutionPlanApprovalMomentViewModel[] {
  const moments: CampaignExecutionPlanApprovalMomentViewModel[] = [];
  let hasPublicationSummary = false;

  for (const a of approvals) {
    if (a.gate === "before_publication") {
      if (hasPublicationSummary) continue;
      hasPublicationSummary = true;
      moments.push({
        label: "Before publication",
        description:
          "Your approval is required before anything from this campaign is published.",
      });
      continue;
    }
    const stepTitle = titleById.get(a.packageId) ?? "A planned step";
    if (a.gate === "before_generation") {
      moments.push({
        label: "Before content is created",
        description: `${stepTitle} — ${a.description}`,
      });
      continue;
    }
    moments.push({
      label: "Manual approval",
      description: `${stepTitle} — ${a.description}`,
    });
  }

  const deduped = new Map<string, CampaignExecutionPlanApprovalMomentViewModel>();
  for (const moment of moments) {
    const key = `${moment.label}|${moment.description}`;
    if (!deduped.has(key)) {
      deduped.set(key, moment);
    }
  }
  return [...deduped.values()];
}

export function translateScopeNoteToCustomerWarning(note: CampaignPlannerScopeNote): string | null {
  if (note.id.startsWith("setup-pairing-")) {
    return null;
  }
  const mapped = SCOPE_NOTE_CUSTOMER_MESSAGES[note.id];
  if (mapped) return mapped;
  if (note.kind === "gap") {
    return note.message.replace(/peer-level/gi, "workspace").replace(/Work Units?/gi, "work");
  }
  if (note.kind === "uncertainty" && note.id.startsWith("setup-pairing-")) {
    return null;
  }
  if (note.kind === "evidence") return null;
  return null;
}

function presentOwnerLabel(pkg: CampaignWorkPackage): string {
  if (pkg.recommendedOwner.role === "customer") return "You";
  const label = CAMPAIGN_WORKFORCE_ROLE_LABELS[pkg.recommendedOwner.role];
  return label ?? "Marketing";
}

function presentApprovalLabel(pkg: CampaignWorkPackage): string | undefined {
  if (!pkg.approvalRequirement.required) return undefined;
  const mode = pkg.approvalRequirement.mode;
  if (mode === "approval_before_generation") return "Your approval before creation";
  if (mode === "approval_before_publication") return "Your approval before publication";
  if (mode === "blocked_manual_only") return "Manual review required";
  return "Approval required";
}

function presentDeliverableLabel(type: string | undefined): string | undefined {
  if (!type?.trim()) return undefined;
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dependencySummary(
  pkg: CampaignWorkPackage,
  titleById: Map<string, string>
): string | undefined {
  if (!pkg.dependencies.length) return undefined;
  const titles = pkg.dependencies
    .map((id) => titleById.get(id))
    .filter((t): t is string => Boolean(t));
  if (!titles.length) return undefined;
  return `After: ${titles.join(", ")}`;
}

function computePlanProgress(packages: readonly CampaignWorkPackage[]): {
  complete: number;
  total: number;
  summary: string;
} {
  const active = packages.filter((p) => p.status !== "skipped");
  const total = active.length;
  const complete = active.filter((p) => p.status === "satisfied").length;
  const inProgress = active.filter((p) => p.status === "in_progress").length;
  if (total === 0) {
    return { complete: 0, total: 0, summary: "Plan prepared — execution has not started." };
  }
  const summary =
    complete === total
      ? `${complete} of ${total} planned steps complete — this reflects the plan, not full campaign delivery.`
      : `${complete} of ${total} planned steps complete${inProgress > 0 ? ` · ${inProgress} in progress` : ""}. Campaign delivery may still be ahead.`;
  return { complete, total, summary };
}

function buildPhases(
  items: readonly CampaignExecutionPlanWorkItemViewModel[]
): CampaignExecutionPlanPhaseViewModel[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.phaseLabel, (counts.get(item.phaseLabel) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, stepCount]) => ({ label, stepCount }));
}

function findNextStep(
  plan: CampaignExecutionPlan,
  titleById: Map<string, string>
): CampaignExecutionPlanViewModel["nextPlannedStep"] {
  for (const id of plan.executionOrder) {
    const pkg = plan.workPackages.find((p) => p.id === id);
    if (!pkg || pkg.status === "satisfied" || pkg.status === "skipped") continue;
    if (pkg.status === "blocked") {
      return {
        title: pkg.title,
        description: pkg.blockers[0] ?? "This step is blocked until the issue is resolved.",
      };
    }
    return {
      title: titleById.get(id) ?? pkg.title,
      description: pkg.description,
    };
  }
  return null;
}

export function presentCampaignExecutionPlan(input: {
  plan: CampaignExecutionPlan;
  scopeNotes?: readonly CampaignPlannerScopeNote[];
  presentation?: CampaignPlanPresentationContext;
}): CampaignExecutionPlanViewModel {
  const { plan, scopeNotes = [], presentation = {} } = input;
  const titleById = new Map(plan.workPackages.map((p) => [p.id, p.title]));

  const ordered = plan.executionOrder
    .map((id) => plan.workPackages.find((p) => p.id === id))
    .filter((p): p is CampaignWorkPackage => Boolean(p));

  const visiblePackages = ordered.filter((pkg) =>
    shouldIncludePackageInCustomerPlan(pkg, presentation)
  );

  const planningTitles = new Set(
    visiblePackages
      .filter((p) => !isProductionDeliverablePackage(p))
      .map((p) => presentCustomerWorkItemTitle(p).toLowerCase())
  );

  const workItems: CampaignExecutionPlanWorkItemViewModel[] = [];

  for (const pkg of visiblePackages) {
    if (isProductionDeliverablePackage(pkg)) {
      const title = presentCustomerWorkItemTitle(pkg);
      if (planningTitles.has(title.toLowerCase())) {
        continue;
      }
    }

    const channelLabel = pkg.channel?.trim() ? pkg.channel.trim() : undefined;
    const deliverableLabel = presentDeliverableLabel(pkg.deliverableType);
    const ownerLine = presentCustomerOwnerLine(pkg);
    const isProduction = isProductionDeliverablePackage(pkg);

    workItems.push({
      title: presentCustomerWorkItemTitle(pkg),
      description: isProduction ? "" : pkg.description,
      phaseLabel: displayPhaseLabelForPackage(pkg),
      statusLabel: STATUS_LABELS[pkg.status],
      ownerLabel: ownerLine,
      effortLabel: EFFORT_LABELS[pkg.estimatedEffort],
      compactMeta: presentCustomerCompactMeta(pkg, ownerLine),
      ...(presentApprovalLabel(pkg) ? { approvalLabel: presentApprovalLabel(pkg) } : {}),
      ...(dependencySummary(pkg, titleById)
        ? { dependencySummary: dependencySummary(pkg, titleById) }
        : {}),
      ...(pkg.blockers.length ? { blockerSummary: pkg.blockers.join(" ") } : {}),
      ...(channelLabel ? { channelLabel } : {}),
      ...(deliverableLabel ? { deliverableLabel } : {}),
    });
  }

  const progress = computePlanProgress(visiblePackages);

  const missingInformation: string[] = [];
  const optionalImprovements: string[] = [];

  for (const g of plan.gaps) {
    const bucket = classifyPlannerGap(g.id, plan.status);
    const message = IMPROVE_LATER_MESSAGES[g.id] ?? translatePlannerGapToCustomerMessage(g.id, g.message);
    if (bucket === "missing") missingInformation.push(message);
    if (bucket === "improve") optionalImprovements.push(message);
  }

  for (const note of scopeNotes) {
    const warning = translateScopeNoteToCustomerWarning(note);
    if (!warning) continue;
    if (note.id.startsWith("setup-pairing-")) {
      continue;
    }
    if (note.kind === "uncertainty") {
      optionalImprovements.push(warning);
    }
  }

  const uniqueMissing = [...new Set(missingInformation)];
  const uniqueImprove = [...new Set(optionalImprovements)].filter(isActionableOptionalImprovement);

  const blockers = [
    ...plan.workPackages.flatMap((p) => p.blockers),
    ...(plan.status === "blocked"
      ? ["Some planned steps cannot proceed until policy or setup issues are resolved."]
      : []),
  ];
  const uniqueBlockers = [...new Set(blockers)];

  const approvalMoments = dedupeCampaignApprovalMoments(plan.approvals, titleById);

  const warnings: string[] = [];
  if (plan.status === "draft") {
    warnings.push("The plan is still being prepared — some steps may change.");
  }
  if (plan.status === "restricted") {
    warnings.push("Additional approvals apply before some work can proceed.");
  }

  const phaseGroups = groupWorkItemsByPhase(workItems);

  return {
    availability: "visible",
    overallStatus: plan.status,
    statusLabel: presentPlanOverallStatusLabel(plan.status),
    objective: plan.objective,
    progressSummary: progress.summary,
    planStepsComplete: progress.complete,
    planStepsTotal: progress.total,
    phases: buildPhases(workItems),
    workItems,
    phaseGroups,
    approvalMoments,
    blockers: uniqueBlockers,
    missingInformation: uniqueMissing,
    optionalImprovements: uniqueImprove,
    warnings,
    nextPlannedStep: findNextStep(plan, titleById),
    ...(plan.status === "restricted"
      ? {
          restrictionMessage:
            "Some steps require your approval before Emma can create or publish content.",
        }
      : {}),
  };
}

export function presentCampaignExecutionPlanUnavailable(): CampaignExecutionPlanViewModel {
  return {
    availability: "unavailable",
    unavailableMessage: "Campaign plan is temporarily unavailable.",
    overallStatus: "draft",
    statusLabel: "Unavailable",
    objective: "",
    progressSummary: "",
    planStepsComplete: 0,
    planStepsTotal: 0,
    phases: [],
    workItems: [],
    phaseGroups: [],
    approvalMoments: [],
    blockers: [],
    missingInformation: [],
    optionalImprovements: [],
    warnings: [],
    nextPlannedStep: null,
  };
}

/** Test helper — rejects internal vocabulary in customer-facing VM JSON. */
export function assertCustomerSafeExecutionPlanViewModel(
  vm: CampaignExecutionPlanViewModel
): void {
  const blob = JSON.stringify(vm).toLowerCase();
  for (const term of FORBIDDEN_CUSTOMER_TERMS) {
    if (blob.includes(term)) {
      throw new Error(`Internal term leaked to execution plan VM: ${term}`);
    }
  }
}
