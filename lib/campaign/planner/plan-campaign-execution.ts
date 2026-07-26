import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";

import type {
  CampaignExecutionPlan,
  CampaignExecutionPlanApproval,
  CampaignExecutionPlanEvidence,
  CampaignExecutionPlanGap,
  CampaignExecutionPlanStatus,
  CampaignWorkPackage,
  CampaignWorkPackageApprovalRequirement,
  CampaignWorkPackageEffort,
  CampaignWorkPackageOwner,
  CampaignWorkPackagePhase,
  CampaignWorkPackageSourceReference,
  CampaignWorkPackageStatus,
  CampaignWorkPackageType,
} from "./types/campaign-execution-plan";
import type {
  CampaignPlannerExplicitDeliverable,
  CampaignPlannerSource,
  CampaignPlannerWorkUnitSummary,
} from "./types/campaign-planner-source";
import {
  campaignContentTargetKey,
  channelHasConcreteContentTarget,
  normalizeCampaignContentKeyPart,
} from "./content-target-identity";

export class CampaignPlannerError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CampaignPlannerError";
    this.code = code;
  }
}

export class CampaignPlannerInvalidSourceError extends CampaignPlannerError {
  constructor(message: string) {
    super("CAMPAIGN_PLANNER_INVALID_SOURCE", message);
    this.name = "CampaignPlannerInvalidSourceError";
  }
}

export class CampaignPlannerDependencyError extends CampaignPlannerError {
  constructor(message: string) {
    super("CAMPAIGN_PLANNER_DEPENDENCY_ERROR", message);
    this.name = "CampaignPlannerDependencyError";
  }
}

const SATISFIED_STAGES = new Set([
  "published",
  "monitoring",
  "optimizing",
]);

const IN_PROGRESS_STAGES = new Set([
  "requested",
  "understanding",
  "planning",
  "creating",
  "review_ready",
  "approved",
  "scheduled",
]);

type MutablePackage = Omit<
  CampaignWorkPackage,
  | "dependencies"
  | "blockers"
  | "sourceReferences"
  | "matchedWorkUnitId"
  | "status"
  | "approvalRequirement"
> & {
  dependencies: string[];
  blockers: string[];
  sourceReferences: CampaignWorkPackageSourceReference[];
  matchedWorkUnitId?: string;
  status: CampaignWorkPackageStatus;
  approvalRequirement: CampaignWorkPackageApprovalRequirement;
};

function normalizeKeyPart(value: string): string {
  return normalizeCampaignContentKeyPart(value);
}

function packageId(campaignId: string, type: CampaignWorkPackageType, suffix = ""): string {
  const base = `${campaignId}:pkg:${type}`;
  return suffix ? `${base}:${suffix}` : base;
}

function assertValidSource(source: CampaignPlannerSource): void {
  if (!source.organizationId?.trim()) {
    throw new CampaignPlannerInvalidSourceError("organizationId is required.");
  }
  if (!source.peerId?.trim()) {
    throw new CampaignPlannerInvalidSourceError("peerId is required.");
  }
  if (!source.campaign?.id?.trim()) {
    throw new CampaignPlannerInvalidSourceError("campaign.id is required.");
  }
  if (!source.campaign.organizationId?.trim()) {
    throw new CampaignPlannerInvalidSourceError("campaign.organizationId is required.");
  }
  if (source.campaign.organizationId !== source.organizationId) {
    throw new CampaignPlannerInvalidSourceError(
      "campaign.organizationId must match source organizationId."
    );
  }
  if (!source.assembledAt?.trim()) {
    throw new CampaignPlannerInvalidSourceError("assembledAt is required.");
  }
}

function campaignApprovalToMode(
  mode: CampaignApprovalMode
): CampaignWorkPackageApprovalRequirement["mode"] {
  return mode;
}

