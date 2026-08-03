import type { BrainRun } from "../run-lifecycle";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { BrainAuditRecord } from "../../audit/record";

export type BrainRunRecord = BrainRun & {
  readonly policyDecision?: string;
  readonly readinessState?: string;
  readonly contextHash?: string;
  readonly snapshotVersion?: string;
  readonly outputId?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly version?: number;
};

export interface BrainRunRepository {
  create(run: BrainRunRecord): BrainRunRecord;
  update(run: BrainRunRecord): BrainRunRecord;
  getById(organizationId: string, runId: string): BrainRunRecord | null;
  listByOrganization(organizationId: string): readonly BrainRunRecord[];
  countByOrganization(organizationId: string): number;
  countChildRuns(organizationId: string, parentRunId: string): number;
}

export interface BrainOutputRepository {
  store(input: {
    organizationId: string;
    runId: string;
    output: BrainStructuredOutput;
    storedAt: string;
  }): string;
  getByRunId(organizationId: string, runId: string): BrainStructuredOutput | null;
}

export interface BrainAuditRepository {
  append(record: BrainAuditRecord): BrainAuditRecord;
  listByTrace(organizationId: string, traceId: string): readonly BrainAuditRecord[];
  listByRun(organizationId: string, runId: string): readonly BrainAuditRecord[];
}

export interface BrainIdempotencyRepository {
  get(organizationId: string, idempotencyKey: string): string | null;
  set(organizationId: string, idempotencyKey: string, runId: string): void;
}
