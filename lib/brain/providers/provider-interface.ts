import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";

import type { CompanySnapshot } from "../company/snapshot";

/** Provider contract — Sprint 1 has no AI implementations. */
export interface BrainCapabilityProvider {
  readonly id: string;
  execute(input: {
    context: BrainRunContext;
    snapshot: BrainSnapshot;
    capabilityId: BrainCapabilityId;
    companySnapshot?: CompanySnapshot;
  }): Promise<BrainStructuredOutput>;
  /** Optional synchronous path for deterministic demo providers. */
  executeSync?(input: {
    context: BrainRunContext;
    snapshot: BrainSnapshot;
    capabilityId: BrainCapabilityId;
    companySnapshot?: CompanySnapshot;
  }): BrainStructuredOutput;
}
