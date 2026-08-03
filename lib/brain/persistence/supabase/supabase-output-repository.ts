import { brainFrom } from "./brain-supabase-client";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { AsyncBrainOutputRepository } from "../contracts";
import type { BrainStructuredOutput } from "../../evidence/structured-output";
import type { BrainCapabilityId } from "../../capabilities/registry";
import type { PersistedBrainOutputRecord } from "../types";

type BrainOutputRow = {
  id: string;
  organization_id: string;
  run_id: string;
  capability_id: string;
  capability_version: string;
  provider_class: string;
  output_schema_version: string;
  content_hash: string;
  context_hash: string | null;
  snapshot_version: string | null;
  freshness: string;
  superseded_by: string | null;
  output: BrainStructuredOutput;
  stored_at: string;
  metadata: Record<string, unknown>;
};

function mapRow(row: BrainOutputRow): PersistedBrainOutputRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    runId: row.run_id,
    capabilityId: row.capability_id as BrainCapabilityId,
    capabilityVersion: row.capability_version,
    providerClass: row.provider_class,
    outputSchemaVersion: row.output_schema_version,
    contentHash: row.content_hash,
    contextHash: row.context_hash ?? undefined,
    snapshotVersion: row.snapshot_version ?? undefined,
    freshness: row.freshness as PersistedBrainOutputRecord["freshness"],
    supersededBy: row.superseded_by ?? undefined,
    output: row.output,
    storedAt: row.stored_at,
    campaignId: typeof row.metadata?.campaign_id === "string" ? row.metadata.campaign_id : undefined,
  };
}

export class SupabaseBrainOutputRepository implements AsyncBrainOutputRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async store(input: {
    organizationId: string;
    runId: string;
    output: BrainStructuredOutput;
    storedAt: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    providerClass?: string;
    contentHash: string;
    contextHash?: string;
    snapshotVersion?: string;
    campaignId?: string;
  }): Promise<string> {
    const { data, error } = await brainFrom(this.supabase, "brain_outputs")
      .insert({
        organization_id: input.organizationId,
        run_id: input.runId,
        capability_id: input.capabilityId,
        capability_version: input.capabilityVersion,
        provider_class: input.providerClass ?? "deterministic",
        content_hash: input.contentHash,
        context_hash: input.contextHash ?? null,
        snapshot_version: input.snapshotVersion ?? null,
        output: input.output,
        stored_at: input.storedAt,
        metadata: input.campaignId ? { campaign_id: input.campaignId } : {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to store brain output: ${error.message}`);
    return (data as { id: string }).id;
  }

  async getByRunId(organizationId: string, runId: string): Promise<BrainStructuredOutput | null> {
    const { data, error } = await brainFrom(this.supabase, "brain_outputs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("run_id", runId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load brain output: ${error.message}`);
    return data ? (data as BrainOutputRow).output : null;
  }

  async getRecordById(organizationId: string, outputId: string): Promise<PersistedBrainOutputRecord | null> {
    const { data, error } = await brainFrom(this.supabase, "brain_outputs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", outputId)
      .maybeSingle();
    if (error) throw new Error(`Failed to load output record: ${error.message}`);
    return data ? mapRow(data as BrainOutputRow) : null;
  }

  async getLatestCompatible(input: {
    organizationId: string;
    capabilityId: BrainCapabilityId;
    capabilityVersion: string;
    campaignId?: string;
    freshness?: "fresh" | "any";
  }): Promise<PersistedBrainOutputRecord | null> {
    let query = brainFrom(this.supabase, "brain_outputs")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("capability_id", input.capabilityId)
      .eq("capability_version", input.capabilityVersion)
      .order("stored_at", { ascending: false })
      .limit(1);
    if (input.freshness === "fresh") {
      query = query.eq("freshness", "fresh");
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(`Failed to resolve latest output: ${error.message}`);
    if (!data) return null;
    const record = mapRow(data as BrainOutputRow);
    if (input.campaignId && record.campaignId !== input.campaignId) return null;
    return record;
  }

  async markSuperseded(organizationId: string, outputId: string, supersededBy: string): Promise<void> {
    const { error } = await brainFrom(this.supabase, "brain_outputs")
      .update({ freshness: "superseded", superseded_by: supersededBy })
      .eq("organization_id", organizationId)
      .eq("id", outputId);
    if (error) throw new Error(`Failed to supersede output: ${error.message}`);
  }
}
