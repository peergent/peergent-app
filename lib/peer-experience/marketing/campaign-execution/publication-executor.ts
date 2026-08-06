import type { CampaignExecutionCorrelation } from "./campaign-execution-correlation";
import {
  appendTimelineEvent,
  createCampaignExecutionTimelineEvent,
  type CampaignExecutionTimelineEvent,
} from "./campaign-execution-timeline";
import { buildCampaignContinuationIdempotencyKey } from "./campaign-run-id";
import type { CampaignPublicationState } from "./campaign-run-types";
import {
  assertPublicationTransition,
  initialCampaignPublicationStatus,
} from "./publication-state-machine";
import { persistCampaignPublication } from "./campaign-run-store";
import {
  loadDurableCampaignExecutionState,
  patchDurableCampaignExecutionState,
} from "./durable-campaign-state-store";

export type CampaignPublicationExecutorInput = {
  readonly peerId: string;
  readonly projectId: string;
  readonly campaignRunId: string;
  readonly approvalId?: string;
  readonly hasApproval: boolean;
  readonly resumeIfInterrupted?: boolean;
  readonly existingPublication?: CampaignPublicationState;
  readonly publish: () => Promise<{ ok: boolean; message?: string; code?: string }>;
  readonly appendTimeline: (
    events: readonly CampaignExecutionTimelineEvent[]
  ) => readonly CampaignExecutionTimelineEvent[];
};

export type CampaignPublicationExecutorResult = {
  readonly ok: boolean;
  readonly publication: CampaignPublicationState;
  readonly timelineEvents: readonly CampaignExecutionTimelineEvent[];
  readonly message: string;
};

function buildCorrelation(input: CampaignPublicationExecutorInput): CampaignExecutionCorrelation {
  return {
    campaignId: input.projectId,
    campaignRunId: input.campaignRunId,
    approvalId: input.approvalId,
    projectId: input.projectId,
    organizationId: "",
  };
}

function resolveExistingPublication(
  peerId: string,
  projectId: string,
  campaignRunId: string
): CampaignPublicationState | undefined {
  const durable = loadDurableCampaignExecutionState(peerId);
  const pub = durable.campaignPublicationByProjectId[projectId];
  if (!pub || pub.campaignRunId !== campaignRunId) return undefined;
  return pub;
}

export async function executeCampaignPublication(
  input: CampaignPublicationExecutorInput
): Promise<CampaignPublicationExecutorResult> {
  const now = new Date().toISOString();
  const correlation = buildCorrelation(input);
  let timelineEvents = input.appendTimeline([]);

  const existing =
    input.existingPublication ??
    resolveExistingPublication(input.peerId, input.projectId, input.campaignRunId);

  if (existing?.status === "published") {
    return {
      ok: true,
      publication: existing,
      timelineEvents,
      message: "Campaign already published for this run.",
    };
  }

  const idempotencyKey = buildCampaignContinuationIdempotencyKey({
    peerId: input.peerId,
    projectId: input.projectId,
    campaignRunId: input.campaignRunId,
    phase: "publication",
    approvalId: input.approvalId,
  });

  if (existing?.status === "publishing" && !input.resumeIfInterrupted) {
    return {
      ok: false,
      publication: existing,
      timelineEvents,
      message: "Publication already in progress for this run.",
    };
  }

  const baseStatus = existing?.status ?? initialCampaignPublicationStatus(input);
  const publishing: CampaignPublicationState = {
    status: existing?.status === "failed" || existing?.status === "retrying" ? "retrying" : "publishing",
    campaignRunId: input.campaignRunId,
    approvalId: input.approvalId,
    updatedAt: now,
    retryCount: existing?.retryCount ?? 0,
    idempotencyKey,
  };

  if (existing) {
    assertPublicationTransition(existing.status, publishing.status);
  } else if (baseStatus === "approved") {
    assertPublicationTransition("approved", publishing.status);
  }

  persistCampaignPublication(input.peerId, input.projectId, publishing);

  if (publishing.status === "retrying") {
    const retried = createCampaignExecutionTimelineEvent({
      kind: "publication_retried",
      correlation,
      at: now,
    });
    timelineEvents = input.appendTimeline(appendTimelineEvent(timelineEvents, retried));
  }

  const started = createCampaignExecutionTimelineEvent({
    kind: "publication_started",
    correlation,
    at: now,
  });
  timelineEvents = input.appendTimeline(appendTimelineEvent(timelineEvents, started));

  const publishResult = await input.publish();

  if (publishResult.ok) {
    const published: CampaignPublicationState = {
      ...publishing,
      status: "published",
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      retryCount: publishing.retryCount,
      idempotencyKey,
    };
    persistCampaignPublication(input.peerId, input.projectId, published);

    const succeeded = createCampaignExecutionTimelineEvent({
      kind: "publication_succeeded",
      correlation,
    });
    timelineEvents = input.appendTimeline(appendTimelineEvent(timelineEvents, succeeded));

    return {
      ok: true,
      publication: published,
      timelineEvents,
      message: "Campaign published successfully.",
    };
  }

  const failed: CampaignPublicationState = {
    ...publishing,
    status: "failed",
    updatedAt: new Date().toISOString(),
    failureCode: publishResult.code ?? "publication_failed",
    failureMessageSafe: publishResult.message ?? "Publication failed.",
    retryCount: publishing.retryCount,
    idempotencyKey,
  };
  persistCampaignPublication(input.peerId, input.projectId, failed);

  const failedEvent = createCampaignExecutionTimelineEvent({
    kind: "publication_failed",
    correlation,
    detail: failed.failureMessageSafe,
  });
  timelineEvents = input.appendTimeline(appendTimelineEvent(timelineEvents, failedEvent));

  return {
    ok: false,
    publication: failed,
    timelineEvents,
    message: failed.failureMessageSafe ?? "Publication failed.",
  };
}

export async function retryCampaignPublication(
  input: CampaignPublicationExecutorInput
): Promise<CampaignPublicationExecutorResult> {
  const existing = resolveExistingPublication(
    input.peerId,
    input.projectId,
    input.campaignRunId
  );
  if (!existing || existing.status !== "failed") {
    return {
      ok: false,
      publication:
        existing ??
        ({
          status: "pending",
          campaignRunId: input.campaignRunId,
          updatedAt: new Date().toISOString(),
          retryCount: 0,
          idempotencyKey: "",
        } satisfies CampaignPublicationState),
      timelineEvents: input.appendTimeline([]),
      message: "No failed publication to retry.",
    };
  }

  const retrying: CampaignPublicationState = {
    ...existing,
    status: "retrying",
    updatedAt: new Date().toISOString(),
    retryCount: existing.retryCount + 1,
  };
  persistCampaignPublication(input.peerId, input.projectId, retrying);

  return executeCampaignPublication({
    ...input,
    appendTimeline: input.appendTimeline,
  });
}

export function cachePublicationCompletion(
  peerId: string,
  idempotencyKey: string,
  result: { ok: boolean; message: string }
): void {
  const durable = loadDurableCampaignExecutionState(peerId);
  patchDurableCampaignExecutionState(peerId, {
    continuationResultsByKey: {
      ...durable.continuationResultsByKey,
      [idempotencyKey]: {
        completedAt: new Date().toISOString(),
        ok: result.ok,
        stopReason: result.ok ? "published" : "publication_failed",
        stopMessage: result.message,
        iterations: 0,
      },
    },
  });
}
