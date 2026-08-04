import type { CompanyContextAssemblerInput } from "../context/company-context-assembler";
import { assembleCompanyContextSync } from "../context/company-context-assembler";
import type { BrainRunRequestWithBudget } from "../runtime/run-request";
import type { ContextAssemblyResult } from "../context/assembly-types";
import { BrainRuntime, createBrainRuntime } from "../runtime/brain-runtime";
import {
  createBrainRepositories,
  resetBrainRepositoryStores,
  type BrainRepositoryBundle,
} from "../persistence/repository-factory";
import type { BrainEnvironment } from "../domain/environment";

export type BrainRuntimeFactoryInput = {
  environment?: BrainEnvironment;
  peerId?: string;
  assembleContext?: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult;
  assemblerInput?: CompanyContextAssemblerInput;
  repositories?: BrainRepositoryBundle;
};

let defaultRuntime: BrainRuntime | null = null;

function resolveAssembleContext(input: BrainRuntimeFactoryInput) {
  return (
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
    })
  );
}

export function createDefaultBrainRuntime(input: BrainRuntimeFactoryInput = {}): BrainRuntime {
  const bundle =
    input.repositories ??
    createBrainRepositories({
      environment: input.environment ?? "demo",
      peerId: input.peerId,
    });

  return createBrainRuntime({
    runRepository: bundle.sync.runs,
    outputRepository: bundle.sync.outputs,
    auditRepository: bundle.sync.audit,
    idempotencyRepository: bundle.sync.idempotency,
    asyncRepositories: bundle.storageMode !== "in_memory" ? bundle.async : undefined,
    storageMode: bundle.storageMode,
    cache: bundle.cache,
    providers: bundle.providers,
    assembleContext: resolveAssembleContext(input),
  });
}

export function createLiveBrainRuntime(input: BrainRuntimeFactoryInput): BrainRuntime {
  const bundle =
    input.repositories ??
    createBrainRepositories({
      environment: "live",
      peerId: input.peerId,
    });
  return createDefaultBrainRuntime({ ...input, repositories: bundle });
}

export function getDefaultBrainRuntime(): BrainRuntime {
  if (!defaultRuntime) {
    defaultRuntime = createDefaultBrainRuntime();
  }
  return defaultRuntime;
}

export function resetDefaultBrainRuntime(): void {
  defaultRuntime = null;
  resetBrainRepositoryStores();
}

export function createBrainRuntimeWithAssembly(
  assembleContext: (
    request: BrainRunRequestWithBudget
  ) => Promise<ContextAssemblyResult> | ContextAssemblyResult,
  options: {
    peerId: string;
    environment: BrainEnvironment;
    repositories?: BrainRepositoryBundle;
  }
): BrainRuntime {
  return createDefaultBrainRuntime({
    assembleContext,
    peerId: options.peerId,
    environment: options.environment,
    repositories: options.repositories,
  });
}
