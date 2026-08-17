/**
 * Execution Brain Executor — performs validated operations and returns BrainResult.
 * Implements ProjectBrainContract. Never thinks, generates, validates, or learns.
 */

import type {
  BrainEvent,
  BrainInput,
  BrainOutput,
  BrainResult,
  ProjectBrainContract,
} from "../../project-engine/brain-contract";
import type { ExecutionBrainInput, ExecutionBrainOutput, ExecutionBrainPayload } from "./types";
import { ExecutionLayer } from "./execution-layer";
import { assertProviderEvidence } from "./execution-validator";
import { classifyExecutionIntegrationOutcome } from "../../approval/approved-execution-handoff";

function confidenceFromStatus(status: string): { value: number; label: "high" | "medium" | "low" } {
  if (status === "SUCCEEDED") return { value: 0.95, label: "high" };
  if (status === "PARTIALLY_SUCCEEDED" || status === "RETRYABLE") return { value: 0.55, label: "medium" };
  return { value: 0.25, label: "low" };
}

function historyEvents(output: ExecutionBrainOutput, nl: boolean): BrainEvent[] {
  return output.history.events.slice(0, 20).map((evt) => ({
    id: evt.id,
    at: evt.at,
    type: evt.type,
    title: evt.summary,
    subtitle: evt.provider ?? "execution",
    whyItMatters: nl
      ? "Uitvoering gebeurt alleen na validatie en goedkeuring."
      : "Execution only runs after validation and approval.",
  }));
}

/** Executes Execution Brain from assembled brain input. */
export class ExecutionBrainExecutor {
  constructor(private readonly layer = new ExecutionLayer()) {}

  async execute(input: ExecutionBrainInput): Promise<ExecutionBrainOutput> {
    const result = await this.layer.produceAndStore(input);
    return {
      history: result.history,
      structuredOutput: result.structuredOutput,
      outputRef: result.outputRef,
    };
  }

  async executeFromContract(
    brainInput: BrainInput<ExecutionBrainPayload>
  ): Promise<BrainResult<BrainOutput>> {
    const started = Date.now();
    const nl = brainInput.context.locale === "nl";
    const payload = brainInput.payload ?? ({} as ExecutionBrainPayload);

    if (!payload.creativeGraph) {
      return fail(started, "missing_creative_graph", nl);
    }
    if (!payload.validationGraph) {
      return fail(started, "missing_validation_graph", nl);
    }
    if (!payload.idempotencyKey?.trim()) {
      return fail(started, "missing_idempotency_key", nl);
    }

    const readiness = payload.validationGraph.report.publicationReadiness;
    if (readiness === "BLOCKED" || readiness === "CHANGES_REQUIRED") {
      return fail(started, "validation_not_ready", nl);
    }

    if (!payload.approvalGranted) {
      return fail(started, "approval_missing", nl);
    }

    const execInput: ExecutionBrainInput = {
      ...payload,
      creativeGraph: payload.creativeGraph,
      validationGraph: payload.validationGraph,
      organizationId: brainInput.context.organizationId,
      projectId: brainInput.context.projectId,
      peerId: brainInput.context.peerId,
      episodeId: brainInput.context.episodeId,
      locale: brainInput.context.locale,
      idempotencyKey: payload.idempotencyKey,
      correlationId: payload.correlationId ?? brainInput.idempotencyKey,
      initiatedBy: payload.initiatedBy ?? "project-engine",
      dryRun: payload.dryRun ?? false,
    };

    try {
      const output = await this.execute(execInput);

      for (const entry of output.history.entries) {
        if (entry.status === "SUCCEEDED") {
          const gate = assertProviderEvidence({
            status: entry.status,
            receipt: entry.receipts[0] ?? null,
          });
          if (!gate.ok) {
            return {
              brainId: "execution",
              status: "failed",
              output: null,
              events: historyEvents(output, nl),
              confidence: { value: 0.2, label: "low" },
              durationMs: Date.now() - started,
              errorCode: gate.errorCode,
              requiresApproval: false,
              approvalKind: null,
            };
          }
        }
      }

      const brainOutput: BrainOutput = {
        outputRef: output.outputRef,
        capabilityIds: ["execution"],
        decisionIds: [],
        generatedAt: output.history.createdAt,
      };

      const overall = output.history.overallStatus;
      const integrationOutcome = classifyExecutionIntegrationOutcome(output.history);
      const failed = overall === "FAILED" || overall === "CANCELLED";

      if (integrationOutcome.preparedOnly) {
        return {
          brainId: "execution",
          status: "failed",
          output: null,
          events: historyEvents(output, nl),
          confidence: { value: 0.35, label: "low" },
          durationMs: Date.now() - started,
          errorCode: "integration_not_connected",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      return {
        brainId: "execution",
        status: failed ? "failed" : "completed",
        output: failed ? null : brainOutput,
        events: historyEvents(output, nl),
        confidence: confidenceFromStatus(overall),
        durationMs: Date.now() - started,
        errorCode: failed ? "execution_failed" : overall === "RETRYABLE" ? "execution_retryable" : null,
        requiresApproval: false,
        approvalKind: null,
      };
    } catch (err) {
      const code =
        err instanceof Error && err.message.includes(":")
          ? err.message.split(":")[0]!
          : "execution_error";
      return fail(started, code, nl);
    }
  }
}

function fail(started: number, errorCode: string, nl: boolean): BrainResult<BrainOutput> {
  return {
    brainId: "execution",
    status: "failed",
    output: null,
    events: [
      {
        id: `evt-exec-fail-${errorCode}`,
        at: new Date().toISOString(),
        type: "execution_failed",
        title: nl ? "Uitvoering geblokkeerd" : "Execution blocked",
        subtitle: errorCode,
        whyItMatters: nl
          ? "Uitvoering vereist validatie en goedkeuring."
          : "Execution requires validation and approval.",
      },
    ],
    confidence: null,
    durationMs: Date.now() - started,
    errorCode,
    requiresApproval: false,
    approvalKind: null,
  };
}

export function createExecutionBrainExecutor(): ExecutionBrainExecutor {
  return new ExecutionBrainExecutor();
}

/** ProjectBrainContract — Project Engine schedules; Execution Brain acts. */
export const executionBrainContract: ProjectBrainContract<ExecutionBrainPayload, BrainOutput> = {
  id: "execution",
  capabilityIds: ["execution"],
  requiredContextSlices: ["campaign"],
  async execute(input) {
    return createExecutionBrainExecutor().executeFromContract(input);
  },
};

export async function createFromBrainInputs(
  input: ExecutionBrainInput
): Promise<ExecutionBrainOutput> {
  return createExecutionBrainExecutor().execute(input);
}
