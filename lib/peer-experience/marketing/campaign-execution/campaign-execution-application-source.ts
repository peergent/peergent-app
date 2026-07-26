import type { CampaignExecutionResult } from "@/lib/campaign/executor";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { CreateWorkUnitInput } from "@/lib/peer-workflow/work-unit";
import type { MarketingProject } from "../projects/types";

/**
 * Injected persistence — no sessionStorage, Supabase, React, or hooks.
 * Workspace adapters wire these to existing update paths.
 */
export type CampaignExecutionPersistencePort = {
  readonly createWorkUnit: (input: CreateWorkUnitInput) => WorkUnit | Promise<WorkUnit>;
  readonly updateWorkUnit: (unit: WorkUnit) => WorkUnit | Promise<WorkUnit>;
  readonly updateProject: (project: MarketingProject) => MarketingProject | Promise<MarketingProject>;
};

export type CampaignExecutionApplicationSource = {
  readonly organizationId: string;
  readonly peerId: string;
  readonly campaignProject: MarketingProject;
  readonly workUnits: readonly WorkUnit[];
  readonly executionResult: CampaignExecutionResult;
  readonly appliedAt: string;
  readonly persistence: CampaignExecutionPersistencePort;
  /** Previously applied executor operation ids (session metadata, project notes, etc.). */
  readonly appliedOperationIds?: readonly string[];
};

export const CAMPAIGN_EXECUTOR_OPERATION_ID_RAW_PREFIX = "campaign-executor-op:";

export function rawRequestWithExecutorOperationId(
  operationId: string,
  body: string
): string {
  return `${CAMPAIGN_EXECUTOR_OPERATION_ID_RAW_PREFIX}${operationId}\n${body}`.trim();
}

export function extractExecutorOperationIdFromRawRequest(rawRequest: string): string | null {
  const prefix = CAMPAIGN_EXECUTOR_OPERATION_ID_RAW_PREFIX;
  if (!rawRequest.startsWith(prefix)) return null;
  const rest = rawRequest.slice(prefix.length);
  const lineBreak = rest.indexOf("\n");
  const id = lineBreak === -1 ? rest : rest.slice(0, lineBreak);
  return id.trim() || null;
}
