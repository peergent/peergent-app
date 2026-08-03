import { brainFrom } from "./brain-supabase-client";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { AsyncBrainRunRepository } from "../contracts";
import { assertRunOrganizationMatch } from "../../runtime/repositories/in-memory-run-repository";
import type { BrainRunRecord } from "../../runtime/repositories/contracts";
import type { BrainCapabilityId } from "../../capabilities/registry";
import type { BrainEnvironment } from "../../domain/environment";

type BrainRunRow = {
  id: string;
  organization_id: string;
  peer_id: string | null;
  campaign_id: string | null;
  environment: string;
  capability_id: string;
  status: string;
  trace_id: string;
  parent_run_id: string | null;
  correlation_id: string | null;
  policy_decision: string | null;
  readiness_state: string | null;
  context_hash: string | null;
  snapshot_version: string | null;
  output_id: string | null;
  error_code: string | null;
  error_message: string | null;
  usage: Record<string, unknown>;
  budget: Record<string, unknown>;
  version: number;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

function mapRow(row: BrainRunRow): BrainRunRecord {
  const usage = row.usage as BrainRunRecord["usage"];
  const budget = row.budget as BrainRunRecord["budget"];
  return {
    id: row.id,
    traceId: row.trace_id,
    parentRunId: row.parent_run_id ?? undefined,
    childRunIds: [],
    organizationId: row.organization_id,
    peerId: row.peer_id ?? "",
    campaignId: row.campaign_id ?? undefined,
    environment: row.environment as BrainEnvironment,
    capabilityId: row.capability_id as BrainCapabilityId,
    status: row.status as BrainRunRecord["status"],
    usage,
    budget,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    policyDecision: row.policy_decision ?? undefined,
    readinessState: row.readiness_state ?? undefined,
    contextHash: row.context_hash ?? undefined,
    snapshotVersion: row.snapshot_version ?? undefined,
    outputId: row.output_id ?? undefined,
    errorCode: row.error_code ?? undefined,
    errorMessage: row.error_message ?? undefined,
    version: row.version,
  };
}

function mapInsert(run: BrainRunRecord): Record<string, unknown> {
  return {
    id: run.id,
    organization_id: run.organizationId,
    peer_id: run.peerId,
    campaign_id: run.campaignId ?? null,
    environment: run.environment,
    capability_id: run.capabilityId,
    status: run.status,
    trace_id: run.traceId,
    parent_run_id: run.parentRunId ?? null,
    policy_decision: run.policyDecision ?? null,
    readiness_state: run.readinessState ?? null,
    context_hash: run.contextHash ?? null,
    snapshot_version: run.snapshotVersion ?? null,
    output_id: run.outputId ?? null,
    error_code: run.errorCode ?? null,
    error_message: run.errorMessage ?? null,
    usage: run.usage,
    budget: run.budget,
    version: run.version ?? 1,
    started_at: run.startedAt,
    updated_at: run.updatedAt,
    completed_at: run.completedAt ?? null,
  };
}

export class SupabaseBrainRunRepository implements AsyncBrainRunRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async create(run: BrainRunRecord): Promise<BrainRunRecord> {
    const { data, error } = await brainFrom(this.supabase, "brain_runs")
      .insert(mapInsert(run))
      .select("*")
      .single();
    if (error) throw new Error(`Failed to create brain run: ${error.message}`);
    return mapRow(data as BrainRunRow);
  }

  async update(run: BrainRunRecord): Promise<BrainRunRecord> {
    const existing = await this.getById(run.organizationId, run.id);
    if (!existing) throw new Error(`Run not found: ${run.id}`);
    if (existing.version && run.version && run.version < existing.version) {
      throw new Error(`Optimistic concurrency conflict for run ${run.id}`);
    }
    const nextVersion = (existing.version ?? 1) + 1;
    const { data, error } = await brainFrom(this.supabase, "brain_runs")
      .update({ ...mapInsert({ ...run, version: nextVersion }), version: nextVersion })
      .eq("organization_id", run.organizationId)
      .eq("id", run.id)
      .select("*")
      .single();
    if (error) throw new Error(`Failed to update brain run: ${error.message}`);
    return mapRow(data as BrainRunRow);
  }

  async getById(organizationId: string, runId: string): Promise<BrainRunRecord | null> {
    const { data, error } = await brainFrom(this.supabase, "brain_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", runId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load brain run: ${error.message}`);
    if (!data) return null;
    const run = mapRow(data as BrainRunRow);
    assertRunOrganizationMatch(run, organizationId);
    return run;
  }

  async listByOrganization(organizationId: string): Promise<readonly BrainRunRecord[]> {
    const { data, error } = await brainFrom(this.supabase, "brain_runs")
      .select("*")
      .eq("organization_id", organizationId)
      .order("started_at", { ascending: false });
    if (error) throw new Error(`Failed to list brain runs: ${error.message}`);
    return (data as BrainRunRow[]).map(mapRow);
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const { count, error } = await brainFrom(this.supabase, "brain_runs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);
    if (error) throw new Error(`Failed to count brain runs: ${error.message}`);
    return count ?? 0;
  }

  async countChildRuns(organizationId: string, parentRunId: string): Promise<number> {
    const { count, error } = await brainFrom(this.supabase, "brain_runs")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("parent_run_id", parentRunId);
    if (error) throw new Error(`Failed to count child runs: ${error.message}`);
    return count ?? 0;
  }
}
