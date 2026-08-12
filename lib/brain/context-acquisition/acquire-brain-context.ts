import { emitContextDiagnostic } from "./diagnostics";
import { DEFAULT_CONTEXT_SOURCE_ADAPTERS, adaptersForRequirements } from "./adapters/registry";
import type { ContextSourceAdapter } from "./adapters/types";
import { applyContextBudget } from "./budget/apply-context-budget";
import {
  deriveSliceAvailability,
} from "./derive-slice-availability";
import { itemMatchesRequirement } from "./normalize/context-item";
import {
  detectContextAcquisitionGaps,
  mapAcquisitionGapsToProjectGaps,
} from "./gaps/detect-context-gaps";
import { resolveContextRequirements } from "./requirements/resolve-context-requirements";
import { assembleContextFromSources } from "./assembly/assemble-from-sources";
import type {
  AcquireBrainContextInput,
  BrainContextAcquisitionPackage,
  ContextAcquisitionDiagnostics,
} from "./types";
import { DEFAULT_CONTEXT_ACQUISITION_BUDGET as DEFAULT_BUDGET } from "./types";
import { collectBrandGraph } from "../layers/brand/brand-layer";
import { getDefaultMemoryRepository } from "../layers/memory/memory-repository";

export type AcquireBrainContextOptions = {
  adapters?: readonly ContextSourceAdapter[];
};

export async function acquireBrainContext(
  input: AcquireBrainContextInput,
  options: AcquireBrainContextOptions = {}
): Promise<BrainContextAcquisitionPackage> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const budget = input.budget ?? DEFAULT_BUDGET;

  emitContextDiagnostic({
    event: "context_acquisition_started",
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
  });

  const requirements = resolveContextRequirements({
    peerRole: input.task.peerRole,
    phase: input.task.phase,
  });

  const categories = new Set(requirements.map((r) => r.category));
  const adapters =
    options.adapters ??
    adaptersForRequirements(DEFAULT_CONTEXT_SOURCE_ADAPTERS, categories);

  const adapterInput = {
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    requirements,
    budget,
    locale: input.task.locale,
    peerRole: input.task.peerRole,
    campaignContext: input.campaignContext ?? null,
  };

  const adapterResults = await Promise.all(
    adapters.map((adapter) => adapter.acquire(adapterInput))
  );

  const adapterOutcomes: Record<
    string,
    {
      status: "completed" | "partial" | "failed" | "skipped";
      itemCount: number;
      durationMs: number;
      failureCode?: string;
    }
  > = {};
  const rawItems: import("./types").AcquiredContextItem[] = [];

  for (const result of adapterResults) {
    adapterOutcomes[result.adapterId] = {
      status: result.status,
      itemCount: result.items.length,
      durationMs: result.durationMs,
      failureCode: result.failureCode,
    };

    if (result.status === "failed") {
      emitContextDiagnostic({
        event: "context_source_failed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        sourceAdapterId: result.adapterId,
        failureCode: result.failureCode,
        message: result.failureMessage,
      });
    } else if (result.status !== "skipped") {
      emitContextDiagnostic({
        event: "context_source_completed",
        organizationId: input.organizationId,
        projectId: input.projectId,
        sourceAdapterId: result.adapterId,
        itemCount: result.items.length,
        durationMs: result.durationMs,
      });
    }

    rawItems.push(...result.items);
  }

  const { items, truncated } = applyContextBudget(rawItems, budget);
  const assembly = await assembleContextFromSources(input);
  const sliceAvailability = deriveSliceAvailability({
    items,
    assembly,
    campaignHasGoals: Boolean(input.campaignContext?.goals?.length),
  });

  const acquisitionGaps = detectContextAcquisitionGaps({
    requirements,
    items,
    adapterResults,
  });

  for (const gap of acquisitionGaps.filter((g) => g.severity === "blocking")) {
    emitContextDiagnostic({
      event: "context_gap_detected",
      organizationId: input.organizationId,
      projectId: input.projectId,
      message: gap.requirement.key,
    });
  }

  const contextGaps = mapAcquisitionGapsToProjectGaps(acquisitionGaps);
  const unsatisfiedRequired = requirements.filter(
    (req) => req.required && !items.some((item) => itemMatchesRequirement(item, req.key))
  );
  const contextReady = unsatisfiedRequired.length === 0;

  const completedAt = new Date().toISOString();
  const diagnostics: ContextAcquisitionDiagnostics = {
    startedAt,
    completedAt,
    durationMs: Date.now() - startMs,
    adapterOutcomes,
    totalItems: items.length,
    gapCount: acquisitionGaps.length,
    blockingGapCount: acquisitionGaps.filter((g) => g.severity === "blocking").length,
    truncated,
  };

  emitContextDiagnostic({
    event: "context_acquisition_completed",
    organizationId: input.organizationId,
    projectId: input.projectId,
    itemCount: items.length,
    gapCount: acquisitionGaps.length,
    blockingGapCount: diagnostics.blockingGapCount,
    durationMs: diagnostics.durationMs,
  });

  const brandGraph =
    assembly && input.campaignContext
      ? collectBrandGraph({
          companySnapshot: assembly.companySnapshot,
          campaignContext: input.campaignContext,
        })
      : null;

  const priorMemories = getDefaultMemoryRepository()
    .getOrgMemories(input.organizationId)
    .slice(0, budget.maxItemsPerAdapter);

  return {
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    acquiredAt: completedAt,
    requirements,
    items,
    acquisitionGaps,
    contextGaps,
    sliceAvailability,
    contextReady,
    assembly,
    handoff: {
      companySnapshot: assembly?.companySnapshot ?? null,
      brandGraph,
      campaignContext: input.campaignContext ?? null,
      priorMemories,
    },
    diagnostics,
  };
}
