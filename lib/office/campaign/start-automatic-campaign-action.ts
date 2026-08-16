"use server";

import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  createMarketingCampaignProject,
  type CreateMarketingCampaignProjectInput,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import { OrgContextError, requireAuthenticatedOrgContext } from "@/lib/intelligence/api/require-org-context";
import { fetchOrganizationPeerByIdServer } from "@/lib/peers/server-queries";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { emitOrchestrationDiagnostic } from "@/lib/brain/project-runtime/orchestration-diagnostics";
import { enqueueLiveStrategyRunServer } from "./live-strategy-run-execution";
import {
  assertJsonSerializable,
  serializeLiveStrategyServerResult,
} from "./live-strategy-run-serialization";
import {
  customerSafeStrategyFailureMessage,
  AUTOMATIC_CAMPAIGN_SERVER_ACTION_TIMEOUT_MS,
  type StrategyRunStatus,
} from "./strategy-run-types";
import { runWithBoundedTimeout } from "./strategy-run-timeout";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import {
  automaticBootstrapKey,
  clearAutomaticBootstrapInFlight,
  getAutomaticBootstrapInFlight,
  setAutomaticBootstrapInFlight,
} from "./automatic-campaign-bootstrap-inflight";

export type StartAutomaticCampaignActionInput = CreateMarketingCampaignProjectInput & {
  understanding?: MarketingUnderstanding | null;
  locale?: string | null;
};

export type StartAutomaticCampaignActionResult = {
  ok: boolean;
  project: MarketingProject | null;
  status: StrategyRunStatus | "episode_started";
  failureCode?: string;
  failureMessageSafe?: string;
  error?: "unauthorized" | "forbidden" | "invalid_input" | "not_found";
};

function validateAutomaticInput(input: StartAutomaticCampaignActionInput): string | null {
  if (!input.peerId?.trim()) return "peerId is required.";
  if (!input.name?.trim()) return "name is required.";
  if (!input.goalLabel?.trim()) return "goalLabel is required.";
  if (!input.description?.trim()) return "description is required.";
  if (!input.primaryGoalId?.trim()) return "primaryGoalId is required.";
  if (input.setupMode === "manual") return "manual setup cannot use automatic bootstrap.";
  return null;
}

/**
 * PX-50.1 — durable automatic campaign creation + Project Engine entry.
 *
 * Creates a server-recognizable project identity, persists brain scope, and
 * starts/resumes the canonical ProjectEpisode lifecycle.
 */
export async function startAutomaticCampaignAction(
  input: StartAutomaticCampaignActionInput
): Promise<StartAutomaticCampaignActionResult> {
  const validationError = validateAutomaticInput(input);
  if (validationError) {
    return {
      ok: false,
      status: "failed",
      project: null,
      failureCode: "invalid_input",
      error: "invalid_input",
    };
  }

  if (isDemoPeer(input.peerId)) {
    return {
      ok: false,
      status: "failed",
      project: null,
      failureCode: "demo_not_supported",
      error: "invalid_input",
    };
  }

  try {
    const auth = await requireAuthenticatedOrgContext();
    const peer = await fetchOrganizationPeerByIdServer(
      auth.supabase,
      input.peerId,
      auth.organizationId
    );

    if (!peer) {
      return {
        ok: false,
        status: "failed",
        project: null,
        failureCode: "peer_not_found",
        error: "not_found",
      };
    }

    const project = createMarketingCampaignProject({
      ...input,
      setupMode: "automatic",
      ...(input.projectId ? { projectId: input.projectId } : {}),
    });

    emitOrchestrationDiagnostic({
      event: "automatic_campaign_started",
      organizationId: auth.organizationId,
      projectId: project.id,
      peerId: input.peerId,
    });

    emitOrchestrationDiagnostic({
      event: "automatic_campaign_execution_invoked",
      organizationId: auth.organizationId,
      projectId: project.id,
      peerId: input.peerId,
      correlationId: project.id,
    });

    await prepareBrainServerPersistence({
      supabase: auth.supabase,
      organizationId: auth.organizationId,
      projectId: project.id,
    });

    const bootstrapKey = automaticBootstrapKey(auth.organizationId, project.id);
    const inflight = getAutomaticBootstrapInFlight(bootstrapKey) as
      | Promise<StartAutomaticCampaignActionResult>
      | undefined;
    if (inflight) return inflight;

    const promise = runWithBoundedTimeout(
      enqueueLiveStrategyRunServer({
        peerId: input.peerId,
        projectId: project.id,
        project,
        understanding: input.understanding ?? null,
        organizationId: auth.organizationId,
        supabase: auth.supabase,
        peerRole: peer.role,
        locale: input.locale,
      }),
      AUTOMATIC_CAMPAIGN_SERVER_ACTION_TIMEOUT_MS,
      "server_action_timeout"
    )
      .then((runResult) => {
        const payload = serializeLiveStrategyServerResult(runResult);
        const result: StartAutomaticCampaignActionResult = {
          ok: payload.ok,
          status: payload.status,
          project: payload.project,
          failureCode: payload.failureCode,
          failureMessageSafe: payload.failureMessageSafe,
        };
        assertJsonSerializable(result);
        return result;
      })
      .catch(() => ({
        ok: false,
        status: "failed" as StrategyRunStatus,
        project,
        failureCode: "execution_error",
        failureMessageSafe: customerSafeStrategyFailureMessage(undefined, input.locale),
      }))
      .finally(() => {
        clearAutomaticBootstrapInFlight(bootstrapKey);
      });

    setAutomaticBootstrapInFlight(bootstrapKey, promise);
    return promise;
  } catch (error) {
    if (error instanceof OrgContextError) {
      return {
        ok: false,
        status: "failed",
        project: null,
        failureCode: error.code,
        error: error.code,
      };
    }
    return {
      ok: false,
      status: "failed",
      project: null,
      failureCode: "execution_error",
      failureMessageSafe: customerSafeStrategyFailureMessage(undefined, input.locale),
    };
  }
}
