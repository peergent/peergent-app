import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CUSTOMER_SAFE_EXECUTION_MESSAGES,
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
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logMarketingWorkUnitExecutionFailure({
      failureStage: "build_context",
      code: "ContextUnavailable",
      workUnitId: "wu-1",
      projectId: "proj-1",
      internalMessage: "Peer not found",
      error: new Error("Peer not found"),
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [label, payload] = errorSpy.mock.calls[0] ?? [];
    expect(label).toBe("[MarketingWorkUnitRuntime]");
    expect(payload).toMatchObject({
      area: "marketing_work_unit_runtime",
      failureStage: "build_context",
      code: "ContextUnavailable",
      workUnitId: "wu-1",
      projectId: "proj-1",
      internalMessage: "Peer not found",
    });
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/prompt|ContextPackage|access_token|cookie|secret/i);
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
