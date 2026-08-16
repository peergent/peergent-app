import "server-only";

import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { startOrResumeCampaignEpisode } from "@/lib/brain/project-runtime/campaign-episode-controller";
import { createBrainRepositoriesForServer } from "@/lib/brain/persistence/repository-factory-server";
import { prepareBrainServerPersistence } from "@/lib/brain/persistence/server/prepare-brain-server-persistence";
import { prepareBrainServerContext } from "@/lib/brain/context-acquisition/server/prepare-brain-server-context";
import { assertLiveBrainServerContext } from "@/lib/brain/context-acquisition/server/context-acquisition-config";
import { getBrainCapability } from "@/lib/brain/capabilities/registry";
import type { BrainRunResult } from "@/lib/brain/runtime/run-result";
import { presentBrainOutputForCampaign } from "@/lib/brain/presentation/campaign-evidence-adapter";
import { isDemoPeer } from "@/lib/office/demo/demo-company";
import { buildCampaignContext } from "./campaign-context";
import { resolveDurableOrganizationNameServer } from "./resolve-organization-name-server";
import { evidenceBlocksWorkflowAdvance } from "./evidence-readiness";
import {
  applyProjectStrategyRunSuccess,
  patchProjectStrategyRunState,
} from "./live-strategy-run-project-patch";
import {
  shouldExecuteStrategyOnServer,
  strategyOutputCurrent,
  usesProjectEngineLifecycleAuthority,
  type LiveStrategyRunResult,
} from "./live-strategy-run-service";
import {
  buildStrategyIdempotencyKey,
  customerSafeStrategyFailureMessage,
  isStrategyRunStale,
  mapProgressLabelToRunStatus,
  STRATEGY_RUN_TIMEOUT_MS,
  type StrategyRunState,
  type StrategyRunStatus,
} from "./strategy-run-types";
import { evaluateStrategyContextReadiness } from "./strategy-context-readiness";
import {
  createStrategyRunTrace,
  recordStrategyRunTrace,
  type StrategyRunTrace,
} from "./strategy-run-trace";
import { runWithBoundedTimeout } from "./strategy-run-timeout";
import {
  continueCampaignEpisode,
  shouldAutoContinueCampaignEpisode,
} from "@/lib/brain/project-runtime/campaign-episode-continuation";
import {
  EPISODE_CONTINUATION_TIMEOUT_MS,
} from "./strategy-run-types";
import {
  isTerminalStrategyRunStatus,
  markStrategyRunTiming,
  startStrategyRunTiming,
} from "./strategy-run-timing";
import { logBrainServerEnvResolved } from "@/lib/brain/config/brain-server-env";
import { markOfficeLlmTrace } from "@/lib/brain/integration/office-llm-trace";

export type LiveStrategyRunServerInput = {
  peerId: string;
  projectId: string;
  project: MarketingProject;
  understanding: MarketingUnderstanding | null;
  organizationId: string;
  supabase?: AppSupabaseClient;
  peerRole?: string;
  locale?: string | null;
  trace?: StrategyRunTrace;
};

export type LiveStrategyRunServerResult = LiveStrategyRunResult & {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
};

type EnqueueServerInput = LiveStrategyRunServerInput;

const inFlightByKey = new Map<string, Promise<LiveStrategyRunServerResult>>();

function contextVersion(project: MarketingProject): number {
  return project.campaignSetup?.campaignContextVersion ?? 0;
}

