export {
  DECISION_ENGINE_VERSION,
  type Decision,
  type DecisionCategory,
  type DecisionCollection,
  type DecisionConfidenceLevel,
  type DecisionConfidenceInput,
  type DecisionDependency,
  type DecisionCustomerChallenge,
  type DecisionReviewTrigger,
  type RejectedDecisionAlternative,
} from "./decision-types";

export {
  calculateDecisionConfidence,
  decisionConfidenceLabel,
} from "./decision-confidence";

export { buildDecisionsFromStrategyGraph } from "./decision-builder";

export {
  validateDecision,
  validateDecisionCollection,
  type DecisionValidationResult,
  type DecisionValidationIssue,
} from "./decision-validator";

export {
  presentDecisionSummary,
  presentDecisionExplainability,
  presentTopDecisions,
  mapDecisionToBrainDecision,
  mapDecisionsToBrainDecisions,
  type DecisionPresentationSummary,
  type DecisionExplainabilityView,
} from "./decision-presentation";
