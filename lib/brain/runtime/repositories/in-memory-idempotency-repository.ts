import type { BrainIdempotencyRepository } from "./contracts";
import { BrainRunIsolationError } from "../errors";

export class InMemoryBrainIdempotencyRepository implements BrainIdempotencyRepository {
  private keys = new Map<string, string>();

  private key(organizationId: string, idempotencyKey: string): string {
    return `${organizationId}:${idempotencyKey}`;
  }

  get(organizationId: string, idempotencyKey: string): string | null {
    const runId = this.keys.get(this.key(organizationId, idempotencyKey));
    return runId ?? null;
  }

  set(organizationId: string, idempotencyKey: string, runId: string): void {
    this.keys.set(this.key(organizationId, idempotencyKey), runId);
  }

  assertOrganization(organizationId: string, storedOrgPrefix: string): void {
    if (!storedOrgPrefix.startsWith(organizationId)) {
      throw new BrainRunIsolationError("Cross-tenant idempotency access denied.");
    }
  }
}
