import type { BrainCapabilityId } from "../capabilities/registry";
import { getBrainCapability, listBrainCapabilities } from "../capabilities/registry";
import {
  CAPABILITY_DEPENDENCIES,
  dependentsOf,
  getOptionalCapabilityDependencies,
} from "../capabilities/capability-dependencies";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { evaluateReadinessGate, missingCriticalFieldsFromAssembly } from "../runtime/readiness-gate";
import type { ReadinessDimension } from "../context/readiness";
import type { BrainRunRecord } from "../runtime/repositories/contracts";
import type { BrainStructuredOutput } from "../evidence/structured-output";

export type CapabilityDependencyStatus = {
  capabilityId: BrainCapabilityId;
  satisfied: boolean;
  optional: boolean;
  latestOutputVersion?: string;
  stale: boolean;
};

export type CapabilityInspectionReadModel = {
  organizationId: string;
  capabilityId: BrainCapabilityId;
  version: string;
  ready: boolean;
  partialAllowed: boolean;
  blockers: readonly string[];
  dependencies: readonly CapabilityDependencyStatus[];
  missingContext: readonly string[];
  providerAvailable: boolean;
  cacheable: boolean;
  costClass: string;
  latestSuccessfulRun?: {
    runId: string;
    completedAt?: string;
    outputVersion?: string;
  };
  recentFailures: number;
  blockedRuns: number;
  outputFreshness: "fresh" | "stale" | "unknown";
  checkedAt: string;
};

function dimensionScoreMap(
  assembly: ContextAssemblyResult
): Readonly<Record<ReadinessDimension, number>> {
  const map = {} as Record<ReadinessDimension, number>;
  for (const score of assembly.readiness.scores) {
    map[score.dimension] = score.score;
  }
  return map;
}

export function buildCapabilityInspectionReadModel(input: {
  organizationId: string;
  capabilityId: BrainCapabilityId;
  assembly: ContextAssemblyResult;
  storedOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  runs?: readonly BrainRunRecord[];
  providerIds?: readonly string[];
}): CapabilityInspectionReadModel {
  const def = getBrainCapability(input.capabilityId);
  const dimensionScores = dimensionScoreMap(input.assembly);
  const missingCritical = missingCriticalFieldsFromAssembly(
    input.capabilityId,
    input.assembly.missingInformation
  );
  const gate = evaluateReadinessGate({
    capabilityId: input.capabilityId,
    overallScore: input.assembly.readiness.overallScore,
    dimensionScores,
    missingCriticalFields: missingCritical,
    assemblyState: input.assembly.state,
  });

  const optionalDeps = new Set(getOptionalCapabilityDependencies(input.capabilityId));

  const dependencies: CapabilityDependencyStatus[] = def.dependencies.map((depId) => {
    const depOutput = input.storedOutputs?.[depId];
    const depDef = getBrainCapability(depId);
    return {
      capabilityId: depId,
      satisfied: Boolean(depOutput?.findings.length || depOutput?.warnings.length),
      optional: optionalDeps.has(depId),
      latestOutputVersion: depOutput?.capabilityVersion,
      stale: depOutput
        ? depOutput.capabilityVersion !== depDef.version
        : !optionalDeps.has(depId),
    };
  });

  const capabilityRuns =
    input.runs?.filter((r) => r.capabilityId === input.capabilityId && r.organizationId === input.organizationId) ??
    [];
  const successful = capabilityRuns.filter((r) => r.status === "completed" || r.status === "partial");
  const latest = successful.sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];

  const blockers = !gate.ok && "reasons" in gate ? [...gate.reasons] : [];

  return {
    organizationId: input.organizationId,
    capabilityId: input.capabilityId,
    version: def.version,
    ready: gate.ok,
    partialAllowed: gate.ok && "partial" in gate ? gate.partial : false,
    blockers,
    dependencies,
    missingContext: missingCritical,
    providerAvailable: (input.providerIds ?? ["demo"]).length > 0,
    cacheable: def.cacheable,
    costClass: def.costClass,
    latestSuccessfulRun: latest
      ? {
          runId: latest.id,
          completedAt: latest.completedAt,
          outputVersion: def.version,
        }
      : undefined,
    recentFailures: capabilityRuns.filter((r) => r.status === "failed").length,
    blockedRuns: capabilityRuns.filter((r) => r.status === "blocked").length,
    outputFreshness: latest ? "fresh" : dependencies.some((d) => d.stale && !d.optional) ? "stale" : "unknown",
    checkedAt: new Date().toISOString(),
  };
}

export function listCapabilityInspectionReadModels(input: {
  organizationId: string;
  assembly: ContextAssemblyResult;
  storedOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>;
  runs?: readonly BrainRunRecord[];
}): readonly CapabilityInspectionReadModel[] {
  return listBrainCapabilities().map((def) =>
    buildCapabilityInspectionReadModel({
      organizationId: input.organizationId,
      capabilityId: def.id,
      assembly: input.assembly,
      storedOutputs: input.storedOutputs,
      runs: input.runs,
    })
  );
}

export function staleDependentsForCapability(
  capabilityId: BrainCapabilityId,
  storedOutputs?: Partial<Record<BrainCapabilityId, BrainStructuredOutput>>
): readonly BrainCapabilityId[] {
  const def = getBrainCapability(capabilityId);
  const output = storedOutputs?.[capabilityId];
  if (!output || output.capabilityVersion === def.version) return [];
  return dependentsOf(capabilityId);
}

export { CAPABILITY_DEPENDENCIES, dependentsOf };