function defaultApprovalRequirement(
  source: CampaignPlannerSource,
  requiresGate: boolean
): CampaignWorkPackageApprovalRequirement {
  const campaignMode = campaignApprovalToMode(source.campaign.execution.approvalMode);
  const decision = source.decisionSummary;
  const mode = decision?.approvalMode ?? campaignMode ?? "approval_before_publication";
  const required =
    requiresGate &&
    mode !== "no_approval_required" &&
    decision?.status !== "blocked";
  return {
    required,
    mode,
    brandReviewRequired: decision?.brandReviewRequired ?? false,
    legalReviewRequired: decision?.legalReviewRequired ?? false,
  };
}

function ownerForType(
  type: CampaignWorkPackageType,
  source: CampaignPlannerSource
): CampaignWorkPackageOwner {
  const map: Record<CampaignWorkPackageType, CampaignWorkPackageOwner["role"]> = {
    research: "analyst",
    audience_definition: "analyst",
    positioning: "campaign_planner",
    campaign_strategy: "campaign_planner",
    campaign_plan: "campaign_planner",
    creative_direction: "campaign_planner",
    content_creation: "copywriter",
    design: "designer",
    review: "customer",
    publication: "email_specialist",
    performance_monitoring: "analyst",
    learning: "analyst",
  };
  const role = map[type];
  const enabledResp = source.responsibilities?.find((r) => r.enabled);
  return {
    role,
    ...(enabledResp ? { responsibilityId: enabledResp.id, label: enabledResp.category } : {}),
  };
}

function effortForType(
  type: CampaignWorkPackageType,
  override?: CampaignWorkPackageEffort
): CampaignWorkPackageEffort {
  if (override) return override;
  switch (type) {
    case "research":
    case "audience_definition":
      return "medium";
    case "content_creation":
    case "design":
      return "high";
    case "review":
    case "publication":
      return "low";
    default:
      return "medium";
  }
}

function phaseForType(type: CampaignWorkPackageType): CampaignWorkPackagePhase {
  switch (type) {
    case "research":
    case "audience_definition":
      return "research";
    case "positioning":
    case "campaign_strategy":
      return "strategy";
    case "campaign_plan":
      return "planning";
    case "creative_direction":
      return "creative";
    case "content_creation":
    case "design":
      return "production";
    case "review":
      return "review";
    case "publication":
      return "publish";
    case "performance_monitoring":
      return "measure";
    case "learning":
      return "learn";
    default:
      return "planning";
  }
}

function priorityForType(type: CampaignWorkPackageType, index = 0): number {
  const order: CampaignWorkPackageType[] = [
    "research",
    "audience_definition",
    "positioning",
    "campaign_strategy",
    "campaign_plan",
    "creative_direction",
    "content_creation",
    "design",
    "review",
    "publication",
    "performance_monitoring",
    "learning",
  ];
  const base = order.indexOf(type);
  return (base >= 0 ? base : 50) * 10 + index;
}

function createBasePackage(
  source: CampaignPlannerSource,
  type: CampaignWorkPackageType,
  title: string,
  description: string,
  completionCriteria: string,
  opts?: {
    suffix?: string;
    channel?: string;
    deliverableType?: string;
    effort?: CampaignWorkPackageEffort;
    priorityIndex?: number;
    approvalGate?: boolean;
    refs?: CampaignWorkPackage["sourceReferences"];
  }
): MutablePackage {
  const id = packageId(source.campaign.id, type, opts?.suffix ?? "");
  return {
    id,
    type,
    title,
    description,
    status: "proposed",
    priority: priorityForType(type, opts?.priorityIndex ?? 0),
    phase: phaseForType(type),
    dependencies: [],
    recommendedOwner: ownerForType(type, source),
    estimatedEffort: effortForType(type, opts?.effort),
    approvalRequirement: defaultApprovalRequirement(source, opts?.approvalGate ?? false),
    deliverableType: opts?.deliverableType,
    channel: opts?.channel,
    sourceReferences: opts?.refs
      ? [...opts.refs]
      : [{ kind: "campaign" as const, ref: source.campaign.id, label: source.campaign.name }],
    blockers: [],
    completionCriteria,
  };
}

