import {
  loadMarketingWorkspaceState,
  patchMarketingWorkspaceState,
} from "@/lib/marketing-workspace/storage";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import type { CampaignWorkflowStepId } from "@/lib/office/campaign/workflow-types";
import type { DemoStepApprovalStatus } from "@/lib/office/demo/demo-workflow-simulation";
import type { StrategyRunState } from "@/lib/office/campaign/strategy-run-types";
import {
  approvalsToClearOnInvalidation,
  mergeStepApprovals,
  nextCampaignContextVersion,
  type CampaignContextChangeTrigger,
} from "@/lib/office/campaign/campaign-context-invalidation";
import { buildCampaignBrainOutputsPatch, type PersistedCampaignBrainCapabilityId } from "@/lib/office/campaign/campaign-brain-outputs";
import type { BrainCapabilityId } from "@/lib/brain/capabilities/registry";
import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { mergeCampaignOutputsWithPlanning } from "@/lib/brain/integration/merge-campaign-planning-outputs";

export type LiveWebsiteDecision =
  | { kind: "url"; url: string }
  | { kind: "skip" };

export type LiveCompetitorDecision =
  | { kind: "list"; competitors: readonly { name: string; url?: string }[] }
  | { kind: "skip" };

export type LiveCampaignBrandContext = {
  brandName: string;
  industry?: string;
  mission?: string;
  uniqueSellingPoints?: readonly string[];
  productsAndServices?: readonly string[];
  positioning?: string;
  tone?: string;
  targetAudience?: string;
};

export type LiveBusinessAnalysisDecision = { kind: "approved" };

export type CampaignCompetitorPersistEntry = {
  name: string;
  url?: string;
};

/** Normalize bare domains to https URLs; returns null when invalid. */
export function normalizeCampaignCompetitorUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const hostname = parsed.hostname;
    if (!hostname.includes(".")) return null;
    if (hostname.startsWith("-") || hostname.startsWith(".")) return null;
    if (hostname.endsWith("-") || hostname.endsWith(".")) return null;
    const labels = hostname.split(".");
    if (labels.some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
      return null;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Normalize bare domains to https URLs; returns null when invalid. */
export function normalizeCampaignWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function assertLivePeer(peerId: string): void {
  if (isDemoPeer(peerId)) {
    throw new Error("Live campaign context store must not be used for demo peers.");
  }
}

function patchProjectSetupWithInvalidation(
  peerId: string,
  projectId: string,
  patch: Partial<NonNullable<MarketingProject["campaignSetup"]>>,
  invalidationTrigger?: CampaignContextChangeTrigger
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const projects = stored.projects ?? [];
  const index = projects.findIndex((p) => p.id === projectId);
  if (index < 0) return null;

  const project = projects[index]!;
  const setup = project.campaignSetup;
  if (!setup) return null;

  const contextVersion = nextCampaignContextVersion(project);
  const approvalClear = invalidationTrigger
    ? approvalsToClearOnInvalidation(invalidationTrigger)
    : {};
  const stepApprovals = invalidationTrigger
    ? mergeStepApprovals(setup.stepApprovals, approvalClear)
    : setup.stepApprovals;

  const updated: MarketingProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    campaignSetup: {
      ...setup,
      ...patch,
      campaignContextVersion: contextVersion,
      stepApprovals,
      ...(invalidationTrigger &&
      (invalidationTrigger === "website" ||
        invalidationTrigger === "competitors" ||
        invalidationTrigger === "brand_context" ||
        invalidationTrigger === "goal" ||
        invalidationTrigger === "audience")
        ? {
            strategyGeneratedAt: undefined,
            businessAnalyzedApproved: false,
            strategyRun: undefined,
            campaignBrainOutputs: undefined,
          }
        : {}),
    },
  };

  const nextProjects = [...projects];
  nextProjects[index] = updated;
  patchMarketingWorkspaceState(peerId, { projects: nextProjects });
  return updated;
}

