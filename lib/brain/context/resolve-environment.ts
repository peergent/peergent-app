import type { BrainEnvironment } from "../domain/environment";
import { isBrainEnvironment } from "../domain/environment";

export type ResolveBrainEnvironmentInput = {
  /** Explicit override — highest priority. */
  environment?: BrainEnvironment | string | null;
  /** Demo peer routes always resolve to demo. */
  peerId?: string | null;
  /** NODE_ENV=test resolves to test unless overridden. */
  nodeEnv?: string | null;
};

/**
 * Central environment resolution.
 * Demo peers never run as live. Demo environment rejects live provider access separately.
 */
export function resolveBrainEnvironment(input: ResolveBrainEnvironmentInput = {}): BrainEnvironment {
  if (input.environment && isBrainEnvironment(input.environment)) {
    return input.environment;
  }
  if (input.peerId === "demo") {
    return "demo";
  }
  if (input.nodeEnv === "test") {
    return "test";
  }
  return "live";
}

export function assertDemoEnvironmentOnly(environment: BrainEnvironment): void {
  if (environment !== "demo") {
    throw new BrainEnvironmentIsolationError(environment, "demo_only");
  }
}

/** Live providers must not run in demo — demo uses fixtures only. */
export function assertEnvironmentAllowsLiveAccess(environment: BrainEnvironment): void {
  if (environment === "demo") {
    throw new BrainEnvironmentIsolationError("demo", "live_access");
  }
}

export class BrainEnvironmentIsolationError extends Error {
  readonly environment: BrainEnvironment;
  readonly operation: string;

  constructor(environment: BrainEnvironment, operation: string) {
    super(`Brain environment "${environment}" cannot perform "${operation}".`);
    this.name = "BrainEnvironmentIsolationError";
    this.environment = environment;
    this.operation = operation;
  }
}
