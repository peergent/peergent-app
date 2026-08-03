import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";

/** Provider contract — Sprint 1 has no AI implementations. */
export interface BrainCapabilityProvider {
  readonly id: string;
  execute(input: {
    context: BrainRunContext;
    snapshot: BrainSnapshot;
    capabilityId: BrainCapabilityId;
  }): Promise<BrainStructuredOutput>;
}
