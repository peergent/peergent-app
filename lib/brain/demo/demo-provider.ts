import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import { assertDemoEnvironmentOnly } from "../context/resolve-environment";
import { executeDeterministicCapability } from "../providers/deterministic-provider";

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
};

/**
 * Deterministic demo provider — all Sprint 5 capabilities in demo/test.
 */
export class DemoBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "demo";

  executeSync(input: ProviderInput): BrainStructuredOutput {
    assertDemoEnvironmentOnly(input.context.environment);
    return executeDeterministicCapability(input);
  }

  async execute(input: ProviderInput): Promise<BrainStructuredOutput> {
    return this.executeSync(input);
  }
}

export function createDemoBrainProvider(): DemoBrainCapabilityProvider {
  return new DemoBrainCapabilityProvider();
}
