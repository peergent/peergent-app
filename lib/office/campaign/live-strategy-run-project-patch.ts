import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { StrategyRunState } from "./strategy-run-types";

/** Pure in-memory strategy run patch — safe for server execution (no sessionStorage). */
export function patchProjectStrategyRunState(
  project: MarketingProject,
  patch: Partial<StrategyRunState>
): MarketingProject {
  const setup = project.campaignSetup;
  if (!setup) return project;

  const current = setup.strategyRun ?? { status: "idle" as const };
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    campaignSetup: {
      ...setup,
      strategyRun: {
        ...current,
        ...patch,
      },
    },
  };
}

/** Pure in-memory success patch — unlocks strategy review on the returned project. */
export function applyProjectStrategyRunSuccess(
  project: MarketingProject,
  input: {
    runId: string;
    contextVersion: number;
    idempotencyKey: string;
    provider: string;
    initialProvider?: string;
    finalProvider?: string;
    fallbackUsed: boolean;
    fallbackReason?: string;
    completedAt: string;
    startedAt?: string;
  }
): MarketingProject {
  const setup = project.campaignSetup;
  if (!setup) return project;

  const startedAt =
    input.startedAt ?? setup.strategyRun?.startedAt ?? input.completedAt;

  return {
    ...project,
    updatedAt: new Date().toISOString(),
    campaignSetup: {
      ...setup,
      strategyGeneratedAt: input.completedAt,
      strategyRun: {
        status: "completed",
        runId: input.runId,
        startedAt,
        completedAt: input.completedAt,
        contextVersion: input.contextVersion,
        idempotencyKey: input.idempotencyKey,
        provider: input.provider,
        initialProvider: input.initialProvider,
        finalProvider: input.finalProvider ?? input.provider,
        fallbackUsed: input.fallbackUsed,
        fallbackReason: input.fallbackReason,
        failureCode: undefined,
        failureMessageSafe: undefined,
        stageLabel: undefined,
      },
    },
  };
}
