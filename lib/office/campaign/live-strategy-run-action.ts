"use server";

import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import {
  enqueueLiveStrategyRunServer,
  type LiveStrategyRunServerResult,
} from "./live-strategy-run-execution";
import {
  assertJsonSerializable,
  serializeLiveStrategyServerResult,
  serializeRunLiveStrategyActionResult,
} from "./live-strategy-run-serialization";
import {
  customerSafeStrategyFailureMessage,
  STRATEGY_SERVER_ACTION_TIMEOUT_MS,
  type StrategyRunStatus,
} from "./strategy-run-types";
import {
  createStrategyRunTrace,
  recordStrategyRunTrace,
  toDevTracePayload,
  type StrategyRunTraceStage,
} from "./strategy-run-trace";
import { runWithBoundedTimeout } from "./strategy-run-timeout";
import { patchProjectStrategyRunState } from "./live-strategy-run-project-patch";
import { finishStrategyRunTiming, markStrategyRunTiming } from "./strategy-run-timing";

export type RunLiveStrategyActionInput = {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  understanding: MarketingUnderstanding | null;
  locale?: string | null;
};

export type RunLiveStrategyActionResult = {
  ok: boolean;
  status: StrategyRunStatus;
  project: MarketingProject | null;
  failureCode?: string;
  failureMessageSafe?: string;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  fallbackUsed?: boolean;
  runId?: string;
  error?: "unauthorized" | "forbidden" | "not_found" | "invalid_input";
  traceLastStage?: StrategyRunTraceStage;
  traceStages?: StrategyRunTraceStage[];
};

function toActionResult(
  result: LiveStrategyRunServerResult,
  trace: ReturnType<typeof createStrategyRunTrace>
): RunLiveStrategyActionResult {
  const payload = serializeLiveStrategyServerResult(result);
  const tracePayload = toDevTracePayload(trace);
  return {
    ok: payload.ok,
    status: payload.status,
    project: payload.project,
    failureCode: payload.failureCode,
    failureMessageSafe: payload.failureMessageSafe,
    provider: payload.provider,
    model: payload.model,
    inputTokens: payload.inputTokens,
    outputTokens: payload.outputTokens,
    fallbackUsed: payload.fallbackUsed,
    runId: payload.runId,
    traceLastStage: tracePayload.lastStage,
    traceStages: tracePayload.stages,
  };
}

function failedProjectPatch(
  project: MarketingProject,
  failureCode: string,
  locale?: string | null
): MarketingProject {
  return patchProjectStrategyRunState(project, {
    status: "failed",
    completedAt: new Date().toISOString(),
    failureCode,
    failureMessageSafe: customerSafeStrategyFailureMessage(failureCode, locale),
  });
}

function validateProjectInput(input: RunLiveStrategyActionInput): string | null {
  if (!input.peerId?.trim()) return "peerId is required.";
  if (!input.projectId?.trim()) return "projectId is required.";
  if (!input.project) return "project is required.";
  if (input.project.id !== input.projectId) return "projectId mismatch.";
  if (input.project.peerId && input.project.peerId !== input.peerId) {
    return "project peerId mismatch.";
  }
  if (!input.project.campaignSetup) return "campaign setup is required.";
  return null;
}

/** Server boundary for live strategy Brain execution — never runs in the browser. */
export async function runLiveStrategyAction(
  input: RunLiveStrategyActionInput
): Promise<RunLiveStrategyActionResult> {
  const trace = createStrategyRunTrace();
  const timingKey =
    input.project.campaignSetup?.strategyRun?.runId ??
    `${input.peerId}:${input.projectId}:${input.project.campaignSetup?.campaignContextVersion ?? 0}`;
  markStrategyRunTiming(timingKey, "ACTION_ENTER");
  recordStrategyRunTrace(trace, "server_action_entered");

  try {
    const validationError = validateProjectInput(input);
    if (validationError) {
      return serializeRunLiveStrategyActionResult({
        ok: false,
        status: "failed",
        project: null,
        failureCode: "invalid_input",
        error: "invalid_input",
        traceLastStage: trace.lastStage,
        traceStages: trace.events.map((event) => event.stage),
      });
    }

    if (isDemoPeer(input.peerId)) {
      return serializeRunLiveStrategyActionResult({
        ok: false,
        status: "failed",
        project: input.project,
        failureCode: "demo_not_supported",
        error: "invalid_input",
        traceLastStage: trace.lastStage,
        traceStages: trace.events.map((event) => event.stage),
      });
    }

    const auth = await requireAuthenticatedOrgContext();
    recordStrategyRunTrace(trace, "server_auth_completed");

    const peer = await fetchOrganizationPeerByIdServer(
      auth.supabase,
      input.peerId,
      auth.organizationId
    );

    if (!peer) {
      return serializeRunLiveStrategyActionResult({
        ok: false,
        status: "failed",
        project: failedProjectPatch(input.project, "peer_not_found", input.locale),
        failureCode: "peer_not_found",
        error: "not_found",
        traceLastStage: trace.lastStage,
        traceStages: trace.events.map((event) => event.stage),
      });
    }

    recordStrategyRunTrace(trace, "server_domain_input_built");
    recordStrategyRunTrace(trace, "server_run_enqueued");

    const result = await runWithBoundedTimeout(
      enqueueLiveStrategyRunServer({
        peerId: input.peerId,
        projectId: input.projectId,
        project: input.project,
        understanding: input.understanding,
        organizationId: auth.organizationId,
        locale: input.locale,
        trace,
      }),
      STRATEGY_SERVER_ACTION_TIMEOUT_MS,
      "server_action_timeout"
    );

    recordStrategyRunTrace(trace, "server_project_patch_produced");
    recordStrategyRunTrace(trace, "server_action_returned");
    markStrategyRunTiming(timingKey, "ACTION_RETURNED", result.status);
    finishStrategyRunTiming(timingKey, result.status);

    const actionResult = toActionResult(result, trace);
    assertJsonSerializable(actionResult);
    return serializeRunLiveStrategyActionResult(actionResult);
  } catch (error) {
    if (error instanceof OrgContextError) {
      return serializeRunLiveStrategyActionResult({
        ok: false,
        status: "failed",
        project: null,
        failureCode: error.code,
        error: error.code,
        traceLastStage: trace.lastStage,
        traceStages: trace.events.map((event) => event.stage),
      });
    }

    const isServerTimeout =
      error instanceof Error && error.message === "server_action_timeout";
    if (isServerTimeout) {
      recordStrategyRunTrace(trace, "server_action_timeout");
      const failedProject = failedProjectPatch(
        input.project,
        "server_action_timeout",
        input.locale
      );
      return serializeRunLiveStrategyActionResult({
        ok: false,
        status: "failed",
        project: failedProject,
        failureCode: "server_action_timeout",
        failureMessageSafe: customerSafeStrategyFailureMessage(
          "server_action_timeout",
          input.locale
        ),
        traceLastStage: trace.lastStage,
        traceStages: trace.events.map((event) => event.stage),
      });
    }

    recordStrategyRunTrace(trace, "server_serialization_error", "execution_error");
    return serializeRunLiveStrategyActionResult({
      ok: false,
      status: "failed",
      project: failedProjectPatch(input.project, "execution_error", input.locale),
      failureCode: "execution_error",
      failureMessageSafe: customerSafeStrategyFailureMessage(undefined, input.locale),
      traceLastStage: trace.lastStage,
      traceStages: trace.events.map((event) => event.stage),
    });
  }
}
