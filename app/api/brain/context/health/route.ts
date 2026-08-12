import {
  getAuthenticatedOrgContext,
  isAuthContext,
} from "@/lib/intelligence/api/org-context";
import { ensureServerBrainRuntime } from "@/lib/brain/persistence/server/ensure-server-brain-runtime";
import {
  PersistenceConfigurationError,
  PersistenceInfrastructureError,
  resolveBrainPersistenceMode,
} from "@/lib/brain/persistence/server/persistence-config";
import { prepareBrainServerContext } from "@/lib/brain/context-acquisition/server/prepare-brain-server-context";
import {
  ContextAcquisitionConfigurationError,
  ContextAcquisitionInfrastructureError,
} from "@/lib/brain/context-acquisition/server/context-acquisition-config";

/** Authenticated smoke check — acquires minimal real context metadata without exposing contents. */
export async function GET() {
  const auth = await getAuthenticatedOrgContext();
  if (!isAuthContext(auth)) {
    return auth;
  }

  try {
    const mode = resolveBrainPersistenceMode();
    await ensureServerBrainRuntime({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      mode: "supabase",
    });

    const prepared = await prepareBrainServerContext({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      peerId: "health-check",
      peerRole: "Marketing",
      locale: "en",
    });

    const sourceCount = Object.keys(prepared.package.diagnostics.adapterOutcomes).length;

    return Response.json({
      ok: true,
      contextAcquisition: prepared.package.contextReady ? "ready" : "gaps_present",
      organizationScoped: true,
      realContext: true,
      configuredMode: mode,
      sourceCount,
      itemCount: prepared.package.items.length,
      gapCount: prepared.package.acquisitionGaps.length,
      blockingGapCount: prepared.package.diagnostics.blockingGapCount,
      durationMs: prepared.package.diagnostics.durationMs,
    });
  } catch (error) {
    if (
      error instanceof PersistenceConfigurationError ||
      error instanceof PersistenceInfrastructureError ||
      error instanceof ContextAcquisitionConfigurationError ||
      error instanceof ContextAcquisitionInfrastructureError
    ) {
      return Response.json(
        {
          ok: false,
          code: error.code,
          message: "Brain context acquisition unavailable.",
        },
        { status: 503 }
      );
    }
    return Response.json(
      { ok: false, message: "Brain context health check failed." },
      { status: 500 }
    );
  }
}