function collectContentTargets(source: CampaignPlannerSource): CampaignPlannerExplicitDeliverable[] {
  const targets: CampaignPlannerExplicitDeliverable[] = [];
  const seen = new Set<string>();

  const add = (item: CampaignPlannerExplicitDeliverable) => {
    const key = campaignContentTargetKey(
      item.channel,
      item.deliverableType,
      item.planActivityReference ?? item.title ?? ""
    );
    if (seen.has(key)) return;
    seen.add(key);
    targets.push(item);
  };

  for (const d of source.explicitDeliverables ?? []) {
    add(d);
  }

  // Channel-only fallback: one generic placeholder per channel when setup has no concrete deliverable for it.
  for (const channel of source.explicitChannels ?? []) {
    if (channelHasConcreteContentTarget(channel, targets)) continue;
    add({ channel, deliverableType: "generic", title: `${channel} deliverable` });
  }

  for (const activity of source.planSummary?.contentCalendar ?? []) {
    if (!activity.channel?.trim() && !activity.contentType?.trim()) continue;
    add({
      channel: activity.channel ?? "Channel",
      deliverableType: activity.contentType,
      title: activity.title,
      planActivityReference: activity.title,
    });
  }

  return targets;
}

function buildTemplatePackages(source: CampaignPlannerSource): {
  packages: MutablePackage[];
  gaps: CampaignExecutionPlanGap[];
} {
  const gaps: CampaignExecutionPlanGap[] = [];
  const packages: MutablePackage[] = [];
  const cid = source.campaign.id;

  packages.push(
    createBasePackage(
      source,
      "research",
      "Validate audience and context",
      "Confirm who the campaign serves and what context is available before messaging.",
      "Audience and context gaps documented or resolved.",
      { suffix: "0" }
    )
  );

  packages.push(
    createBasePackage(
      source,
      "audience_definition",
      "Define target audience",
      "Align campaign audience with stated goals and available intelligence.",
      "Target audience definition agreed for this campaign.",
      { suffix: "0", refs: [{ kind: "campaign", ref: cid, label: source.campaign.name }] }
    )
  );

  packages.push(
    createBasePackage(
      source,
      "positioning",
      "Clarify positioning and messaging",
      "Establish how this campaign should be positioned before channel execution.",
      "Positioning direction captured for downstream work.",
      { suffix: "0" }
    )
  );

  packages.push(
    createBasePackage(
      source,
      "campaign_strategy",
      "Finalize campaign strategy",
      "Translate goals into a coherent strategy for this campaign scope.",
      "Strategy work complete enough to plan activities.",
      {
        suffix: "0",
        refs: source.strategySummary
          ? [
              {
                kind: "strategy",
                ref: "strategy-summary",
                label: source.strategySummary.summary.slice(0, 80),
              },
            ]
          : undefined,
      }
    )
  );

  packages.push(
    createBasePackage(
      source,
      "campaign_plan",
      "Build campaign activity plan",
      "Sequence activities and dependencies for execution.",
      "Activity plan available for creative and production work.",
      {
        suffix: "0",
        refs: source.planSummary
          ? [
              {
                kind: "plan_activity",
                ref: "plan-summary",
                label: source.planSummary.summary.slice(0, 80),
              },
            ]
          : undefined,
      }
    )
  );

  if (!source.strategySummary) {
    gaps.push({
      id: "gap-strategy",
      message: "Marketing strategy summary not supplied — strategy packages rely on campaign goals only.",
      relatedPackageIds: [packageId(cid, "campaign_strategy", "0")],
    });
  }

  if (!source.planSummary) {
    gaps.push({
      id: "gap-plan",
      message: "Marketing plan summary not supplied — activity sequencing uses conservative defaults.",
      relatedPackageIds: [packageId(cid, "campaign_plan", "0")],
    });
  }

  const briefRefs = source.creativeBriefRefs ?? [];
  const creativePkg = createBasePackage(
    source,
    "creative_direction",
    "Set creative direction",
    "Define creative constraints before content production.",
    "Creative direction established or brief references linked.",
    {
      suffix: "0",
      refs:
        briefRefs.length > 0
          ? briefRefs.map((b) => ({
              kind: "creative_brief" as const,
              ref: b.id,
              label: b.contentType ?? b.channel ?? "brief",
            }))
          : undefined,
    }
  );
  if (briefRefs.length === 0) {
    gaps.push({
      id: "gap-creative-brief",
      message: "No creative brief references supplied — creative direction requires later brief assembly.",
      relatedPackageIds: [creativePkg.id],
    });
  }
  packages.push(creativePkg);

  const contentTargets = collectContentTargets(source);
  const contentPackageIds: string[] = [];

  if (contentTargets.length === 0) {
    gaps.push({
      id: "gap-channels-deliverables",
      message:
        "No explicit channels or deliverables — content production packages omitted until channels/deliverables are specified.",
    });
  } else {
    contentTargets.forEach((target, index) => {
      const suffix = `${normalizeKeyPart(target.channel).replace(/\s/g, "-")}-${normalizeKeyPart(target.deliverableType).replace(/\s/g, "-")}-${index}`;
      const pkg = createBasePackage(
        source,
        "content_creation",
        target.title?.trim() || `Create ${target.deliverableType} for ${target.channel}`,
        "Produce the deliverable for the specified channel — generation happens in a separate execution step.",
        "Deliverable ready for review (content execution not performed by planner).",
        {
          suffix,
          channel: target.channel,
          deliverableType: target.deliverableType,
          effort: source.planSummary?.contentCalendar?.[index]?.estimatedEffort ?? "high",
          priorityIndex: index,
          approvalGate: true,
          refs: [
            { kind: "campaign", ref: cid, label: source.campaign.name },
            {
              kind: "explicit_deliverable",
              ref: `${target.channel}:${target.deliverableType}`,
              label: target.title,
            },
            ...(target.planActivityReference
              ? [
                  {
                    kind: "plan_activity" as const,
                    ref: target.planActivityReference,
                    label: target.planActivityReference,
                  },
                ]
              : []),
          ],
        }
      );
      packages.push(pkg);
      contentPackageIds.push(pkg.id);
    });
  }

  const downstreamAllowed = contentPackageIds.length > 0;

  if (downstreamAllowed) {
    const reviewPkg = createBasePackage(
      source,
      "review",
      "Review deliverables",
      "Customer review of produced deliverables before publication.",
      "Required approvals recorded before publish.",
      { suffix: "0", approvalGate: true }
    );
    packages.push(reviewPkg);

    packages.push(
      createBasePackage(
        source,
        "publication",
        "Publish approved deliverables",
        "Schedule or publish after approvals — no publishing performed by planner.",
        "Publication step ready after review gate.",
        { suffix: "0", approvalGate: true }
      )
    );

    packages.push(
      createBasePackage(
        source,
        "performance_monitoring",
        "Monitor performance",
        "Track outcomes after publication when metrics become available.",
        "Monitoring plan defined; no performance metrics invented by planner.",
        { suffix: "0" }
      )
    );

    packages.push(
      createBasePackage(
        source,
        "learning",
        "Capture learning",
        "Document what worked and what to improve when monitoring data exists.",
        "Learning summary captured after monitoring.",
        { suffix: "0" }
      )
    );
  }

  return { packages, gaps };
}

