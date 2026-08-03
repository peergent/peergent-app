import type { BrainAuditRepository } from "./contracts";
import type { BrainAuditRecord } from "../../audit/record";
import { BrainRunIsolationError } from "../errors";

export class InMemoryBrainAuditRepository implements BrainAuditRepository {
  private records: BrainAuditRecord[] = [];

  append(record: BrainAuditRecord): BrainAuditRecord {
    this.records.push({ ...record });
    return record;
  }

  listByTrace(organizationId: string, traceId: string): readonly BrainAuditRecord[] {
    return this.records.filter(
      (r) => r.organizationId === organizationId && r.traceId === traceId
    );
  }

  listByRun(organizationId: string, runId: string): readonly BrainAuditRecord[] {
    return this.records.filter(
      (r) => r.organizationId === organizationId && r.id.startsWith(`audit-${runId}`)
    );
  }

  assertOrganization(record: BrainAuditRecord, organizationId: string): void {
    if (record.organizationId !== organizationId) {
      throw new BrainRunIsolationError("Cross-tenant audit access denied.");
    }
  }
}
