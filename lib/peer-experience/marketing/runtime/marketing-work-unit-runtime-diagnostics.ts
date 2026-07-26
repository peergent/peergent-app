import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import type { MarketingWorkUnitFailureStage } from "./types";

export const CUSTOMER_SAFE_EXECUTION_MESSAGES: Record<
  Exclude<MarketingWorkUnitRuntimeErrorCode, "UnsupportedWorkUnit">,
  string
> = {
  ContextUnavailable: "More campaign information is required.",
  PromptBuildFailure: "Marketing Peer could not prepare the strategy. Please try again.",
  AIRuntimeFailure: "Marketing Peer could not prepare the strategy. Please try again.",
  ValidationFailure: "The generated strategy needs another attempt.",
  PersistenceFailure: "The strategy could not be saved safely.",
};

export function customerSafeExecutionMessage(
  code: Exclude<MarketingWorkUnitRuntimeErrorCode, "UnsupportedWorkUnit">
): string {
  return CUSTOMER_SAFE_EXECUTION_MESSAGES[code];
}

export type MarketingWorkUnitExecutionDiagnosticInput = {
  readonly failureStage: MarketingWorkUnitFailureStage;
  readonly code: MarketingWorkUnitRuntimeErrorCode | "FeatureDisabled" | "WorkspaceUnavailable" | "ExecutionInProgress";
  readonly workUnitId: string;
  readonly projectId?: string;
  readonly internalMessage?: string;
  readonly error?: unknown;
};

export function logMarketingWorkUnitExecutionFailure(
  input: MarketingWorkUnitExecutionDiagnosticInput
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const payload: Record<string, unknown> = {
    area: "marketing_work_unit_runtime",
    failureStage: input.failureStage,
    code: input.code,
    workUnitId: input.workUnitId,
  };
  if (input.projectId) {
    payload.projectId = input.projectId;
  }
  if (input.internalMessage) {
    payload.internalMessage = input.internalMessage;
  }

  if (input.error instanceof Error) {
    console.error("[MarketingWorkUnitRuntime]", payload, input.error);
  } else {
    console.error("[MarketingWorkUnitRuntime]", payload);
  }
}
