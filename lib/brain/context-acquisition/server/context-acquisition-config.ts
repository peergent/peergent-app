/**
 * PX-49.1 — Production context acquisition configuration (fail-closed).
 */

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { resolveBrainPersistenceMode } from "@/lib/brain/persistence/server/persistence-config";

export class ContextAcquisitionConfigurationError extends Error {
  readonly code = "context_acquisition_configuration_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "ContextAcquisitionConfigurationError";
  }
}

export class ContextAcquisitionInfrastructureError extends Error {
  readonly code = "context_acquisition_infrastructure_error" as const;

  constructor(
    message: string,
    readonly causeCode?: string
  ) {
    super(message);
    this.name = "ContextAcquisitionInfrastructureError";
  }
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Live non-demo Brain server paths require authenticated Supabase in production. */
export function assertLiveBrainServerContext(input: {
  peerId: string;
  supabase?: AppSupabaseClient | null;
}): void {
  if (isDemoPeer(input.peerId)) return;

  const requiresSupabase =
    isProductionRuntime() || resolveBrainPersistenceMode() === "supabase";

  if (requiresSupabase && !input.supabase) {
    throw new ContextAcquisitionInfrastructureError(
      "Authenticated Supabase client required for live Brain context acquisition.",
      "context_acquisition_unavailable"
    );
  }
}

/** Production Project Brain episodes must opt into real context explicitly. */
export function assertProductionEpisodeRealContext(input: {
  peerId: string;
  useRealContext?: boolean;
  supabase?: AppSupabaseClient | null;
  campaignContext?: unknown | null;
}): void {
  if (!isProductionRuntime() || isDemoPeer(input.peerId)) return;

  if (!input.useRealContext) {
    throw new ContextAcquisitionConfigurationError(
      "Production Project Brain execution requires useRealContext: true."
    );
  }

  if (!input.supabase) {
    throw new ContextAcquisitionInfrastructureError(
      "Production real context requires authenticated Supabase client.",
      "context_acquisition_unavailable"
    );
  }

  if (!input.campaignContext) {
    throw new ContextAcquisitionConfigurationError(
      "Production real context requires campaignContext."
    );
  }
}
