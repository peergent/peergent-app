import type { SupabaseClient } from "@supabase/supabase-js";

import { defaultContextEngine } from "@/lib/context-engine";
import type { CreativeBrief } from "@/lib/creative-brief";
import {
  generateMarketingCreativeBrief as generateMarketingCreativeBriefApi,
  generateMarketingStrategy as generateMarketingStrategyApi,
} from "@/lib/marketing-workspace/api";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import type { Database } from "@/lib/supabase/database.types";

import { CampaignExecutionWorkspaceFeatureDisabledError } from "../campaign-execution/campaign-execution-workspace-result";
import { isMarketingCampaignWorkspaceEnabled } from "../marketing-workspace-feature-flags";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import { executeMarketingWorkUnit } from "./execute-marketing-work-unit";
import type { ExecuteMarketingWorkUnitResult } from "./types";

export class MarketingWorkUnitExecutionFeatureDisabledError extends Error {
  constructor() {
    super("Campaign workspace is disabled — work unit execution is unavailable.");
    this.name = "MarketingWorkUnitExecutionFeatureDisabledError";
  }
}

export type MarketingWorkUnitExecutionWorkspaceUnavailableResult = {
  readonly ok: false;
  readonly code: "WorkspaceUnavailable";
  readonly message: string;
  readonly workUnitId: string;
};

export type MarketingWorkUnitExecutionBusyResult = {
  readonly ok: false;
  readonly code: "ExecutionInProgress";
  readonly message: string;
  readonly workUnitId: string;
};

export type MarketingWorkUnitExecutionFeatureDisabledResult = {
  readonly ok: false;
  readonly code: "FeatureDisabled";
  readonly message: string;
  readonly workUnitId: string;
};

export type MarketingWorkUnitExecutionResult =
  | ExecuteMarketingWorkUnitResult
  | MarketingWorkUnitExecutionWorkspaceUnavailableResult
  | MarketingWorkUnitExecutionBusyResult
  | MarketingWorkUnitExecutionFeatureDisabledResult;

export type ExecuteMarketingWorkUnitInWorkspaceArgs = {
  readonly workUnitId: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly domainInput: MarketingPeerDomainInput;
  readonly assembledAt: string;
  readonly campaignWorkspaceEnabled?: boolean;
  readonly supabase: SupabaseClient<Database>;
  readonly getWorkspaceSnapshot: () => {
    readonly workUnits: readonly WorkUnit[];
    readonly strategy: MarketingStrategy | null;
    readonly creativeBriefByCampaignId: Readonly<Record<string, CreativeBrief>>;
  };
  readonly commitWorkspaceState: (next: {
    readonly workUnits: readonly WorkUnit[];
    readonly strategy: MarketingStrategy | null;
    readonly creativeBriefByCampaignId: Readonly<Record<string, CreativeBrief>>;
  }) => void;
};

async function generateStrategyForWorkspace(input: {
  contextPackage: import("@/lib/intelligence").ContextPackage;
  taskHint?: string;
  peerId: string;
}): Promise<
  | { success: true; strategy: MarketingStrategy; warnings: string[]; traceId: string }
  | { success: false; error: string; warnings: string[]; traceId: string }
> {
  try {
    const { strategy, warnings, traceId } = await generateMarketingStrategyApi(
      input.peerId,
      input.taskHint
    );
    return { success: true, strategy, warnings, traceId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Strategy generation failed.",
      warnings: [],
      traceId: input.contextPackage.traceId,
    };
  }
}

/**
 * Runs a single supported work unit through the Marketing Peer runtime using workspace persistence.
 */
export async function executeMarketingWorkUnitInWorkspace(
  args: ExecuteMarketingWorkUnitInWorkspaceArgs
): Promise<MarketingWorkUnitExecutionResult> {
  const enabled =
    args.campaignWorkspaceEnabled ?? isMarketingCampaignWorkspaceEnabled();
  if (!enabled) {
    return {
      ok: false,
      code: "FeatureDisabled",
      message: new MarketingWorkUnitExecutionFeatureDisabledError().message,
      workUnitId: args.workUnitId,
    };
  }

  if (!args.organizationId?.trim() || !args.domainInput.peerId?.trim()) {
    return {
      ok: false,
      code: "WorkspaceUnavailable",
      message: "Marketing workspace is unavailable.",
      workUnitId: args.workUnitId,
    };
  }

  const snapshot = args.getWorkspaceSnapshot();

  const result = await executeMarketingWorkUnit({
    workUnitId: args.workUnitId,
    organizationId: args.organizationId,
    userId: args.userId,
    domainInput: {
      ...args.domainInput,
      workUnits: [...snapshot.workUnits],
      strategy: snapshot.strategy,
      creativeBriefByCampaignId: snapshot.creativeBriefByCampaignId,
    },
    assembledAt: args.assembledAt,
    persistence: {
      saveStrategy: (strategy) => {
        args.commitWorkspaceState({
          workUnits: args.getWorkspaceSnapshot().workUnits,
          strategy,
          creativeBriefByCampaignId: args.getWorkspaceSnapshot().creativeBriefByCampaignId,
        });
      },
      saveCreativeBrief: ({ campaignId, brief }) => {
        const current = args.getWorkspaceSnapshot();
        args.commitWorkspaceState({
          workUnits: current.workUnits,
          strategy: current.strategy,
          creativeBriefByCampaignId: {
            ...current.creativeBriefByCampaignId,
            [campaignId]: brief,
          },
        });
      },
      updateWorkUnit: (unit) => {
        const current = args.getWorkspaceSnapshot();
        const nextUnits = current.workUnits.map((u) => (u.id === unit.id ? unit : u));
        args.commitWorkspaceState({
          workUnits: nextUnits,
          strategy: current.strategy,
          creativeBriefByCampaignId: current.creativeBriefByCampaignId,
        });
        return unit;
      },
    },
    deps: {
      buildContext: (request) =>
        defaultContextEngine.buildContext(request, { supabase: args.supabase }),
      generateStrategy: ({ contextPackage, taskHint }) =>
        generateStrategyForWorkspace({
          contextPackage,
          taskHint,
          peerId: args.domainInput.peerId,
        }),
      generateCreativeBrief: async ({ contextPackage, strategy, project, taskHint }) => {
        try {
          const { brief, warnings, traceId } = await generateMarketingCreativeBriefApi(
            args.domainInput.peerId,
            strategy,
            {
              id: project.id,
              title: project.title,
              goal: project.goal,
            },
            taskHint
          );
          return { success: true as const, brief, warnings, traceId };
        } catch (error) {
          return {
            success: false as const,
            error: error instanceof Error ? error.message : "Creative direction generation failed.",
            warnings: [],
            traceId: contextPackage.traceId,
          };
        }
      },
    },
  });

  return result;
}

export function marketingWorkUnitExecutionResultFromError(
  error: unknown,
  workUnitId: string
): MarketingWorkUnitExecutionResult {
  if (error instanceof MarketingWorkUnitExecutionFeatureDisabledError) {
    return {
      ok: false,
      code: "FeatureDisabled",
      message: error.message,
      workUnitId,
    };
  }
  if (error instanceof CampaignExecutionWorkspaceFeatureDisabledError) {
    return {
      ok: false,
      code: "FeatureDisabled",
      message: error.message,
      workUnitId,
    };
  }
  return {
    ok: false,
    code: "WorkspaceUnavailable",
    message: error instanceof Error ? error.message : "Work unit execution failed.",
    workUnitId,
  };
}
