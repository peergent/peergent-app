import { InMemoryBrainCacheStore } from "../cache/store";
import { createDemoBrainProvider } from "../demo/demo-provider";
import { assembleCompanyContextSync } from "../context/company-context-assembler";
import type { CompanyContextAssemblerInput } from "../context/company-context-assembler";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { BrainRuntime, createBrainRuntime } from "../runtime/brain-runtime";
import { InMemoryBrainRunRepository } from "../runtime/repositories/in-memory-run-repository";
import { InMemoryBrainOutputRepository } from "../runtime/repositories/in-memory-output-repository";
import { InMemoryBrainAuditRepository } from "../runtime/repositories/in-memory-audit-repository";
import { InMemoryBrainIdempotencyRepository } from "../runtime/repositories/in-memory-idempotency-repository";

export type BrainRuntimeFactoryInput = {
  assembleContext?: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult;
  assemblerInput?: CompanyContextAssemblerInput;
};

let defaultRuntime: BrainRuntime | null = null;

export function createDefaultBrainRuntime(input: BrainRuntimeFactoryInput = {}): BrainRuntime {
  const assembleContext =
    input.assembleContext ??
    ((request: BrainRunRequestWithBudget) => {
      const assemblerInput = input.assemblerInput ?? {
        organizationId: request.organizationId,
      };
      return assembleCompanyContextSync({
        ...assemblerInput,
        organizationId: request.organizationId,
        locale: request.locale === "nl" ? "nl" : "en",
      });
    });

  return createBrainRuntime({
    runRepository: new InMemoryBrainRunRepository(),
    outputRepository: new InMemoryBrainOutputRepository(),
    auditRepository: new InMemoryBrainAuditRepository(),
    idempotencyRepository: new InMemoryBrainIdempotencyRepository(),
    cache: new InMemoryBrainCacheStore(),
    providers: [createDemoBrainProvider()],
    assembleContext,
  });
}

export function getDefaultBrainRuntime(): BrainRuntime {
  if (!defaultRuntime) {
    defaultRuntime = createDefaultBrainRuntime();
  }
  return defaultRuntime;
}

export function resetDefaultBrainRuntime(): void {
  defaultRuntime = null;
}

export function createBrainRuntimeWithAssembly(
  assembleContext: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult
): BrainRuntime {
  return createDefaultBrainRuntime({ assembleContext });
}
