import type { BrainCapabilityId } from "../capabilities/registry";
import { listBrainCapabilities } from "../capabilities/registry";
import type { InvalidationNode } from "../invalidation/dependency-graph";
import {
  createInvalidationEvent,
  invalidationForCorrection,
  resolveInvalidationCascade,
} from "../invalidation/dependency-graph";
import type { AsyncBrainRepositories } from "./contracts";
import type { InvalidationQueueItem } from "./types";

export type InvalidationExecutionResult = {
  event: ReturnType<typeof createInvalidationEvent>;
  queueItem: InvalidationQueueItem;
  affectedCapabilities: readonly BrainCapabilityId[];
  cacheInvalidatedCount: number;
};

/** Executes invalidation graph — marks stale, invalidates cache, preserves history. */
export class BrainInvalidationService {
  constructor(private readonly repos: AsyncBrainRepositories) {}

  async executeForTrigger(input: {
    organizationId: string;
    trigger: InvalidationNode;
    reason: string;
    correlationId?: string;
    contextHash?: string;
  }): Promise<InvalidationExecutionResult> {
    const affected = resolveInvalidationCascade(input.trigger);
    const capabilityIds = new Set(listBrainCapabilities().map((c) => c.id));
    const affectedCapabilities = affected.filter((n): n is BrainCapabilityId =>
      capabilityIds.has(n as BrainCapabilityId)
    );

    for (const cap of affectedCapabilities) {
      await this.repos.dependencyStates.markStale({
        organizationId: input.organizationId,
        entityKind: "capability_output",
        entityRef: cap,
        capabilityId: cap,
        reason: input.reason,
      });
    }

    let cacheInvalidatedCount = 0;
    if (input.contextHash) {
      cacheInvalidatedCount = await this.repos.cacheMetadata.invalidateByContextHash(
        input.organizationId,
        input.contextHash,
        input.reason
      );
    }

    const queueItem = await this.repos.invalidationQueue.enqueue({
      organizationId: input.organizationId,
      status: "completed",
      sourceEvent: input.trigger,
      affectedEntity: input.trigger,
      affectedCapabilities,
      reason: input.reason,
      correlationId: input.correlationId,
      attempts: 0,
      completedAt: new Date().toISOString(),
    });

    return {
      event: createInvalidationEvent({
        organizationId: input.organizationId,
        trigger: input.trigger,
        reason: input.reason,
      }),
      queueItem,
      affectedCapabilities,
      cacheInvalidatedCount,
    };
  }

  async executeForCorrection(input: {
    organizationId: string;
    fieldKey: string;
    reason: string;
    correlationId?: string;
  }): Promise<InvalidationExecutionResult> {
    const affected = invalidationForCorrection(input.fieldKey);
    const trigger = affected[0] ?? "company_profile";
    return this.executeForTrigger({
      organizationId: input.organizationId,
      trigger,
      reason: input.reason,
      correlationId: input.correlationId,
    });
  }
}
