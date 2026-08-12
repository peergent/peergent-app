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

/** Authenticated smoke check — initializes Brain persistence without mutating project data. */
export async function GET() {
  const auth = await getAuthenticatedOrgContext();
  if (!isAuthContext(auth)) {
    return auth;
  }

  try {
    const mode = resolveBrainPersistenceMode();
    const runtime = await ensureServerBrainRuntime({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      mode: "supabase",
    });

    return Response.json({
      ok: true,
      persistenceMode: runtime.mode,
      durable: runtime.durable?.mode ?? null,
      organizationScoped: true,
      configuredMode: mode,
    });
  } catch (error) {
    if (
      error instanceof PersistenceConfigurationError ||
      error instanceof PersistenceInfrastructureError
    ) {
      return Response.json(
        {
          ok: false,
          code: error.code,
          message: "Brain persistence unavailable.",
        },
        { status: 503 }
      );
    }
    return Response.json({ ok: false, message: "Brain persistence check failed." }, { status: 500 });
  }
}