const DEFAULT_DEPENDENCY_EDGES: Readonly<
  Partial<Record<CampaignWorkPackageType, readonly CampaignWorkPackageType[]>>
> = {
  audience_definition: ["research"],
  positioning: ["audience_definition"],
  campaign_strategy: ["positioning"],
  campaign_plan: ["campaign_strategy"],
  creative_direction: ["campaign_plan"],
  content_creation: ["creative_direction"],
  design: ["creative_direction"],
  review: ["content_creation"],
  publication: ["review"],
  performance_monitoring: ["publication"],
  learning: ["performance_monitoring"],
};

function applyDefaultDependencies(packages: MutablePackage[]): void {
  const byType = new Map<CampaignWorkPackageType, MutablePackage[]>();
  for (const pkg of packages) {
    const list = byType.get(pkg.type) ?? [];
    list.push(pkg);
    byType.set(pkg.type, list);
  }

  for (const pkg of packages) {
    const depTypes = DEFAULT_DEPENDENCY_EDGES[pkg.type] ?? [];
    const deps: string[] = [];
    for (const depType of depTypes) {
      const candidates = byType.get(depType) ?? [];
      if (pkg.type === "review" && depType === "content_creation") {
        deps.push(...candidates.map((c) => c.id));
      } else if (candidates[0]) {
        deps.push(candidates[0]!.id);
      }
    }
    pkg.dependencies = [...new Set([...pkg.dependencies, ...deps])];
  }

  for (const pkg of packages) {
    if (pkg.type === "review") {
      const contentIds = packages.filter((p) => p.type === "content_creation").map((p) => p.id);
      if (contentIds.length > 0) {
        pkg.dependencies = [...new Set([...pkg.dependencies, ...contentIds])];
      }
    }
  }
}

