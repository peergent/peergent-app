export {
  VALIDATION_LAYER_VERSION,
  type ValidationGraph,
  type ValidationBrainInput,
  type ValidationBrainOutput,
  type ValidationReport,
  type ValidationIssue,
  type ValidationCategory,
  type ValidationWarning,
  type ValidationPass,
  type ValidationDecision,
  type ValidationScore,
  type ValidationSummary,
  type ValidationDomainId,
  type PublicationReadiness,
  type ValidationBrainPayload,
  type RequiredFix,
  type OptionalImprovement,
  type BusinessRisk,
  type BrandRisk,
} from "./types";

export { buildValidationGraph, buildValidationSummary } from "./build-validation-graph";
export {
  validateValidationGraph,
  scoreValidationQuality,
  type ValidationMetaResult,
} from "./validation-validator";
export { mapValidationGraphToBrainOutput } from "./map-validation-graph-to-output";
export {
  ValidationPublisher,
  createValidationPublisher,
  publishValidationOutput,
  type ValidationPublishPayload,
} from "./validation-publisher";
export {
  ValidationLayer,
  createValidationLayer,
  collectValidationGraph,
  type ValidationLayerResult,
} from "./validation-layer";
export {
  type ValidationRepository,
  InMemoryValidationRepository,
  getDefaultValidationRepository,
  resetDefaultValidationRepository,
} from "./validation-repository";
export { VALIDATION_MODULE_SPECS } from "./modules/specs";
export {
  buildScore,
  weightedOverallScore,
  resolvePublicationReadiness,
  estimateConversionScore,
} from "./scoring";
export {
  ValidationBrainExecutor,
  createValidationBrainExecutor,
  validationBrainContract,
  createFromBrainInputs,
} from "./validation-brain-executor";
