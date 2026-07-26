import type { MarketingWorkUnitRuntimeErrorCode } from "./errors";
import type { MarketingWorkUnitFailureStage } from "./types";
import type { MarketingWorkUnitRuntimeKind } from "./identify-work-unit";

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
  readonly campaignId?: string;
  readonly runtimeKind?: MarketingWorkUnitRuntimeKind | null;
  readonly internalMessage?: string;
  readonly error?: unknown;
};

type HttpStatusError = Error & { status?: number };

function errorMessageForLog(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  if (error == null) {
    return "";
  }
  return String(error).slice(0, 500);
}

function stackForLog(error: unknown): string {
  if (error instanceof Error && error.stack) {
    return error.stack.split("\n").slice(0, 8).join("\n");
  }
  return "";
}

function httpStatusForLog(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as HttpStatusError).status;
    if (typeof status === "number") {
      return String(status);
    }
  }
  if (error && typeof error === "object" && typeof (error as { status?: unknown }).status === "number") {
    return String((error as { status: number }).status);
  }
  return "";
}

export function buildMarketingWorkUnitExecutionDiagnosticPayload(
  input: MarketingWorkUnitExecutionDiagnosticInput
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    area: "marketing_work_unit_runtime",
    failureStage: input.failureStage,
    code: input.code,
    workUnitId: input.workUnitId,
  };
  if (input.projectId) payload.projectId = input.projectId;
  if (input.campaignId) payload.campaignId = input.campaignId;
  if (input.runtimeKind) payload.runtimeKind = input.runtimeKind;
  if (input.internalMessage) payload.internalMessage = input.internalMessage;
  return payload;
}

/** TEMPORARY: plain-string dev logging (Sprint 22.2 diagnosis). */
export function logMarketingWorkUnitExecutionFailure(
  input: MarketingWorkUnitExecutionDiagnosticInput
): void {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const errorMessage = errorMessageForLog(input.error);
  const stack = stackForLog(input.error);
  const httpStatus = httpStatusForLog(input.error);

  console.log("==============================");
  console.log("Marketing Runtime Failure");
  console.log("==============================");
  console.log(`code: ${input.code}`);
  console.log(`failureStage: ${input.failureStage}`);
  console.log(`runtimeKind: ${input.runtimeKind ?? ""}`);
  console.log(`workUnitId: ${input.workUnitId}`);
  console.log(`projectId: ${input.projectId ?? ""}`);
  console.log(`campaignId: ${input.campaignId ?? ""}`);
  console.log(`internalMessage: ${input.internalMessage ?? ""}`);
  console.log(`errorMessage: ${errorMessage}`);
  console.log(`httpStatus: ${httpStatus}`);
  console.log(`stack: ${stack}`);
}
