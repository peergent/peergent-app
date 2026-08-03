import { brainFrom } from "./brain-supabase-client";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { AsyncBrainAuditRepository } from "../contracts";
import type { BrainAuditRecord } from "../../audit/record";
import type { BrainCapabilityId } from "../../capabilities/registry";
import type { BrainEnvironment } from "../../domain/environment";

type BrainAuditRow = {
  id: string;
  organization_id: string;
  run_id: string | null;
  trace_id: string;
  peer_id: string;
  campaign_id: string | null;
  environment: string;
  capability_id: string | null;
  policy_decision: string | null;
  approval_state: string | null;
  sources: unknown[];
  error_codes: unknown[];
  tool_request_ids: unknown[];
  usage_tokens: number;
  duration_ms: number;
  recorded_at: string;
};

function mapRow(row: BrainAuditRow): BrainAuditRecord {
  return {
    id: row.id,
    traceId: row.trace_id,
    organizationId: row.organization_id,
    peerId: row.peer_id,
    campaignId: row.campaign_id ?? undefined,
    environment: row.environment as BrainEnvironment,
    capabilityId: (row.capability_id as BrainCapabilityId) ?? undefined,
    sources: row.sources as BrainAuditRecord["sources"],
    policyDecision: row.policy_decision ?? undefined,
    approvalState: row.approval_state ?? undefined,
    toolRequestIds: row.tool_request_ids as string[],
    errorCodes: row.error_codes as string[],
    usageTokens: row.usage_tokens,
    durationMs: row.duration_ms,
    recordedAt: row.recorded_at,
  };
}

export class SupabaseBrainAuditRepository implements AsyncBrainAuditRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async append(record: BrainAuditRecord): Promise<BrainAuditRecord> {
    const { data, error } = await brainFrom(this.supabase, "brain_audit_events")
      .insert({
        id: record.id,
        organization_id: record.organizationId,
        trace_id: record.traceId,
        peer_id: record.peerId,
        campaign_id: record.campaignId ?? null,
        environment: record.environment,
        capability_id: record.capabilityId ?? null,
        policy_decision: record.policyDecision ?? null,
        approval_state: record.approvalState ?? null,
        sources: record.sources,
        error_codes: record.errorCodes,
        tool_request_ids: record.toolRequestIds,
        usage_tokens: record.usageTokens,
        duration_ms: record.durationMs,
        recorded_at: record.recordedAt,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Failed to append audit record: ${error.message}`);
    return mapRow(data as BrainAuditRow);
  }

  async listByTrace(organizationId: string, traceId: string): Promise<readonly BrainAuditRecord[]> {
    const { data, error } = await brainFrom(this.supabase, "brain_audit_events")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("trace_id", traceId)
      .order("recorded_at", { ascending: true });
    if (error) throw new Error(`Failed to list audit by trace: ${error.message}`);
    return (data as BrainAuditRow[]).map(mapRow);
  }

  async listByRun(organizationId: string, runId: string): Promise<readonly BrainAuditRecord[]> {
    const { data, error } = await brainFrom(this.supabase, "brain_audit_events")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("run_id", runId)
      .order("recorded_at", { ascending: true });
    if (error) throw new Error(`Failed to list audit by run: ${error.message}`);
    return (data as BrainAuditRow[]).map(mapRow);
  }
}