export function buildDomainInputForStrategyRun(
  input: LiveStrategyRunServerInput
): MarketingPeerDomainInput {
  const { project, peerId, organizationId, understanding } = input;
  return {
    peerId,
    organizationId,
    userName: "",
    peerName: "",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [project],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

function runTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return runWithBoundedTimeout(promise, ms, "strategy_run_timeout");
}

function resolveTrace(input: EnqueueServerInput): StrategyRunTrace {
  return input.trace ?? createStrategyRunTrace();
}

function usageFromBrainResult(brainResult: BrainRunResult): {
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  fallbackUsed?: boolean;
  initialProvider?: string;
  finalProvider?: string;
  fallbackReason?: string;
} {
  const { providerId, modelId, inputTokens, outputTokens, initialProviderId, finalProviderId, fallbackReason } =
    brainResult.run.usage;
  const finalProvider = finalProviderId ?? providerId;
  const initialProvider = initialProviderId ?? providerId;
  return {
    provider: finalProvider,
    model: modelId,
    inputTokens,
    outputTokens,
    initialProvider,
    finalProvider,
    fallbackReason,
    fallbackUsed: Boolean(
      fallbackReason || (initialProvider === "llm" && finalProvider !== "llm")
    ),
  };
}

function recoverStaleProjectInMemory(
  project: MarketingProject,
  locale?: string | null
): MarketingProject {
  return patchProjectStrategyRunState(project, {
    status: "failed",
    completedAt: new Date().toISOString(),
    failureCode: "timeout",
    failureMessageSafe: customerSafeStrategyFailureMessage("timeout", locale),
  });
}

async function executeLiveStrategyRunServer(
  input: EnqueueServerInput
): Promise<LiveStrategyRunServerResult> {
  const { peerId, projectId, locale } = input;
  const trace = resolveTrace(input);
  let project = input.project;
  const domainInput = buildDomainInputForStrategyRun(input);
  const version = contextVersion(project);
  const idempotencyKey = buildStrategyIdempotencyKey({
    peerId,
    projectId,
    contextVersion: version,
    capabilityVersion: getBrainCapability("strategy").version,
  });

  const existingRun = project.campaignSetup?.strategyRun;
  if (
    existingRun?.idempotencyKey === idempotencyKey &&
    existingRun.status === "completed" &&
    strategyOutputCurrent(project)
  ) {
    return { ok: true, status: "completed", project };
  }

  if (isStrategyRunStale(existingRun)) {
    project = recoverStaleProjectInMemory(project, locale);
  }

  const runId = `strategy-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();

  project = patchProjectStrategyRunState(project, {
    status: "queued",
    runId,
    startedAt,
    contextVersion: version,
    idempotencyKey,
    stageLabel: undefined,
    failureCode: undefined,
    failureMessageSafe: undefined,
    completedAt: undefined,
    provider: undefined,
    fallbackUsed: undefined,
  });

  const persistStage = (patch: Partial<StrategyRunState>) => {
    project = patchProjectStrategyRunState(project, patch);
  };

  persistStage({ status: "gathering_context" });
  recordStrategyRunTrace(trace, "server_context_gathering_started");

  assertLiveBrainServerContext({ peerId, supabase: input.supabase ?? null });

  if (input.supabase) {
    await prepareBrainServerPersistence({
      supabase: input.supabase,
      organizationId: input.organizationId,
      projectId: input.projectId,
    });
  }

  const organizationName = await resolveDurableOrganizationNameServer(
    input.supabase,
    input.organizationId
  );

  const campaignContext = buildCampaignContext({
    project,
    domainInput,
    locale,
    organizationName,
    organizationId: input.organizationId,
  });

  const contextPrep = input.supabase
    ? await prepareBrainServerContext({
        supabase: input.supabase,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId,
        peerRole: input.peerRole ?? "Marketing",
        campaignContext,
        locale: locale === "nl" ? "nl" : "en",
        phase: "strategy",
      })
    : null;

  const serverRepositories = createBrainRepositoriesForServer({
    environment: "live",
    peerId,
    supabase: input.supabase ?? null,
  });
  const env = logBrainServerEnvResolved("executeLiveStrategyRunServer");
  markOfficeLlmTrace("SERVER_ENV_RESOLVED", {
    featureFlagEnabled: env.featureFlagEnabled,
    apiKeyPresent: env.apiKeyPresent,
    model: env.resolvedModel,
  });
  markOfficeLlmTrace("PROVIDERS_CREATED", {
    providerIds: serverRepositories.providers.map((provider) => provider.id).join(","),
    llmRegistered: serverRepositories.providers.some((provider) => provider.id === "llm"),
  });

  markStrategyRunTiming(runId, "BRAIN_ENTER");

  try {
    const episodeResult = await runTimeout(
      startOrResumeCampaignEpisode({
        supabase: input.supabase!,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId,
        peerRole: input.peerRole ?? "Marketing",
        campaignContext,
        project,
        domainInput,
        locale: locale === "nl" ? "nl" : "en",
        target: { targetBrain: "strategy" },
        repositories: serverRepositories,
        contextAssembly: contextPrep?.assembly,
        onProgress: (label) => {
          const status = mapProgressLabelToRunStatus(label);
          persistStage({ status, stageLabel: label });
        },
      }),
      STRATEGY_RUN_TIMEOUT_MS
    );

    recordStrategyRunTrace(trace, "server_context_gathering_completed");

    if (episodeResult.status === "waiting_for_context") {
      const failureMessageSafe = customerSafeStrategyFailureMessage("waiting_for_input", locale);
      persistStage({
        status: "waiting_for_input",
        completedAt: new Date().toISOString(),
        failureCode: "waiting_for_input",
        failureMessageSafe,
      });
      return {
        ok: false,
        status: "waiting_for_input",
        project,
        failureCode: "waiting_for_input",
        failureMessageSafe,
        runId,
      };
    }

    if (episodeResult.status === "waiting_for_approval") {
      const approvalMode =
        project.campaignSetup?.approvalMode ?? "approval_before_publication";
      const isGuidedCheckpoint =
        approvalMode === "approval_before_generation" ||
        approvalMode === "blocked_manual_only";
      const brainResult = episodeResult.strategyCapabilityRun ?? null;
      const hasStrategyOutput = Boolean(
        brainResult?.output?.findings?.length || brainResult?.run.status === "completed"
      );

      if (hasStrategyOutput && !isGuidedCheckpoint) {
        return finalizeBrainStrategyResultServer({
          project,
          brainResult: brainResult!,
          locale,
          runId,
          contextVersion: version,
          idempotencyKey,
          episodeResult,
          continuationInput: {
            supabase: input.supabase!,
            organizationId: input.organizationId,
            projectId: input.projectId,
            peerId,
            peerRole: input.peerRole ?? "Marketing",
            campaignContext,
            domainInput,
            locale: locale === "nl" ? "nl" : "en",
          },
        });
      }

      persistStage({
        status: "waiting_for_approval",
        completedAt: new Date().toISOString(),
        failureCode: "waiting_for_approval",
        failureMessageSafe: customerSafeStrategyFailureMessage("waiting_for_approval", locale),
      });
      return {
        ok: false,
        status: "waiting_for_approval",
        project,
        failureCode: "waiting_for_approval",
        failureMessageSafe: customerSafeStrategyFailureMessage("waiting_for_approval", locale),
        runId,
      };
    }

    const brainResult = episodeResult.strategyCapabilityRun ?? null;

    if (brainResult?.run.usage.providerId) {
      markStrategyRunTiming(runId, "PROVIDER_SELECTED", brainResult.run.usage.providerId);
      recordStrategyRunTrace(
        trace,
        "server_provider_selected",
        brainResult.run.usage.providerId
      );
      if (brainResult.run.usage.providerId === "llm") {
        markStrategyRunTiming(runId, "OPENAI_FINISHED");
        recordStrategyRunTrace(trace, "server_openai_request_completed");
      }
    }
    markStrategyRunTiming(runId, "BRAIN_RETURNED");
    recordStrategyRunTrace(trace, "server_validation_completed");

    if (!brainResult) {
      persistStage({
        status: "failed",
        completedAt: new Date().toISOString(),
        failureCode: "no_result",
        failureMessageSafe: customerSafeStrategyFailureMessage(undefined, locale),
      });
      return {
        ok: false,
        status: "failed",
        project,
        failureCode: "no_result",
        failureMessageSafe: customerSafeStrategyFailureMessage(undefined, locale),
        runId,
      };
    }

    return finalizeBrainStrategyResultServer({
      project,
      brainResult,
      locale,
      runId,
      contextVersion: version,
      idempotencyKey,
      episodeResult,
      continuationInput: {
        supabase: input.supabase!,
        organizationId: input.organizationId,
        projectId: input.projectId,
        peerId,
        peerRole: input.peerRole ?? "Marketing",
        campaignContext,
        domainInput,
        locale: locale === "nl" ? "nl" : "en",
      },
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.message === "strategy_run_timeout";
    const failureCode = isTimeout ? "timeout" : "execution_error";
    const failureMessageSafe = customerSafeStrategyFailureMessage(failureCode, locale);
    project = patchProjectStrategyRunState(project, {
      status: "failed",
      completedAt: new Date().toISOString(),
      failureCode,
      failureMessageSafe,
    });
    return {
      ok: false,
      status: "failed",
      project,
      failureCode,
      failureMessageSafe,
      runId,
    };
  }
}

function finalizeBrainStrategyResultServer(input: {
  project: MarketingProject;
  brainResult: BrainRunResult;
  locale?: string | null;
  runId: string;
  contextVersion: number;
  idempotencyKey: string;
  episodeResult?: Awaited<ReturnType<typeof startOrResumeCampaignEpisode>>;
  continuationInput?: {
    supabase: AppSupabaseClient;
    organizationId: string;
    projectId: string;
    peerId: string;
    peerRole: string;
    campaignContext: ReturnType<typeof buildCampaignContext>;
    domainInput: MarketingPeerDomainInput;
    locale: "nl" | "en";
  };
}): LiveStrategyRunServerResult | Promise<LiveStrategyRunServerResult> {
  const { brainResult, locale, runId } = input;
  const { run, output, assembly } = brainResult;
  const usageMeta = usageFromBrainResult(brainResult);
  let project = input.project;

  if (
    !output &&
    (run.status === "waiting_for_input" ||
      run.status === "blocked" ||
      assembly.state === "needs_information" ||
      assembly.state === "unknown")
  ) {
    const failureMessageSafe = customerSafeStrategyFailureMessage("waiting_for_input", locale);
    project = patchProjectStrategyRunState(project, {
      status: "waiting_for_input",
      completedAt: new Date().toISOString(),
      failureCode: "waiting_for_input",
      failureMessageSafe,
      provider: run.usage.providerId,
      fallbackUsed: run.usage.providerId !== "llm",
    });
    return {
      ok: false,
      status: "waiting_for_input",
      project,
      failureCode: "waiting_for_input",
      failureMessageSafe,
      runId,
      ...usageMeta,
    };
  }

  if (!output) {
    const failureMessageSafe = customerSafeStrategyFailureMessage(undefined, locale);
    project = patchProjectStrategyRunState(project, {
      status: "failed",
      completedAt: new Date().toISOString(),
      failureCode: "no_output",
      failureMessageSafe,
      provider: run.usage.providerId,
    });
    return {
      ok: false,
      status: "failed",
      project,
      failureCode: "no_output",
      failureMessageSafe,
      runId,
      ...usageMeta,
    };
  }

  const bundle = presentBrainOutputForCampaign({
    title: locale === "nl" ? "Strategie" : "Strategy",
    output,
    locale: locale === "nl" ? "nl" : "en",
  });

  if (evidenceBlocksWorkflowAdvance(bundle.sections)) {
    const failureMessageSafe = customerSafeStrategyFailureMessage("needs_info", locale);
    project = patchProjectStrategyRunState(project, {
      status: "waiting_for_input",
      completedAt: new Date().toISOString(),
      failureCode: "needs_info",
      failureMessageSafe,
      provider: run.usage.providerId,
      fallbackUsed: run.usage.providerId !== "llm",
    });
    return {
      ok: false,
      status: "waiting_for_input",
      project,
      failureCode: "needs_info",
      failureMessageSafe,
      runId,
      ...usageMeta,
    };
  }

  const fallbackUsed = Boolean(
    usageMeta.fallbackReason ||
      (usageMeta.initialProvider === "llm" && usageMeta.finalProvider !== "llm")
  );
  project = applyProjectStrategyRunSuccess(project, {
    runId,
    contextVersion: input.contextVersion,
    idempotencyKey: input.idempotencyKey,
    provider: usageMeta.finalProvider ?? run.usage.providerId ?? "deterministic",
    initialProvider: usageMeta.initialProvider,
    finalProvider: usageMeta.finalProvider,
    fallbackUsed,
    fallbackReason: usageMeta.fallbackReason,
    completedAt: new Date().toISOString(),
  });

  const baseResult: LiveStrategyRunServerResult = {
    ok: true,
    status: "completed",
    project,
    runId,
    ...usageMeta,
  };

  if (
    input.episodeResult &&
    input.continuationInput &&
    shouldAutoContinueCampaignEpisode({
      project,
      episodeResult: input.episodeResult,
    })
  ) {
    return runWithBoundedTimeout(
      continueCampaignEpisode({
        ...input.continuationInput,
        project,
        trigger: "strategy_target_complete",
        episodeResult: input.episodeResult,
      }),
      EPISODE_CONTINUATION_TIMEOUT_MS,
      "episode_continuation_timeout"
    )
      .then(() => baseResult)
      .catch(() => baseResult);
  }

  return baseResult;
}

export async function enqueueLiveStrategyRunServer(
  input: EnqueueServerInput
): Promise<LiveStrategyRunServerResult> {
  if (isDemoPeer(input.peerId)) {
    throw new Error("Live strategy execution must not run for demo peers.");
  }

  const domainInput = buildDomainInputForStrategyRun(input);
  const key = buildStrategyIdempotencyKey({
    peerId: input.peerId,
    projectId: input.projectId,
    contextVersion: contextVersion(input.project),
    capabilityVersion: getBrainCapability("strategy").version,
  });

  const runIdForTiming = input.project.campaignSetup?.strategyRun?.runId ?? key;
  markStrategyRunTiming(runIdForTiming, "ENQUEUE_ENTER", key);

  if (process.env.NODE_ENV !== "production") {
    console.info("[strategy-run-inflight]", {
      idempotencyKey: key,
      hasExisting: inFlightByKey.has(key),
    });
  }

  const inflight = inFlightByKey.get(key);
  if (inflight) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[strategy-run-inflight]", { idempotencyKey: key, reused: true });
    }
    return inflight;
  }

  if (strategyOutputCurrent(input.project)) {
    const terminal: LiveStrategyRunServerResult = {
      ok: true,
      status: "completed",
      project: input.project,
    };
    markStrategyRunTiming(runIdForTiming, "ENQUEUE_RETURNED", "output_current");
    return terminal;
  }

  const ctx = buildCampaignContext({
    project: input.project,
    domainInput,
    locale: input.locale,
    organizationId: input.organizationId,
  });
  if (!usesProjectEngineLifecycleAuthority(input.project)) {
    const readiness = evaluateStrategyContextReadiness(ctx);
    if (!readiness.ready) {
      return {
        ok: false,
        status: "waiting_for_input",
        project: input.project,
        failureCode: "waiting_for_input",
        failureMessageSafe: customerSafeStrategyFailureMessage("waiting_for_input", input.locale),
      };
    }
  }

  const gate = shouldExecuteStrategyOnServer(input.project, domainInput, input.locale);
  if (!gate.execute) {
    if (gate.reason === "output_current") {
      return { ok: true, status: "completed", project: input.project };
    }
    if (gate.reason === "waiting_for_input" || gate.reason === "failed") {
      return {
        ok: false,
        status: gate.reason,
        project: input.project,
        failureCode: gate.reason,
      };
    }
    return {
      ok: false,
      status: "waiting_for_input",
      project: input.project,
      failureCode: "not_ready",
      failureMessageSafe: customerSafeStrategyFailureMessage("waiting_for_input", input.locale),
    };
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[strategy-run-inflight]", { idempotencyKey: key, reused: false, newPromise: true });
  }

  startStrategyRunTiming(runIdForTiming);

  const promise = executeLiveStrategyRunServer(input)
    .then((result) => {
      markStrategyRunTiming(runIdForTiming, "ENQUEUE_RETURNED", result.status);
      if (!isTerminalStrategyRunStatus(result.status)) {
        return {
          ...result,
          ok: false,
          status: "failed" as StrategyRunStatus,
          failureCode: "non_terminal_response",
          failureMessageSafe: customerSafeStrategyFailureMessage(undefined, input.locale),
          project: patchProjectStrategyRunState(result.project ?? input.project, {
            status: "failed",
            completedAt: new Date().toISOString(),
            failureCode: "non_terminal_response",
            failureMessageSafe: customerSafeStrategyFailureMessage(undefined, input.locale),
          }),
        };
      }
      return result;
    })
    .finally(() => {
      inFlightByKey.delete(key);
    });

  inFlightByKey.set(key, promise);
  return promise;
}

export function resetLiveStrategyRunServerInFlightForTests(): void {
  inFlightByKey.clear();
}
