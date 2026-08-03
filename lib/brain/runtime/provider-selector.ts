import type { BrainEnvironment } from "../domain/environment";
import type { BrainCapabilityId, BrainCostClass } from "../capabilities/registry";
import { getBrainCapability } from "../capabilities/registry";
import type { BrainCapabilityProvider } from "../providers/provider-interface";
import { assertEnvironmentAllowsLiveAccess } from "../context/resolve-environment";
import { BrainRuntimeError } from "./errors";

export type ProviderSelectionResult = {
  provider: BrainCapabilityProvider;
  providerClass: "demo" | "live";
};

export function selectBrainProvider(input: {
  environment: BrainEnvironment;
  capabilityId: BrainCapabilityId;
  providers: readonly BrainCapabilityProvider[];
  costClass?: BrainCostClass;
}): ProviderSelectionResult {
  const def = getBrainCapability(input.capabilityId);

  if (!def.allowedEnvironments.includes(input.environment)) {
    throw new BrainRuntimeError(
      "capability_not_allowed",
      `Capability ${input.capabilityId} is not allowed in ${input.environment}`
    );
  }

  if (input.environment === "demo" || input.environment === "test") {
    const demo = input.providers.find((p) => p.id === "demo");
    if (!demo) {
      throw new BrainRuntimeError("provider_not_found", "Demo provider is required.");
    }
    return { provider: demo, providerClass: "demo" };
  }

  try {
    assertEnvironmentAllowsLiveAccess(input.environment);
  } catch {
    throw new BrainRuntimeError("environment_isolation", "Live provider blocked in demo.");
  }

  const live = input.providers.find((p) => p.id !== "demo");
  if (live) {
    return { provider: live, providerClass: "live" };
  }

  /** Sprint 6: deterministic demo provider serves live until LLM adapters are connected. */
  const deterministic = input.providers.find((p) => p.id === "demo");
  if (deterministic) {
    return { provider: deterministic, providerClass: "demo" };
  }

  throw new BrainRuntimeError(
    "provider_not_found",
    `No live provider registered for ${input.capabilityId}`
  );
}