function patchProjectSetup(
  peerId: string,
  projectId: string,
  patch: Partial<NonNullable<MarketingProject["campaignSetup"]>>,
  invalidationTrigger?: CampaignContextChangeTrigger
): MarketingProject | null {
  if (invalidationTrigger) {
    return patchProjectSetupWithInvalidation(peerId, projectId, patch, invalidationTrigger);
  }
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const projects = stored.projects ?? [];
  const index = projects.findIndex((p) => p.id === projectId);
  if (index < 0) return null;

  const project = projects[index]!;
  const setup = project.campaignSetup;
  if (!setup) return null;

  const updated: MarketingProject = {
    ...project,
    updatedAt: new Date().toISOString(),
    campaignSetup: {
      ...setup,
      ...patch,
    },
  };

  const nextProjects = [...projects];
  nextProjects[index] = updated;
  patchMarketingWorkspaceState(peerId, { projects: nextProjects });
  return updated;
}

/** Persist a customer-supplied website URL on the live campaign project. */
export function persistLiveCampaignWebsiteUrl(
  peerId: string,
  projectId: string,
  url: string
): MarketingProject | null {
  const normalized = normalizeCampaignWebsiteUrl(url);
  if (!normalized) return null;

  return patchProjectSetup(peerId, projectId, {
    websiteUrl: normalized,
    websiteSkipped: false,
    websiteDecisionAt: new Date().toISOString(),
    websiteDecisionSource: "customer_supplied",
  }, "website");
}

/** Persist an explicit skip decision — distinct from missing or failed. */
export function persistLiveCampaignWebsiteSkip(
  peerId: string,
  projectId: string
): MarketingProject | null {
  return patchProjectSetup(peerId, projectId, {
    websiteUrl: undefined,
    websiteSkipped: true,
    websiteDecisionAt: new Date().toISOString(),
    websiteDecisionSource: "customer_skipped",
  }, "website");
}

export function readLiveWebsiteDecision(project: MarketingProject): {
  websiteUrl: string | null;
  websiteSkipped: boolean;
} {
  const setup = project.campaignSetup;
  return {
    websiteUrl: setup?.websiteUrl?.trim() ?? null,
    websiteSkipped: Boolean(setup?.websiteSkipped),
  };
}

function normalizeCompetitorEntries(
  competitors: readonly { name: string; url?: string }[]
): CampaignCompetitorPersistEntry[] {
  return competitors
    .map((c) => ({
      name: c.name.trim(),
      url: c.url?.trim() ? normalizeCampaignCompetitorUrl(c.url) ?? undefined : undefined,
    }))
    .filter((c) => c.name.length > 0);
}

/** Persist customer-supplied competitors on the live campaign project. */
export function persistLiveCampaignCompetitors(
  peerId: string,
  projectId: string,
  competitors: readonly { name: string; url?: string }[]
): MarketingProject | null {
  const entries = normalizeCompetitorEntries(competitors);
  if (entries.length === 0) return null;

  return patchProjectSetup(peerId, projectId, {
    campaignCompetitors: entries,
    competitorsSkipped: false,
    competitorsDecisionAt: new Date().toISOString(),
    competitorsDecisionSource: "customer_supplied",
  }, "competitors");
}

/** Persist an explicit skip decision for competitor analysis. */
export function persistLiveCampaignCompetitorSkip(
  peerId: string,
  projectId: string
): MarketingProject | null {
  return patchProjectSetup(peerId, projectId, {
    campaignCompetitors: [],
    competitorsSkipped: true,
    competitorsDecisionAt: new Date().toISOString(),
    competitorsDecisionSource: "customer_skipped",
  }, "competitors");
}

export function readLiveCompetitorDecision(project: MarketingProject): {
  competitors: readonly CampaignCompetitorPersistEntry[];
  competitorsSkipped: boolean;
} {
  const setup = project.campaignSetup;
  return {
    competitors: setup?.campaignCompetitors ?? [],
    competitorsSkipped: Boolean(setup?.competitorsSkipped),
  };
}

