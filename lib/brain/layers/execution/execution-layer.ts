import { buildExecutionHistory } from "./build-execution-history";
import { lookupIdempotentExecution } from "./execution-idempotency";
import type { ExecutionProviderRegistry } from "./execution-provider-registry";
import { getDefaultExecutionProviderRegistry } from "./execution-provider-registry";
import type { ExecutionRepository } from "./execution-repository";
import { getDefaultExecutionRepository } from "./execution-repository";
import { validateExecutionInput } from "./execution-validator";
import { mapExecutionToBrainOutput } from "./map-execution-to-output";
import type { ExecutionBrainInput, ExecutionBrainOutput, ExecutionHistory } from "./types";
import type { DurablePersistencePort } from "../../persistence/layer/durable-persistence-port";
import { getActiveDurablePersistence } from "../../persistence/layer/active-durable-persistence";
import { emitPersistenceDiagnostic } from "../../persistence/layer/persistence-diagnostics";

export type ExecutionLayerResult = {
  history: ExecutionHistory;
  structuredOutput: ExecutionBrainOutput["structuredOutput"];
  outputRef: string;
};

/**
 * Execution Brain Layer — performs validated operations only.
 * Never thinks, generates, validates, learns, or writes Memory.
 */
export class ExecutionLayer {
  constructor(
    private readonly repository: ExecutionRepository = getDefaultExecutionRepository(),
    private readonly providerRegistry: ExecutionProviderRegistry = getDefaultExecutionProviderRegistry(),
    private readonly durablePort: DurablePersistencePort | null = getActiveDurablePersistence()
  ) {}

  private async resolveDurableDuplicate(input: ExecutionBrainInput): Promise<ExecutionLayerResult | null> {
    if (!this.durablePort) return null;

    const durable = await this.durablePort.lookupExecutionIdempotency({
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
    });

    if (!durable) return null;

    if (durable.status === "succeeded" && durable.executionOutputRef && durable.payload) {
      const storeRecord = durable.payload as import("./execution-repository").ExecutionStoreRecord;
      return {
        history: storeRecord.history,
        structuredOutput: mapExecutionToBrainOutput({
          history: storeRecord.history,
          campaignContext: null,
          locale: input.locale,
        }),
        outputRef: storeRecord.outputRef,
      };
    }

    if (durable.status === "executing" || durable.status === "reserved") {
      emitPersistenceDiagnostic({
        event: "execution_idempotency_conflict",
        organizationId: input.organizationId,
        projectId: input.projectId,
        idempotencyKey: input.idempotencyKey,
        message: durable.status,
      });
    }

    if (durable.status === "ambiguous") {
      emitPersistenceDiagnostic({
        event: "execution_outcome_ambiguous",
        organizationId: input.organizationId,
        projectId: input.projectId,
        idempotencyKey: input.idempotencyKey,
      });
      throw new Error("execution_outcome_ambiguous");
    }

    return null;
  }

  async buildHistory(input: ExecutionBrainInput): Promise<ExecutionHistory> {
    return buildExecutionHistory(input, this.providerRegistry);
  }

  async produceAndStore(input: ExecutionBrainInput): Promise<ExecutionLayerResult> {
    const durableDuplicate = await this.resolveDurableDuplicate(input);
    if (durableDuplicate) return durableDuplicate;

    const gate = validateExecutionInput(input);
    if (!gate.ok) {
      throw new Error(`${gate.errorCode}:${gate.reason}`);
    }

    const duplicate = lookupIdempotentExecution(this.repository, {
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
    });
    const prior = this.repository.getByIdempotencyKey({
      organizationId: input.organizationId,
      idempotencyKey: input.idempotencyKey,
    });

    if (duplicate.duplicate && prior) {
      return {
        history: prior.history,
        structuredOutput: mapExecutionToBrainOutput({
          history: prior.history,
          campaignContext: null,
          locale: input.locale,
        }),
        outputRef: prior.outputRef,
      };
    }

    if (this.durablePort) {
      await this.durablePort.reserveExecutionIdempotency({
        organizationId: input.organizationId,
        projectId: input.projectId,
        idempotencyKey: input.idempotencyKey,
      });
    }

    const history = await buildExecutionHistory(input, this.providerRegistry);
    const structuredOutput = mapExecutionToBrainOutput({
      history,
      campaignContext: null,
      locale: input.locale,
    });
    const outputRef = `execution:${input.organizationId}:${input.projectId}:${history.createdAt}`;

    const storeRecord = {
      key: {
        organizationId: input.organizationId,
        projectId: input.projectId,
        episodeId: input.episodeId,
        correlationId: input.correlationId,
      },
      history,
      outputRef,
      storedAt: new Date().toISOString(),
      idempotencyKeys: history.entries.map((e) => e.instruction.idempotencyKey),
      batchIdempotencyKey: input.idempotencyKey,
    };

    this.repository.store(storeRecord);

    if (this.durablePort) {
      await this.durablePort.confirmExecutionIdempotency({
        organizationId: input.organizationId,
        idempotencyKey: input.idempotencyKey,
        status: "succeeded",
        executionOutputRef: outputRef,
        payload: storeRecord,
      });
    }

    return { history, structuredOutput, outputRef };
  }

  getLatestHistory(input: { organizationId: string; projectId: string }): ExecutionHistory | null {
    return this.repository.getLatest(input)?.history ?? null;
  }
}

export function createExecutionLayer(
  repository?: ExecutionRepository,
  providerRegistry?: ExecutionProviderRegistry,
  durablePort?: DurablePersistencePort | null
): ExecutionLayer {
  return new ExecutionLayer(repository, providerRegistry, durablePort ?? getActiveDurablePersistence());
}

export async function collectExecutionHistory(input: ExecutionBrainInput): Promise<ExecutionHistory> {
  return buildExecutionHistory(input);
}
