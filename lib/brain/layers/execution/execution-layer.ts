import { buildExecutionHistory } from "./build-execution-history";
import { lookupIdempotentExecution } from "./execution-idempotency";
import type { ExecutionProviderRegistry } from "./execution-provider-registry";
import { getDefaultExecutionProviderRegistry } from "./execution-provider-registry";
import type { ExecutionRepository } from "./execution-repository";
import { getDefaultExecutionRepository } from "./execution-repository";
import { validateExecutionInput } from "./execution-validator";
import { mapExecutionToBrainOutput } from "./map-execution-to-output";
import type { ExecutionBrainInput, ExecutionBrainOutput, ExecutionHistory } from "./types";

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
    private readonly providerRegistry: ExecutionProviderRegistry = getDefaultExecutionProviderRegistry()
  ) {}

  async buildHistory(input: ExecutionBrainInput): Promise<ExecutionHistory> {
    return buildExecutionHistory(input, this.providerRegistry);
  }

  async produceAndStore(input: ExecutionBrainInput): Promise<ExecutionLayerResult> {
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

    const history = await buildExecutionHistory(input, this.providerRegistry);
    const structuredOutput = mapExecutionToBrainOutput({
      history,
      campaignContext: null,
      locale: input.locale,
    });
    const outputRef = `execution:${input.organizationId}:${input.projectId}:${history.createdAt}`;

    this.repository.store({
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
    });

    return { history, structuredOutput, outputRef };
  }

  getLatestHistory(input: { organizationId: string; projectId: string }): ExecutionHistory | null {
    return this.repository.getLatest(input)?.history ?? null;
  }
}

export function createExecutionLayer(
  repository?: ExecutionRepository,
  providerRegistry?: ExecutionProviderRegistry
): ExecutionLayer {
  return new ExecutionLayer(repository, providerRegistry);
}

export async function collectExecutionHistory(input: ExecutionBrainInput): Promise<ExecutionHistory> {
  return buildExecutionHistory(input);
}
