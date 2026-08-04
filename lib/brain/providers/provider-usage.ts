import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainUsageMetadata } from "../runtime/run-lifecycle";

export type BrainProviderWithUsage = BrainCapabilityProvider & {
  consumeLastUsage(): BrainUsageMetadata | undefined;
};

export function isBrainProviderWithUsage(
  provider: BrainCapabilityProvider
): provider is BrainProviderWithUsage {
  return typeof (provider as BrainProviderWithUsage).consumeLastUsage === "function";
}
