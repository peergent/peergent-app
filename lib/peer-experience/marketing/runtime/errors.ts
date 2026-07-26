export type MarketingWorkUnitRuntimeErrorCode =
  | "UnsupportedWorkUnit"
  | "ContextUnavailable"
  | "PromptBuildFailure"
  | "AIRuntimeFailure"
  | "ValidationFailure"
  | "PersistenceFailure";

export class MarketingWorkUnitRuntimeError extends Error {
  readonly code: MarketingWorkUnitRuntimeErrorCode;

  constructor(code: MarketingWorkUnitRuntimeErrorCode, message: string) {
    super(message);
    this.name = "MarketingWorkUnitRuntimeError";
    this.code = code;
  }
}
