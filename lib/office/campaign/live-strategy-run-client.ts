"use client";

import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { runLiveStrategyAction } from "@/lib/office/campaign/live-strategy-run-action";
import {
  persistLiveStrategyRunState,
  recoverStaleLiveStrategyRun,
} from "@/lib/office/campaign/live-campaign-context-store";
import {
  shouldEnqueueLiveStrategyRun,
  type LiveStrategyRunResult,
} from "@/lib/office/campaign/live-strategy-run-service";
import {
  customerSafeStrategyFailureMessage,
  isStrategyRunStale,
  STRATEGY_CLIENT_ACTION_TIMEOUT_MS,
  STRATEGY_RUN_STALE_MS,
} from "@/lib/office/campaign/strategy-run-types";
import {
  createStrategyRunTrace,
  recordStrategyRunTrace,
  type StrategyRunTraceStage,
} from "@/lib/office/campaign/strategy-run-trace";
import { runWithBoundedTimeout } from "@/lib/office/campaign/strategy-run-timeout";
import { buildStrategyTriggerKey } from "@/lib/office/campaign/live-strategy-run-service";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import { incrementStrategyActionInvocationCount } from "@/lib/office/campaign/strategy-run-dev-stats";

export type TriggerLiveStrategyRunClientInput = {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  onProjectUpdate?: (project: MarketingProject) => void;
};

export type LiveStrategyRunClientDiagnostics = {
  traceLastStage?: StrategyRunTraceStage;
  traceStages?: StrategyRunTraceStage[];
  failureCode?: string;
};

function persistFailedStrategyRun(
  peerId: string,
  projectId: string,
  project: MarketingProject,
  failureCode: string,
  locale?: string | null,
  traceLastStage?: StrategyRunTraceStage
): MarketingProject {
  return (
    persistLiveStrategyRunState(peerId, projectId, {
      status: "failed",
      completedAt: new Date().toISOString(),
      failureCode,
      failureMessageSafe: customerSafeStrategyFailureMessage(failureCode, locale),
      traceLastStage,
    }) ?? project
  );
}

/** Recover optimistic active runs that outlived the server/client deadline. */
export function recoverStaleOptimisticStrategyRun(
  peerId: string,
  projectId: string,
  project: MarketingProject,
  locale?: string | null
): MarketingProject | null {
  const run = project.campaignSetup?.strategyRun;
  if (!isStrategyRunStale(run)) return null;
  recordStrategyRunTrace(createStrategyRunTrace(), "client_stale_optimistic_recovered");
  return recoverStaleLiveStrategyRun(peerId, projectId, {
    failureCode: "timeout",
    failureMessageSafe: customerSafeStrategyFailureMessage("timeout", locale),
  });
}

