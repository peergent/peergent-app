import { brainFrom } from "./brain-supabase-client";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { AsyncBrainIdempotencyRepository } from "../contracts";
import type { PersistedIdempotencyRecord } from "../types";
import type { BrainCapabilityId } from "../../capabilities/registry";

type IdempotencyRow = {
  organization_id: string;
  capability_id: string;
  idempotency_key: string;
  run_id: string;
  request_hash: string;
  expires_at: string | null;
  created_at: string;
};

function mapRow(row: IdempotencyRow): PersistedIdempotencyRecord {
  return {
    organizationId: row.organization_id,
    capabilityId: row.capability_id as BrainCapabilityId,
    idempotencyKey: row.idempotency_key,
    runId: row.run_id,
    requestHash: row.request_hash,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

export class SupabaseBrainIdempotencyRepository implements AsyncBrainIdempotencyRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async get(
    organizationId: string,
    capabilityId: BrainCapabilityId,
    idempotencyKey: string
  ): Promise<PersistedIdempotencyRecord | null> {
    const { data, error } = await brainFrom(this.supabase, "brain_idempotency_keys")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("capability_id", capabilityId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (error) throw new Error(`Failed to load idempotency record: ${error.message}`);
    return data ? mapRow(data as IdempotencyRow) : null;
  }

  async set(record: PersistedIdempotencyRecord): Promise<void> {
    const existing = await this.get(record.organizationId, record.capabilityId, record.idempotencyKey);
    if (existing && existing.requestHash !== record.requestHash) {
      throw new Error("Idempotency key reused with different request payload.");
    }
    const { error } = await brainFrom(this.supabase, "brain_idempotency_keys").upsert({
      organization_id: record.organizationId,
      capability_id: record.capabilityId,
      idempotency_key: record.idempotencyKey,
      run_id: record.runId,
      request_hash: record.requestHash,
      expires_at: record.expiresAt ?? null,
      created_at: record.createdAt,
    });
    if (error) throw new Error(`Failed to store idempotency record: ${error.message}`);
  }
}