function applyPlanSummaryDependencies(
  packages: MutablePackage[],
  source: CampaignPlannerSource
): void {
  const planDeps = source.planSummary?.dependencies ?? [];
  if (planDeps.length === 0) return;

  const byActivityTitle = new Map<string, MutablePackage>();
  for (const pkg of packages) {
    for (const ref of pkg.sourceReferences) {
      if (ref.kind === "plan_activity") {
        byActivityTitle.set(normalizeKeyPart(ref.ref), pkg);
      }
    }
  }

  for (const edge of planDeps) {
    const dependent = byActivityTitle.get(normalizeKeyPart(edge.dependent));
    const dependsOn = byActivityTitle.get(normalizeKeyPart(edge.dependsOn));
    if (dependent && dependsOn) {
      dependent.dependencies = [...new Set([...dependent.dependencies, dependsOn.id])];
    }
  }
}

function validateDependencyGraph(packages: readonly CampaignWorkPackage[]): void {
  const ids = new Set(packages.map((p) => p.id));
  for (const pkg of packages) {
    if (pkg.dependencies.includes(pkg.id)) {
      throw new CampaignPlannerDependencyError(
        `Package "${pkg.id}" must not depend on itself.`
      );
    }
    for (const dep of pkg.dependencies) {
      if (!ids.has(dep)) {
        throw new CampaignPlannerDependencyError(
          `Package "${pkg.id}" depends on missing package "${dep}".`
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new CampaignPlannerDependencyError(
        `Dependency cycle detected involving package "${id}".`
      );
    }
    visiting.add(id);
    const pkg = packages.find((p) => p.id === id);
    for (const dep of pkg?.dependencies ?? []) {
      visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const pkg of packages) {
    visit(pkg.id);
  }
}

function topologicalExecutionOrder(packages: readonly CampaignWorkPackage[]): string[] {
  const ids = packages.map((p) => p.id);
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const id of ids) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const pkg of packages) {
    for (const dep of pkg.dependencies) {
      adj.get(dep)?.push(pkg.id);
      inDegree.set(pkg.id, (inDegree.get(pkg.id) ?? 0) + 1);
    }
  }

  const queue = ids
    .filter((id) => (inDegree.get(id) ?? 0) === 0)
    .sort((a, b) => {
      const pa = packages.find((p) => p.id === a)!.priority;
      const pb = packages.find((p) => p.id === b)!.priority;
      return pa - pb || a.localeCompare(b);
    });

  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    const neighbors = adj.get(current) ?? [];
    for (const next of neighbors) {
      const deg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, deg);
      if (deg === 0) {
        queue.push(next);
        queue.sort((a, b) => {
          const pa = packages.find((p) => p.id === a)!.priority;
          const pb = packages.find((p) => p.id === b)!.priority;
          return pa - pb || a.localeCompare(b);
        });
      }
    }
  }

  if (order.length !== packages.length) {
    throw new CampaignPlannerDependencyError("Unable to derive execution order from dependencies.");
  }

  return order;
}

