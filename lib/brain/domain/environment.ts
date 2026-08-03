/** Where a Brain run executes — resolved centrally, never inferred ad hoc. */
export type BrainEnvironment = "live" | "demo" | "test";

export const BRAIN_ENVIRONMENTS: readonly BrainEnvironment[] = ["live", "demo", "test"];

export function isBrainEnvironment(value: string): value is BrainEnvironment {
  return BRAIN_ENVIRONMENTS.includes(value as BrainEnvironment);
}
