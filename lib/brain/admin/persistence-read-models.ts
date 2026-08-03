import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { AsyncBrainRepositories } from "../persistence/contracts";
import type { BrainRunRecord } from "../runtime/repositories/contracts";
import { classifyBrainRunRecovery } from "../persistence/run-recovery";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { buildReadinessReport } from "../context/readiness";

export type BrainRunDetailReadModel = {
  run: BrainRunRecord;
  recovery: ReturnType<typeof classifyBrainRunRecovery>;
  auditCount: number;
  hasOutput: boolean;
};

export type BrainRuntimeHealthReadModel = {
  organizationId: string;
  totalRuns: number;
  activeRuns: number;
  failedRuns: number;
  waitingForInput: number;
  waitingForApproval: number;
  checkedAt: string;
};

export type OutputLineageReadModel = {
  outputId: string;
  runId: string;
  capabilityId: BrainCapabilityId;
  capabilityVersion: string;
  freshness: string;
  supersededBy?: string;
  storedAt: string;
};

export type AdminReadAccess = {
  isAdmin: boolean;
};

function assertAdmin(access: AdminReadAccess): void {
  if (!access.isAdmin) {
    throw new Error("Admin permission required.");
  }
}

export async function getBrainRunDetail(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string,
  runId: string
): Promise<BrainRunDetailReadModel | null> {
  assertAdmin(access);
  const run = await repos.runs.getById(organizationId, runId);
  if (!run) return null;
  const audit = await repos.audit.listByRun(organizationId, runId);
  const output = await repos.outputs.getByRunId(organizationId, runId);
  return {
    run,
    recovery: classifyBrainRunRecovery(run),
    auditCount: audit.length,
    hasOutput: Boolean(output),
  };
}

export async function listBrainRuns(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string,
  filters?: {
    capabilityId?: BrainCapabilityId;
    status?: BrainRunRecord["status"];
  }
): Promise<readonly BrainRunRecord[]> {
  assertAdmin(access);
  let runs = await repos.runs.listByOrganization(organizationId);
  if (filters?.capabilityId) {
    runs = runs.filter((r) => r.capabilityId === filters.capabilityId);
  }
  if (filters?.status) {
    runs = runs.filter((r) => r.status === filters.status);
  }
  return [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getBrainRuntimeHealth(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string
): Promise<BrainRuntimeHealthReadModel> {
  assertAdmin(access);
  const runs = await repos.runs.listByOrganization(organizationId);
  return {
    organizationId,
    totalRuns: runs.length,
    activeRuns: runs.filter((r) => r.status === "running" || r.status === "queued").length,
    failedRuns: runs.filter((r) => r.status === "failed").length,
    waitingForInput: runs.filter((r) => r.status === "waiting_for_input").length,
    waitingForApproval: runs.filter((r) => r.status === "waiting_for_approval").length,
    checkedAt: new Date().toISOString(),
  };
}

export async function getCapabilityHealth(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string,
  capabilityId: BrainCapabilityId
): Promise<{
  capabilityId: BrainCapabilityId;
  version: string;
  latestOutputFreshness: string;
  staleDependencies: number;
}> {
  assertAdmin(access);
  const def = getBrainCapability(capabilityId);
  const latest = await repos.outputs.getLatestCompatible({
    organizationId,
    capabilityId,
    capabilityVersion: def.version,
    freshness: "any",
  });
  const staleDeps = await repos.dependencyStates.listByOrganization(organizationId, "stale");
  return {
    capabilityId,
    version: def.version,
    latestOutputFreshness: latest?.freshness ?? "unknown",
    staleDependencies: staleDeps.filter((d) => d.capabilityId === capabilityId).length,
  };
}

export async function getCompanyReadiness(
  assembly: ContextAssemblyResult
): Promise<ReturnType<typeof buildReadinessReport>> {
  return assembly.readiness;
}

export async function getWebsiteFreshness(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string
): Promise<{ freshness: string; snapshotVersion?: number }> {
  assertAdmin(access);
  const latest = await repos.snapshots.getLatest(organizationId, "website");
  return {
    freshness: latest?.freshness ?? "unknown",
    snapshotVersion: latest?.versionNumber,
  };
}

export async function listInvalidations(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string
): Promise<Awaited<ReturnType<AsyncBrainRepositories["invalidationQueue"]["listPending"]>>> {
  assertAdmin(access);
  return repos.invalidationQueue.listPending(organizationId);
}

export async function listMemoryCandidates(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string
) {
  assertAdmin(access);
  return repos.memoryCandidates.listByOrganization(organizationId);
}

export async function getPersistentOutputLineage(
  repos: AsyncBrainRepositories,
  access: AdminReadAccess,
  organizationId: string,
  outputId: string
): Promise<OutputLineageReadModel | null> {
  assertAdmin(access);
  const record = await repos.outputs.getRecordById(organizationId, outputId);
  if (!record) return null;
  return {
    outputId: record.id,
    runId: record.runId,
    capabilityId: record.capabilityId,
    capabilityVersion: record.capabilityVersion,
    freshness: record.freshness,
    supersededBy: record.supersededBy,
    storedAt: record.storedAt,
  };
}

/** Customer-safe read — no provider, audit, or usage details. */
export function toCustomerSafeRunSummary(run: BrainRunRecord): {
  status: BrainRunRecord["status"];
  capabilityId: BrainCapabilityId;
  completedAt?: string;
} {
  return {
    status: run.status,
    capabilityId: run.capabilityId,
    completedAt: run.completedAt,
  };
}
