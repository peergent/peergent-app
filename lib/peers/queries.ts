"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PeerRow } from "@/lib/peer-display";
import type { Database } from "@/lib/supabase/database.types";

type AppSupabaseClient = SupabaseClient<Database>;

export async function fetchOrganizationPeers(
  supabase: AppSupabaseClient,
  organizationId: string | null | undefined
): Promise<PeerRow[]> {
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from("peers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as PeerRow[];
}

export async function fetchOrganizationPeerById(
  supabase: AppSupabaseClient,
  peerId: string,
  organizationId: string | null | undefined
): Promise<PeerRow | null> {
  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from("peers")
    .select("*")
    .eq("id", peerId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as PeerRow | null) ?? null;
}

export function withOrganizationId<T extends Record<string, unknown>>(
  payload: T,
  organizationId: string | null | undefined
): T & { organization_id: string } {
  if (!organizationId) {
    throw new Error("An active organization is required to create peers.");
  }

  return {
    ...payload,
    organization_id: organizationId,
  };
}