/** Persist customer-supplied brand/company context scoped to this campaign. */
export function persistLiveCampaignBrandContext(
  peerId: string,
  projectId: string,
  context: LiveCampaignBrandContext
): MarketingProject | null {
  const brandName = context.brandName.trim();
  if (!brandName) return null;

  return patchProjectSetup(peerId, projectId, {
    campaignBrandName: brandName,
    campaignBrandContext: {
      brandName,
      industry: context.industry?.trim() || undefined,
      mission: context.mission?.trim() || undefined,
      uniqueSellingPoints: context.uniqueSellingPoints?.filter(Boolean),
      productsAndServices: context.productsAndServices?.filter(Boolean),
      positioning: context.positioning?.trim() || undefined,
      tone: context.tone?.trim() || undefined,
      targetAudience: context.targetAudience?.trim() || undefined,
    },
    campaignBrandContextAt: new Date().toISOString(),
    campaignBrandContextSource: "customer_supplied",
    businessAnalyzedApproved: false,
    businessAnalyzedAt: undefined,
  }, "brand_context");
}

/** Mark business analysis complete after successful company_understanding output. */
export function persistLiveCampaignBusinessAnalysisApproval(
  peerId: string,
  projectId: string
): MarketingProject | null {
  return patchProjectSetup(peerId, projectId, {
    businessAnalyzedApproved: true,
    businessAnalyzedAt: new Date().toISOString(),
  });
}

/** Pure merge — safe on server (no sessionStorage). */
export function mergeCampaignStepApprovalIntoProject(
  project: MarketingProject,
  stepId: CampaignWorkflowStepId,
  status: DemoStepApprovalStatus
): MarketingProject | null {
  if (!project.campaignSetup) return null;

  const stepApprovals = {
    ...project.campaignSetup.stepApprovals,
    [stepId]: status,
  };

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    campaignSetup: {
      ...project.campaignSetup,
      stepApprovals,
      ...(stepId === "strategy_determined" &&
      status === "approved" &&
      !project.campaignSetup.strategyGeneratedAt
        ? { strategyGeneratedAt: new Date().toISOString() }
        : {}),
    },
  };
}

/** Persist customer review gate approval for strategy, channels, or deliverables. */
export function persistLiveCampaignStepApproval(
  peerId: string,
  projectId: string,
  stepId: CampaignWorkflowStepId,
  status: DemoStepApprovalStatus
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const project = stored.projects?.find((p) => p.id === projectId);
  if (!project?.campaignSetup) return null;

  const merged = mergeCampaignStepApprovalIntoProject(project, stepId, status);
  if (!merged) return null;

  const patch: Partial<NonNullable<MarketingProject["campaignSetup"]>> = {
    stepApprovals: merged.campaignSetup!.stepApprovals,
    ...(merged.campaignSetup!.strategyGeneratedAt !== project.campaignSetup.strategyGeneratedAt
      ? { strategyGeneratedAt: merged.campaignSetup!.strategyGeneratedAt }
      : {}),
  };

  return patchProjectSetup(peerId, projectId, patch);
}

/** Record successful strategy capability output — unlocks review CTA. */
export function persistLiveCampaignStrategyOutput(
  peerId: string,
  projectId: string
): MarketingProject | null {
  return patchProjectSetup(peerId, projectId, {
    strategyGeneratedAt: new Date().toISOString(),
  });
}

export function persistLiveStrategyRunState(
  peerId: string,
  projectId: string,
  patch: Partial<StrategyRunState>
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const project = stored.projects?.find((p) => p.id === projectId);
  if (!project?.campaignSetup) return null;

  const current = project.campaignSetup.strategyRun ?? { status: "idle" as const };
  return patchProjectSetup(peerId, projectId, {
    strategyRun: {
      ...current,
      ...patch,
    },
  });
}

