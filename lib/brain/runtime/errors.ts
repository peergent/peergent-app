import type { BrainRunStatus } from "./run-lifecycle";

export class BrainRuntimeError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BrainRuntimeError";
    this.code = code;
  }
}

export class BrainRunTransitionError extends BrainRuntimeError {
  readonly from: BrainRunStatus;
  readonly to: BrainRunStatus;

  constructor(from: BrainRunStatus, to: BrainRunStatus) {
    super(
      "invalid_transition",
      `Illegal Brain run transition: ${from} → ${to}`
    );
    this.name = "BrainRunTransitionError";
    this.from = from;
    this.to = to;
  }
}

export class BrainRunNotFoundError extends BrainRuntimeError {
  constructor(runId: string) {
    super("run_not_found", `Brain run not found: ${runId}`);
    this.name = "BrainRunNotFoundError";
  }
}

export class BrainRunBudgetExceededError extends BrainRuntimeError {
  constructor(reason: string) {
    super("budget_exceeded", reason);
    this.name = "BrainRunBudgetExceededError";
  }
}

export class BrainRunReadinessError extends BrainRuntimeError {
  readonly status: "waiting_for_input" | "blocked";

  constructor(status: "waiting_for_input" | "blocked", message: string) {
    super("readiness_insufficient", message);
    this.name = "BrainRunReadinessError";
    this.status = status;
  }
}

export class BrainOutputValidationError extends BrainRuntimeError {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super("output_validation_failed", issues.join("; "));
    this.name = "BrainOutputValidationError";
    this.issues = issues;
  }
}

export class BrainRunIsolationError extends BrainRuntimeError {
  constructor(message: string) {
    super("organization_isolation", message);
    this.name = "BrainRunIsolationError";
  }
}