function contentPackageKey(
  channel: string,
  deliverableType: string,
  planActivityReference?: string | null
): string {
  return campaignContentTargetKey(channel, deliverableType, planActivityReference ?? "");
}

function workUnitContentKey(unit: CampaignPlannerWorkUnitSummary): string {
  return contentPackageKey(unit.channel, unit.deliverableKind, unit.planActivityReference);
}

function mergeExistingWorkUnits(
  packages: MutablePackage[],
  source: CampaignPlannerSource
): void {
  const units = source.existingWorkUnits ?? [];
  if (units.length === 0) return;

  const contentPackages = packages.filter((p) => p.type === "content_creation");
  const contentByKey = new Map<string, MutablePackage>();
  for (const pkg of contentPackages) {
    const key = contentPackageKey(
      pkg.channel ?? "",
      pkg.deliverableType ?? "generic",
      pkg.sourceReferences.find((r) => r.kind === "plan_activity")?.ref
    );
    contentByKey.set(key, pkg);
  }

  for (const unit of units) {
    if (unit.cancelled) continue;

    const key = workUnitContentKey(unit);
    let matched = contentByKey.get(key);

    if (!matched && unit.planActivityReference) {
      matched = contentPackages.find((p) =>
        p.sourceReferences.some(
          (r) =>
            r.kind === "plan_activity" &&
            normalizeKeyPart(r.ref) === normalizeKeyPart(unit.planActivityReference!)
        )
      );
    }

    if (!matched) continue;

    matched.matchedWorkUnitId = unit.id;
    matched.sourceReferences = [
      ...matched.sourceReferences,
      { kind: "work_unit", ref: unit.id, label: unit.title },
    ];

    if (unit.blockers?.length) {
      matched.blockers = [...new Set([...matched.blockers, ...unit.blockers])];
      matched.status = "blocked";
    } else if (SATISFIED_STAGES.has(unit.lifecycleStage)) {
      matched.status = "satisfied";
    } else if (IN_PROGRESS_STAGES.has(unit.lifecycleStage)) {
      matched.status = "in_progress";
    }

    if (unit.paused && matched.status === "proposed") {
      matched.status = "in_progress";
    }
  }
}

function applyDecisionPolicy(
  packages: MutablePackage[],
  source: CampaignPlannerSource
): CampaignExecutionPlanStatus {
  const decision = source.decisionSummary;
  if (!decision) {
    return collectContentTargets(source).length === 0 ? "draft" : "ready";
  }

  if (decision.status === "blocked" || !decision.canExecute) {
    for (const pkg of packages) {
      if (pkg.type === "content_creation" || pkg.type === "publication") {
        pkg.status = "blocked";
        pkg.blockers = [
          ...new Set([
            ...pkg.blockers,
            ...(decision.blockedReasons ?? ["Execution blocked by marketing decision policy."]),
          ]),
        ];
      }
    }
    return "blocked";
  }

  if (decision.status === "restricted" || !decision.canGenerateCreative) {
    for (const pkg of packages) {
      if (pkg.type === "content_creation") {
        pkg.approvalRequirement = {
          required: true,
          mode: decision.approvalMode ?? pkg.approvalRequirement.mode,
          brandReviewRequired: decision.brandReviewRequired ?? true,
          legalReviewRequired: decision.legalReviewRequired ?? false,
        };
      }
    }
    return "restricted";
  }

  return "ready";
}

