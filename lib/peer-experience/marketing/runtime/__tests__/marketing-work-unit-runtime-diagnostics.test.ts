import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CUSTOMER_SAFE_EXECUTION_MESSAGES,
  buildMarketingWorkUnitExecutionDiagnosticPayload,
  customerSafeExecutionMessage,
  logMarketingWorkUnitExecutionFailure,
} from "../marketing-work-unit-runtime-diagnostics";

describe("marketing-work-unit-runtime-diagnostics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("maps runtime codes to unchanged customer-safe copy", () => {
    expect(customerSafeExecutionMessage("PromptBuildFailure")).toBe(
      "Marketing Peer could not prepare the strategy. Please try again."
    );
    expect(customerSafeExecutionMessage("ContextUnavailable")).toBe(
      "More campaign information is required."
    );
    expect(Object.keys(CUSTOMER_SAFE_EXECUTION_MESSAGES)).toEqual([
      "ContextUnavailable",
      "PromptBuildFailure",
      "AIRuntimeFailure",
      "ValidationFailure",
      "PersistenceFailure",
    ]);
  });

  it("logs structured diagnostics in development without secrets", () => {
    vi.stubEnv("NODE_ENV", "development");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logMarketingWorkUnitExecutionFailure({
      failureStage: "build_context",
      code: "ContextUnavailable",
      workUnitId: "wu-1",
      projectId: "proj-1",
      runtimeKind: "email_campaign",
      internalMessage: "Peer not found",
      error: new Error("Peer not found"),
    });

    const output = logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(output).toContain("Marketing Runtime Failure");
    expect(output).toContain("code: ContextUnavailable");
    expect(output).toContain("failureStage: build_context");
    expect(output).toContain("runtimeKind: email_campaign");
    expect(output).toContain("internalMessage: Peer not found");
    expect(output).toContain("errorMessage: Peer not found");
    expect(output).not.toMatch(/prompt|ContextPackage|access_token|cookie|secret/i);
  });

  it("buildMarketingWorkUnitExecutionDiagnosticPayload never serializes to empty object", () => {
    const payload = buildMarketingWorkUnitExecutionDiagnosticPayload({
      failureStage: "generate_email_campaign",
      code: "AIRuntimeFailure",
      workUnitId: "wu-email",
      projectId: "proj-1",
      runtimeKind: "email_campaign",
      internalMessage: "Request failed.",
    });
    expect(JSON.stringify(payload)).not.toBe("{}");
    expect(payload.failureStage).toBe("generate_email_campaign");
  });

  it("does not log in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logMarketingWorkUnitExecutionFailure({
      failureStage: "generate_strategy",
      code: "AIRuntimeFailure",
      workUnitId: "wu-1",
      internalMessage: "Model failed",
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