/** Client orchestration — delegates Brain execution to the server action boundary. */
export async function triggerLiveStrategyRunViaServer(
  input: TriggerLiveStrategyRunClientInput
): Promise<LiveStrategyRunResult & LiveStrategyRunClientDiagnostics> {
  const { peerId, projectId, domainInput, locale, onProjectUpdate } = input;
  const trace = createStrategyRunTrace();
  recordStrategyRunTrace(trace, "client_trigger");

  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) {
    return {
      ok: false,
      status: "failed",
      project: null,
      failureCode: "project_not_found",
      traceLastStage: trace.lastStage,
      traceStages: trace.events.map((event) => event.stage),
    };
  }

  if (!shouldEnqueueLiveStrategyRun(project, domainInput, locale)) {
    const run = project.campaignSetup?.strategyRun;
    return {
      ok: run?.status === "completed",
      status: run?.status ?? "idle",
      project,
      traceLastStage: trace.lastStage,
      traceStages: trace.events.map((event) => event.stage),
    };
  }

  const version = project.campaignSetup?.campaignContextVersion ?? 0;
  const snapshotProject = project;
  const triggerKey = buildStrategyTriggerKey({
    peerId,
    projectId,
    contextVersion: version,
    capabilityVersion: getBrainCapability("strategy").version,
  });
  const invocationCount = incrementStrategyActionInvocationCount();
  let workingProject = project;

  try {
    const optimistic =
      persistLiveStrategyRunState(peerId, projectId, {
        status: "queued",
        startedAt: new Date().toISOString(),
        contextVersion: version,
        devTriggerKey: triggerKey,
        devActionInvocationCount: invocationCount,
      }) ?? workingProject;
    workingProject = optimistic;
    recordStrategyRunTrace(trace, "client_optimistic_queued");
    onProjectUpdate?.(optimistic);

    const gathering =
      persistLiveStrategyRunState(peerId, projectId, { status: "gathering_context" }) ??
      optimistic;
    workingProject = gathering;
    recordStrategyRunTrace(trace, "client_optimistic_gathering");
    onProjectUpdate?.(gathering);

    recordStrategyRunTrace(trace, "client_request_pending");

    const actionStartedAt = Date.now();
    const actionResult = await runWithBoundedTimeout(
      runLiveStrategyAction({
        peerId,
        projectId,
        project: snapshotProject,
        understanding: domainInput.understanding ?? null,
        locale,
      }),
      STRATEGY_CLIENT_ACTION_TIMEOUT_MS,
      "client_request_timeout"
    );
    const actionDurationMs = Date.now() - actionStartedAt;

    recordStrategyRunTrace(trace, "client_received_result");

    if (actionResult.error === "unauthorized" || actionResult.error === "forbidden") {
      const failed = persistFailedStrategyRun(
        peerId,
        projectId,
        workingProject,
        actionResult.error,
        locale,
        actionResult.traceLastStage ?? trace.lastStage
      );
      onProjectUpdate?.(failed);
      return {
        ok: false,
        status: "failed",
        project: failed,
        failureCode: actionResult.error,
        failureMessageSafe: customerSafeStrategyFailureMessage(undefined, locale),
        traceLastStage: actionResult.traceLastStage ?? trace.lastStage,
        traceStages: actionResult.traceStages ?? trace.events.map((event) => event.stage),
      };
    }

    if (!actionResult.ok || actionResult.status === "failed") {
      const failed = actionResult.project
        ? actionResult.project
        : persistFailedStrategyRun(
            peerId,
            projectId,
            workingProject,
            actionResult.failureCode ?? "execution_error",
            locale,
            actionResult.traceLastStage ?? trace.lastStage
          );
      onProjectUpdate?.(failed);
      return {
        ok: false,
        status: actionResult.status,
        project: failed,
        failureCode: actionResult.failureCode,
        failureMessageSafe: actionResult.failureMessageSafe,
        provider: actionResult.provider,
        fallbackUsed: actionResult.fallbackUsed,
        runId: actionResult.runId,
        traceLastStage: actionResult.traceLastStage ?? trace.lastStage,
        traceStages: actionResult.traceStages ?? trace.events.map((event) => event.stage),
      };
    }

    if (actionResult.project) {
      const traceStage = actionResult.traceLastStage ?? trace.lastStage;
      const projectWithTrace: MarketingProject = actionResult.project.campaignSetup
        ? {
            ...actionResult.project,
            campaignSetup: {
              ...actionResult.project.campaignSetup,
              strategyRun: {
                ...actionResult.project.campaignSetup.strategyRun,
                status: actionResult.project.campaignSetup.strategyRun?.status ?? "completed",
                traceLastStage: traceStage,
                devTriggerKey: triggerKey,
                devActionInvocationCount: invocationCount,
                devActionDurationMs: actionDurationMs,
                devTerminalState: actionResult.status,
                devModel: actionResult.model,
                devInputTokens: actionResult.inputTokens,
                devOutputTokens: actionResult.outputTokens,
              },
            },
          }
        : actionResult.project;
      onProjectUpdate?.(projectWithTrace);
      recordStrategyRunTrace(trace, "client_applied_project_update");
    }

    return {
      ok: actionResult.ok,
      status: actionResult.status,
      project: actionResult.project,
      failureCode: actionResult.failureCode,
      failureMessageSafe: actionResult.failureMessageSafe,
      provider: actionResult.provider,
      fallbackUsed: actionResult.fallbackUsed,
      runId: actionResult.runId,
      traceLastStage: actionResult.traceLastStage ?? trace.lastStage,
      traceStages: actionResult.traceStages ?? trace.events.map((event) => event.stage),
    };
  } catch (error) {
    recordStrategyRunTrace(trace, "client_reconciliation_error");
    const failureCode =
      error instanceof Error && error.message === "client_request_timeout"
        ? "client_request_timeout"
        : "execution_error";
    const failed = persistFailedStrategyRun(
      peerId,
      projectId,
      workingProject,
      failureCode,
      locale,
      trace.lastStage
    );
    onProjectUpdate?.(failed);
    return {
      ok: false,
      status: "failed",
      project: failed,
      failureCode,
      failureMessageSafe: customerSafeStrategyFailureMessage(failureCode, locale),
      traceLastStage: trace.lastStage,
      traceStages: trace.events.map((event) => event.stage),
    };
  }
}

export const STRATEGY_OPTIMISTIC_DEADLINE_MS = STRATEGY_RUN_STALE_MS;
