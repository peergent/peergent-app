import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import { buildCampaignContext } from "./campaign-context";
import { evaluateStrategyContextReadiness } from "./strategy-context-readiness";
import {
  isActiveStrategyRunStatus,
  isStrategyRunStale,
  type StrategyRunStatus,
} from "./strategy-run-types";
import { buildStrategyIdempotencyKey } from "./strategy-run-types";
import { isTerminalStrategyRunStatus } from "./strategy-run-timing";

export type LiveStrategyRunResult = {
  ok: boolean;
  status: StrategyRunStatus;
  project: MarketingProject | null;
  failureCode?: string;
  failureMessageSafe?: string;
  provider?: string;
  fallbackUsed?: boolean;
  runId?: string;
};

function contextVersion(project: MarketingProject): number {
  return project.campaignSetup?.campaignContextVersion ?? 0;
}

export function strategyOutputCurrent(project: MarketingProject): boolean {
  const setup = project.campaignSetup;
  if (!setup?.strategyGeneratedAt) return false;
  const runVersion = setup.strategyRun?.contextVersion;
  if (runVersion === undefined) return true;
  return runVersion >= contextVersion(project);
}

export function shouldEnqueueLiveStrategyRun(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  locale?: string | null
): boolean {
  const ctx = buildCampaignContext({
    project,
    domainInput,
    locale,
  });
  const strategyReadiness = evaluateStrategyContextReadiness(ctx);
  if (!strategyReadiness.ready) return false;
  if (strategyOutputCurrent(project)) return false;

  const run = project.campaignSetup?.strategyRun;
  if (run?.status === "completed" && strategyOutputCurrent(project)) return false;
  if (isActiveStrategyRunStatus(run?.status)) {
    if (isStrategyRunStale(run)) return true;
    return false;
  }
  if (run?.status === "failed" || run?.status === "waiting_for_input") return false;
  return true;
}

/** Stable client trigger key — one execution per context + capability version. */
export function buildStrategyTriggerKey(input: {
  peerId: string;
  projectId: string;
  contextVersion: number;
  capabilityVersion?: string;
}): string {
  return buildStrategyIdempotencyKey(input);
}

/**
 * Server execution gate — ignores client optimistic active run state.
 * Client may send gathering_context before the server action runs; server must still execute.
 */
export function shouldExecuteStrategyOnServer(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  locale?: string | null
): { execute: boolean; reason?: string } {
  const ctx = buildCampaignContext({ project, domainInput, locale });
  const strategyReadiness = evaluateStrategyContextReadiness(ctx);
  if (!strategyReadiness.ready) {
    return { execute: false, reason: "not_ready" };
  }
  if (strategyOutputCurrent(project)) {
    return { execute: false, reason: "output_current" };
  }
  const run = project.campaignSetup?.strategyRun;
  if (run?.status === "failed" || run?.status === "waiting_for_input") {
    return { execute: false, reason: run.status };
  }
  if (run?.status === "completed" && strategyOutputCurrent(project)) {
    return { execute: false, reason: "completed" };
  }
  return { execute: true };
}

export { isTerminalStrategyRunStatus };
