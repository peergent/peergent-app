/**
 * PX-50 — bridges ProjectEpisodeRunner brain scheduling to BrainRuntime capabilities.
 */

import type {
  BrainOutput,
  BrainResult,
} from "../project-engine/brain-contract";
import type { ProjectBrainId } from "../project-engine/types";
import { getDefaultCompanyRepository } from "../layers/company/company-repository";
import { getDefaultResearchBrainRepository } from "../layers/research/research-brain-repository";
import { getDefaultReasoningBrainRepository } from "../layers/reasoning/reasoning-brain-repository";
import { getDefaultMarketingIntelligenceBrainRepository } from "../layers/marketing-intelligence/marketing-intelligence-brain-repository";
import { getDefaultStrategyBrainRepository } from "../layers/strategy/strategy-brain-repository";
import { getDefaultPlanningBrainRepository } from "../layers/planning/planning-brain-repository";
import { getDefaultCreativeRepository } from "../layers/creative/creative-repository";
import { getDefaultValidationRepository } from "../layers/validation/validation-repository";
import { getDefaultLearningBrainRepository } from "../layers/learning/learning-brain-repository";
import { primaryCapabilityForBrain } from "../integration/brain-capability-map";
import {
  executeBrainForProjectBrain,
  type ExecuteBrainForWorkflowStepOptions,
} from "../integration/execute-brain-for-workflow-step";
import type { BrainRunResult } from "../runtime/run-result";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { ProjectBrainExecutionAdapter, ProjectEpisodeRecord } from "./types";
import { emitOrchestrationDiagnostic } from "./orchestration-diagnostics";

function resolveOutputRef(
  brainId: ProjectBrainId,
  organizationId: string,
  projectId: string
): string {
  const key = { organizationId, projectId };
  switch (brainId) {
    case "company": {
      const latest = getDefaultCompanyRepository().getLatest(organizationId);
      return latest?.outputRef ?? `company:${organizationId}:capability`;
    }
    case "research": {
      const latest = getDefaultResearchBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `research:${organizationId}:${projectId}:capability`;
    }
    case "reasoning": {
      const latest = getDefaultReasoningBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `reasoning:${organizationId}:${projectId}:capability`;
    }
    case "marketing_intelligence": {
      const latest = getDefaultMarketingIntelligenceBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `mi:${organizationId}:${projectId}:capability`;
    }
    case "strategy": {
      const latest = getDefaultStrategyBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `strategy:${organizationId}:${projectId}:capability`;
    }
    case "planning": {
      const latest = getDefaultPlanningBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `planning:${organizationId}:${projectId}:capability`;
    }
    case "creative": {
      const latest = getDefaultCreativeRepository().getLatest({
        organizationId,
        campaignId: projectId,
      });
      return latest?.id ?? `creative:${organizationId}:${projectId}:capability`;
    }
    case "validation": {
      const latest = getDefaultValidationRepository().getLatest({
        organizationId,
        campaignId: projectId,
      });
      return latest?.id ?? `validation:${organizationId}:${projectId}:capability`;
    }
    case "learning": {
      const latest = getDefaultLearningBrainRepository().getLatestSnapshot(key);
      return latest?.id ?? `learning:${organizationId}:${projectId}:capability`;
    }
    default:
      return `${brainId}:${organizationId}:${projectId}:capability`;
  }
}

function mapRunStatus(
  run: BrainRunResult
): BrainResult<BrainOutput>["status"] {
  if (run.run.status === "completed" || run.run.status === "partial") return "completed";
  if (run.run.status === "waiting_for_approval") return "waiting_approval";
  if (run.run.status === "waiting_for_input" || run.run.status === "blocked") return "failed";
  if (run.run.status === "failed" || run.run.status === "cancelled") return "failed";
  return run.output ? "completed" : "failed";
}

function toBrainResult(
  brainId: ProjectBrainId,
  capabilityId: string,
  organizationId: string,
  projectId: string,
  run: BrainRunResult
): BrainResult<BrainOutput> {
  const status = mapRunStatus(run);
  const outputRef = resolveOutputRef(brainId, organizationId, projectId);
  const generatedAt = run.output?.generatedAt ?? new Date().toISOString();
  const decisionIds =
    run.output?.decisions.map((d) => d.id) ??
    run.output?.decisionRecords?.map((d) => d.id) ??
    [];

  return {
    brainId,
    status,
    output:
      status === "completed" || status === "waiting_approval"
        ? {
            outputRef,
            capabilityIds: [capabilityId],
            decisionIds,
            generatedAt,
          }
        : null,
    events: [],
    confidence: run.output?.findings.length
      ? { value: 0.65, label: "medium" as const }
      : null,
    durationMs: 0,
    errorCode:
      status === "failed"
        ? run.output?.errors[0]?.code ?? "capability_failed"
        : null,
    requiresApproval: run.run.status === "waiting_for_approval",
    approvalKind: run.run.status === "waiting_for_approval" ? "campaign_approval" : null,
  };
}

export type ProductionBrainAdapterInput = {
  peerId: string;
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  workflowOptions?: ExecuteBrainForWorkflowStepOptions;
};

export function createProductionBrainExecutionAdapter(
  input: ProductionBrainAdapterInput
): ProjectBrainExecutionAdapter {
  let lastCapabilityRun: BrainRunResult | null = null;

  return {
    get lastCapabilityRun() {
      return lastCapabilityRun;
    },
    async execute(runInput) {
      const capabilityId = primaryCapabilityForBrain(runInput.brainId);
      if (!capabilityId) {
        return {
          brainId: runInput.brainId,
          status: "failed",
          output: null,
          events: [],
          confidence: null,
          durationMs: 0,
          errorCode: "capability_not_mapped",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      emitOrchestrationDiagnostic({
        event: "brain_scheduled",
        organizationId: runInput.episode.snapshot.organizationId,
        projectId: runInput.episode.snapshot.projectId,
        peerId: runInput.episode.snapshot.peerId,
        episodeId: runInput.episode.snapshot.episodeId,
        brainId: runInput.brainId,
      });

      const workflowResult = await executeBrainForProjectBrain(
        {
          brainId: runInput.brainId,
          peerId: input.peerId,
          project: input.project,
          domainInput: input.domainInput,
          locale: runInput.locale,
          idempotencyKey: runInput.idempotencyKey,
        },
        input.workflowOptions
      );

      if (!workflowResult) {
        return {
          brainId: runInput.brainId,
          status: "failed",
          output: null,
          events: [],
          confidence: null,
          durationMs: 0,
          errorCode: "capability_execution_null",
          requiresApproval: false,
          approvalKind: null,
        };
      }

      lastCapabilityRun = workflowResult.result;
      if (runInput.brainId === "strategy") {
        lastCapabilityRun = workflowResult.result;
      }

      const result = toBrainResult(
        runInput.brainId,
        capabilityId,
        runInput.episode.snapshot.organizationId,
        runInput.episode.snapshot.projectId,
        workflowResult.result
      );

      emitOrchestrationDiagnostic({
        event: "brain_completed",
        organizationId: runInput.episode.snapshot.organizationId,
        projectId: runInput.episode.snapshot.projectId,
        peerId: runInput.episode.snapshot.peerId,
        episodeId: runInput.episode.snapshot.episodeId,
        brainId: runInput.brainId,
      });

      return result;
    },
  };
}
