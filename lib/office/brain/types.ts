/**
 * @deprecated Use `@/lib/brain` — migrated from lib/office/brain/types.ts
 */
export type {
  BrainCapabilityId,
  BrainCapabilityDefinition,
} from "@/lib/brain/capabilities/registry";

export type {
  BrainCapabilityModule,
  BrainCapabilityModuleRegistry,
} from "@/lib/brain/runtime/module-registry";

export type { BrainRunContext as BrainContext } from "@/lib/brain/context/run-context";

export {
  WORKFLOW_STEP_BRAIN_MODULES,
  WORKFLOW_STEP_CAPABILITIES,
  capabilitiesForWorkflowStep,
  LEGACY_MODULE_TO_CAPABILITY,
} from "@/lib/brain/capabilities/workflow-map";

export type { LegacyBrainModuleId } from "@/lib/brain/capabilities/workflow-map";

/** @deprecated Use BrainStructuredOutput */
export type { BrainStructuredOutput as BrainOutput } from "@/lib/brain/evidence/structured-output";

/** @deprecated Use BrainFinding */
export type { BrainFinding as BrainEvidenceItem } from "@/lib/brain/evidence/structured-output";

/** @deprecated Use BrainCapabilityModule */
export type { BrainCapabilityModule as ProjectBrainModule } from "@/lib/brain/runtime/module-registry";

/** @deprecated Use BrainCapabilityModuleRegistry */
export type { BrainCapabilityModuleRegistry as ProjectBrainRegistry } from "@/lib/brain/runtime/module-registry";

/** @deprecated Use BrainCapabilityId — legacy alias */
export type BrainModuleId = import("@/lib/brain/capabilities/workflow-map").LegacyBrainModuleId;
