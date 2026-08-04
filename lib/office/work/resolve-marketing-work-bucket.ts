import {
  deriveOfficeCampaignWorkMeta,
  isCampaignPublished,
  resolveCampaignPublishingState,
  type CampaignPublishingState,
} from "@/lib/office/campaign/campaign-lifecycle";
import {
  isCampaignScheduled,
  readCampaignScheduleRecord,
} from "@/lib/office/campaign/campaign-schedule-state";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  MarketingProject,
  MarketingProjectStatus,
} from "@/lib/peer-experience/marketing/projects/types";
import type { WorkChannel, WorkGroupId } from "./types";
import {
  deriveProjectStatus,
  primaryWorkUnitForProject,
} from "@/lib/peer-experience/marketing/projects/project-engine";

export type MarketingWorkBucket =
  | "attention"
  | "running"
  | "scheduled"
  | "blocked"
  | "recently_completed";

export type MarketingWorkBucketReason =
  | "customer_attention_required"
  | "brain_work_running"
  | "scheduled_waiting_for_publication"
  | "terminal_failure"
  | "publication_failed"
  | "integration_blocked_during_publish"
  | "paused"
  | "recently_completed"
  | "in_progress";

export type MarketingWorkBucketResult = {
  bucket: MarketingWorkBucket;
  reason: MarketingWorkBucketReason;
  projectStatus: MarketingProjectStatus;
  publishingState: CampaignPublishingState;
  /** Dev-only trace when the resolver falls back without a strong match. */
  devFallback?: boolean;
};

const FINISHED_STATUSES: readonly MarketingProjectStatus[] = [
  "completed",
  "archived",
];

function strategyRunActive(project: MarketingProject): boolean {
  const run = project.campaignSetup?.strategyRun;
  return (
    run?.status === "queued" ||
    run?.status === "running" ||
    run?.status === "waiting_for_input"
  );
}

function hasValidPersistedSchedule(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  isDemo: boolean
): boolean {
  const record = readCampaignScheduleRecord(project, domainInput, isDemo);
  if (!record?.scheduledAt) return false;
  const at = new Date(record.scheduledAt);
  return Number.isFinite(at.getTime());
}

/** Map canonical bucket → legacy Work group id (presentation layer). */
export function workGroupIdFromBucket(bucket: MarketingWorkBucket): WorkGroupId {
  switch (bucket) {
    case "attention":
      return "blocked_on_you";
    case "running":
      return "moving";
    case "scheduled":
      return "queued";
    case "blocked":
      return "blocked_elsewhere";
    case "recently_completed":
      return "finished";
  }
}

/**
 * Canonical Work bucket resolver — one bucket per live campaign.
 *
 * Priority (highest first):
 * 1. recently_completed
 * 2. attention (customer must act)
 * 3. blocked (real failure / recovery required)
 * 4. scheduled (valid internal schedule — never blocked for missing integrations)
 * 5. running (Emma working / published-active monitoring)
 * 6. in_progress fallback
 */
export function resolveMarketingWorkBucket(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  isDemo: boolean;
  awaitingProjectIds: ReadonlySet<string>;
  disconnectedChannel?: WorkChannel;
  paused?: boolean;
}): MarketingWorkBucketResult {
  const { project, domainInput, isDemo, awaitingProjectIds, disconnectedChannel, paused } =
    input;

  const unit = primaryWorkUnitForProject(project.id, domainInput.workUnits);
  const published = isCampaignPublished(project, domainInput, isDemo);
  const scheduled = isCampaignScheduled(project, domainInput, isDemo);
  const validSchedule = hasValidPersistedSchedule(project, domainInput, isDemo);
  const publishingState = resolveCampaignPublishingState({
    project,
    domainInput,
    connections: domainInput.connections,
    isCampaignPublished: published,
    isDemo,
  });

  let projectStatus: MarketingProjectStatus;
  let awaitingCustomer = false;

  if (project.campaignSetup) {
    const meta = deriveOfficeCampaignWorkMeta({
      project,
      domainInput,
      isDemo,
      awaitingProjectIds,
    });
    projectStatus = meta.projectStatus;
    awaitingCustomer = meta.awaitingCustomer;
  } else {
    projectStatus = deriveProjectStatus(
      project,
      domainInput.workUnits,
      domainInput.drafts,
      new Set()
    );
    awaitingCustomer =
      projectStatus === "waiting_for_review" || awaitingProjectIds.has(project.id);
  }

  if (FINISHED_STATUSES.includes(projectStatus)) {
    return {
      bucket: "recently_completed",
      reason: "recently_completed",
      projectStatus,
      publishingState,
    };
  }

  if (awaitingCustomer) {
    return {
      bucket: "attention",
      reason: "customer_attention_required",
      projectStatus,
      publishingState,
    };
  }

  if (publishingState === "failed") {
    return {
      bucket: "blocked",
      reason: "publication_failed",
      projectStatus,
      publishingState,
    };
  }

  const strategyFailed = project.campaignSetup?.strategyRun?.status === "failed";
  if (strategyFailed) {
    return {
      bucket: "blocked",
      reason: "terminal_failure",
      projectStatus,
      publishingState,
    };
  }

  if (paused) {
    return {
      bucket: "blocked",
      reason: "paused",
      projectStatus,
      publishingState,
    };
  }

  // Real integration block only when publication is actively requested — not for scheduled-only.
  if (
    disconnectedChannel &&
    !validSchedule &&
    (projectStatus === "publishing" || publishingState === "publishing")
  ) {
    return {
      bucket: "blocked",
      reason: "integration_blocked_during_publish",
      projectStatus,
      publishingState,
    };
  }

  if (
    validSchedule &&
    scheduled &&
    !published &&
    projectStatus !== "monitoring_results"
  ) {
    return {
      bucket: "scheduled",
      reason: "scheduled_waiting_for_publication",
      projectStatus,
      publishingState,
    };
  }

  if (
    projectStatus === "monitoring_results" ||
    publishingState === "publishing" ||
    publishingState === "published" ||
    strategyRunActive(project)
  ) {
    return {
      bucket: "running",
      reason: publishingState === "publishing" ? "brain_work_running" : "in_progress",
      projectStatus,
      publishingState,
    };
  }

  if (Boolean(unit) || project.campaignSetup?.businessAnalyzedApproved) {
    return {
      bucket: "running",
      reason: "in_progress",
      projectStatus,
      publishingState,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[resolveMarketingWorkBucket] narrow fallback for project ${project.id}`,
      { projectStatus, publishingState, scheduled, validSchedule }
    );
  }

  return {
    bucket: "running",
    reason: "in_progress",
    projectStatus,
    publishingState,
    devFallback: true,
  };
}
