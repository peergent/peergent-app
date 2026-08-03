import type { BrainRunRecord, BrainRunRepository } from "./contracts";
import { BrainRunIsolationError } from "../errors";

export class InMemoryBrainRunRepository implements BrainRunRepository {
  private runs = new Map<string, BrainRunRecord>();

  private key(organizationId: string, runId: string): string {
    return `${organizationId}:${runId}`;
  }

  create(run: BrainRunRecord): BrainRunRecord {
    this.runs.set(this.key(run.organizationId, run.id), { ...run });
    return run;
  }

  update(run: BrainRunRecord): BrainRunRecord {
    const existing = this.getById(run.organizationId, run.id);
    if (!existing) throw new Error(`Run not found: ${run.id}`);
    this.runs.set(this.key(run.organizationId, run.id), { ...run });
    return run;
  }

  getById(organizationId: string, runId: string): BrainRunRecord | null {
    return this.runs.get(this.key(organizationId, runId)) ?? null;
  }

  listByOrganization(organizationId: string): readonly BrainRunRecord[] {
    return [...this.runs.values()].filter((r) => r.organizationId === organizationId);
  }

  countByOrganization(organizationId: string): number {
    return this.listByOrganization(organizationId).length;
  }

  countChildRuns(organizationId: string, parentRunId: string): number {
    return this.listByOrganization(organizationId).filter((r) => r.parentRunId === parentRunId)
      .length;
  }
}

export function assertRunOrganizationMatch(
  run: BrainRunRecord,
  organizationId: string
): void {
  if (run.organizationId !== organizationId) {
    throw new BrainRunIsolationError(
      `Run ${run.id} belongs to ${run.organizationId}, not ${organizationId}`
    );
  }
}
