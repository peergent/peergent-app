import type { BrainOutputRepository } from "./contracts";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import { BrainRunIsolationError } from "../errors";

type StoredOutput = {
  organizationId: string;
  runId: string;
  output: BrainStructuredOutput;
  storedAt: string;
};

export class InMemoryBrainOutputRepository implements BrainOutputRepository {
  private outputs = new Map<string, StoredOutput>();

  private key(organizationId: string, runId: string): string {
    return `${organizationId}:${runId}`;
  }

  store(input: {
    organizationId: string;
    runId: string;
    output: BrainStructuredOutput;
    storedAt: string;
  }): string {
    const outputId = `out-${input.runId}`;
    this.outputs.set(this.key(input.organizationId, input.runId), {
      organizationId: input.organizationId,
      runId: input.runId,
      output: input.output,
      storedAt: input.storedAt,
    });
    return outputId;
  }

  getByRunId(organizationId: string, runId: string): BrainStructuredOutput | null {
    const entry = this.outputs.get(this.key(organizationId, runId));
    if (!entry) return null;
    if (entry.organizationId !== organizationId) {
      throw new BrainRunIsolationError("Cross-tenant output access denied.");
    }
    return entry.output;
  }
}
