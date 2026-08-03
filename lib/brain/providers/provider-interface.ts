import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";

import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import type { BrainContextProjection } from "./token-strategy";

export type BrainCapabilityProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
  projection?: BrainContextProjection;
};

/** Provider contract — Sprint 1 has no AI implementations. */
export interface BrainCapabilityProvider {
  readonly id: string;
  execute(input: BrainCapabilityProviderInput): Promise<BrainStructuredOutput>;
  executeSync?(input: BrainCapabilityProviderInput): BrainStructuredOutput;
}
