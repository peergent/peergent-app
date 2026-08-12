export type {
  ContextCategory,
  ContextConfidence,
  ContextRequirement,
  ContextRequirementScope,
  AcquiredContextItem,
  ContextAcquisitionGap,
  ContextAcquisitionBudget,
  ContextAcquisitionDiagnostics,
  BrainContextAcquisitionPackage,
  ContextAcquisitionTask,
  AcquireBrainContextInput,
} from "./types";

export {
  DEFAULT_CONTEXT_ACQUISITION_BUDGET,
} from "./types";

export { acquireBrainContext, type AcquireBrainContextOptions } from "./acquire-brain-context";
export { resolveContextRequirements, requirementsForCategory, requiredSliceKeys } from "./requirements/resolve-context-requirements";
export { createContextItem, itemMatchesRequirement } from "./normalize/context-item";
export { applyContextBudget } from "./budget/apply-context-budget";
export {
  deriveSliceAvailability,
  isAcquisitionContextReady,
  itemSatisfiesRequirement,
} from "./derive-slice-availability";
export {
  detectContextAcquisitionGaps,
  mapAcquisitionGapsToProjectGaps,
} from "./gaps/detect-context-gaps";
export { emitContextDiagnostic, type ContextDiagnosticEvent, type ContextDiagnosticPayload } from "./diagnostics";
export { DEFAULT_CONTEXT_SOURCE_ADAPTERS, adaptersForRequirements } from "./adapters/registry";
export type { ContextSourceAdapter, ContextAdapterInput, ContextAdapterResult } from "./adapters/types";