function buildApprovals(
  packages: readonly CampaignWorkPackage[],
  source: CampaignPlannerSource
): CampaignExecutionPlanApproval[] {
  const approvals: CampaignExecutionPlanApproval[] = [];
  const mode =
    source.decisionSummary?.approvalMode ??
    campaignApprovalToMode(source.campaign.execution.approvalMode);

  for (const pkg of packages) {
    if (!pkg.approvalRequirement.required) continue;
    if (mode === "approval_before_generation" && pkg.type === "content_creation") {
      approvals.push({
        packageId: pkg.id,
        gate: "before_generation",
        description: "Approval required before creative generation.",
      });
    }
    if (
      (mode === "approval_before_publication" || pkg.type === "review") &&
      (pkg.type === "review" || pkg.type === "publication")
    ) {
      approvals.push({
        packageId: pkg.id,
        gate: "before_publication",
        description: "Approval required before publication.",
      });
    }
    if (mode === "blocked_manual_only" && (pkg.type === "publication" || pkg.type === "content_creation")) {
      approvals.push({
        packageId: pkg.id,
        gate: "manual_only",
        description: "Manual execution only — autonomous publish blocked.",
      });
    }
  }

  return approvals;
}

function buildEvidence(source: CampaignPlannerSource): CampaignExecutionPlanEvidence[] {
  const evidence: CampaignExecutionPlanEvidence[] = [
    { kind: "campaign", ref: source.campaign.id, label: source.campaign.name },
  ];
  if (source.strategySummary) {
    evidence.push({
      kind: "strategy",
      ref: "strategy-summary",
      label: source.strategySummary.summary.slice(0, 120),
    });
  }
  if (source.planSummary) {
    evidence.push({
      kind: "plan",
      ref: "plan-summary",
      label: source.planSummary.summary.slice(0, 120),
    });
  }
  if (source.decisionSummary) {
    evidence.push({
      kind: "decision",
      ref: source.decisionSummary.id,
      label: source.decisionSummary.status,
    });
  }
  return evidence;
}

function freezePackages(packages: MutablePackage[]): CampaignWorkPackage[] {
  return packages.map((p) => ({
    ...p,
    dependencies: Object.freeze([...p.dependencies]) as readonly string[],
    blockers: Object.freeze([...p.blockers]) as readonly string[],
    sourceReferences: Object.freeze([...p.sourceReferences]),
  }));
}

/**
 * Pure deterministic campaign execution planner — no AI, I/O, or persistence.
 */
export function planCampaignExecution(source: CampaignPlannerSource): CampaignExecutionPlan {
  assertValidSource(source);

  const { packages: mutablePackages, gaps: templateGaps } = buildTemplatePackages(source);
  applyDefaultDependencies(mutablePackages);
  applyPlanSummaryDependencies(mutablePackages, source);
  mergeExistingWorkUnits(mutablePackages, source);

  let status = applyDecisionPolicy(mutablePackages, source);
  if (status === "ready" && templateGaps.some((g) => g.id === "gap-channels-deliverables")) {
    status = "draft";
  }

  const frozenAfterPolicy = freezePackages(mutablePackages);
  validateDependencyGraph(frozenAfterPolicy);
  const executionOrderFinal = topologicalExecutionOrder(frozenAfterPolicy);

  const objective =
    source.campaign.goal.marketingObjective?.trim() ||
    source.campaign.goal.businessObjective?.trim() ||
    source.campaign.name;

  const planId = `cep-${source.campaign.id}-v${source.version ?? 1}`;

  return {
    id: planId,
    campaignId: source.campaign.id,
    organizationId: source.organizationId,
    version: source.version ?? 1,
    status,
    objective,
    workPackages: frozenAfterPolicy,
    executionOrder: executionOrderFinal,
    approvals: buildApprovals(frozenAfterPolicy, source),
    gaps: Object.freeze([...templateGaps]) as readonly CampaignExecutionPlanGap[],
    evidence: Object.freeze(buildEvidence(source)) as readonly CampaignExecutionPlanEvidence[],
    assembledAt: source.assembledAt,
  };
}

/** @internal Exported for tests — validates an arbitrary dependency graph. */
export function validateCampaignWorkPackageDependencies(
  packages: readonly CampaignWorkPackage[]
): void {
  validateDependencyGraph(packages);
}

/** @internal Exported for tests — topological order only. */
export function deriveCampaignExecutionOrder(
  packages: readonly CampaignWorkPackage[]
): string[] {
  validateDependencyGraph(packages);
  return topologicalExecutionOrder(packages);
}