export function persistLiveStrategyRunSuccess(
  peerId: string,
  projectId: string,
  input: {
    runId: string;
    contextVersion: number;
    idempotencyKey: string;
    provider: string;
    fallbackUsed: boolean;
    completedAt: string;
    startedAt?: string;
  }
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const project = stored.projects?.find((p) => p.id === projectId);
  const startedAt =
    input.startedAt ?? project?.campaignSetup?.strategyRun?.startedAt ?? input.completedAt;

  return patchProjectSetup(peerId, projectId, {
    strategyGeneratedAt: input.completedAt,
    strategyRun: {
      status: "completed",
      runId: input.runId,
      startedAt,
      completedAt: input.completedAt,
      contextVersion: input.contextVersion,
      idempotencyKey: input.idempotencyKey,
      provider: input.provider,
      fallbackUsed: input.fallbackUsed,
      failureCode: undefined,
      failureMessageSafe: undefined,
      stageLabel: undefined,
    },
  });
}

export function recoverStaleLiveStrategyRun(
  peerId: string,
  projectId: string,
  input: { failureCode: string; failureMessageSafe: string }
): MarketingProject | null {
  return persistLiveStrategyRunState(peerId, projectId, {
    status: "failed",
    completedAt: new Date().toISOString(),
    failureCode: input.failureCode,
    failureMessageSafe: input.failureMessageSafe,
  });
}

export function clearLiveStrategyRunForRetry(
  peerId: string,
  projectId: string
): MarketingProject | null {
  return patchProjectSetup(peerId, projectId, {
    strategyRun: { status: "idle" },
    strategyGeneratedAt: undefined,
  });
}

/** Persist customer-safe Brain capability outputs for workflow reuse (session storage bridge). */
export function persistCampaignBrainOutputs(
  peerId: string,
  projectId: string,
  outputs: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const project = stored.projects?.find((p) => p.id === projectId);
  if (!project?.campaignSetup) return null;

  const mergedOutputs = mergeCampaignOutputsWithPlanning({
    project,
    peerId,
    outputs,
  });

  return patchProjectSetup(
    peerId,
    projectId,
    buildCampaignBrainOutputsPatch(
      project.campaignSetup,
      mergedOutputs as Partial<Record<PersistedCampaignBrainCapabilityId, BrainStructuredOutput>>
    )
  );
}

function formatScheduleParts(scheduledAtIso: string, timezone: string): {
  scheduledDate: string;
  scheduledTime: string;
} {
  const date = new Date(scheduledAtIso);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid schedule date.");
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    scheduledDate: `${pick("year")}-${pick("month")}-${pick("day")}`,
    scheduledTime: `${pick("hour")}:${pick("minute")}`,
  };
}

/** Persist internal live campaign schedule — no external publish implied. */
export function persistLiveCampaignSchedule(
  peerId: string,
  projectId: string,
  input: {
    scheduledAt: string;
    timezone: string;
    channels?: readonly string[];
    deliverableIds?: readonly string[];
  }
): MarketingProject | null {
  assertLivePeer(peerId);
  const stored = loadMarketingWorkspaceState(peerId);
  const project = stored.projects?.find((p) => p.id === projectId);
  if (!project?.campaignSetup) return null;

  const approvals = project.campaignSetup.stepApprovals ?? {};
  if (approvals.deliverables_created !== "approved") return null;

  const { scheduledDate, scheduledTime } = formatScheduleParts(input.scheduledAt, input.timezone);
  const contextVersion = project.campaignSetup.campaignContextVersion ?? 0;
  const now = new Date().toISOString();

  return patchProjectSetup(peerId, projectId, {
    campaignSchedule: {
      scheduledAt: input.scheduledAt,
      scheduledDate,
      scheduledTime,
      timezone: input.timezone,
      scheduledDecisionAt: now,
      source: "customer_scheduled",
      contextVersion,
      channels: input.channels ? [...input.channels] : undefined,
      deliverableIds: input.deliverableIds ? [...input.deliverableIds] : undefined,
    },
    stepApprovals: {
      ...approvals,
      waiting_for_approval: approvals.waiting_for_approval ?? "approved",
      scheduled: "approved",
    },
  });
}
