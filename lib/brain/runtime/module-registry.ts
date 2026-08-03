import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";

/** Module contract — capabilities replace legacy ProjectBrainModule.analyze(). */
export interface BrainCapabilityModule {
  readonly capabilityId: BrainCapabilityId;
  execute(input: {
    context: BrainRunContext;
    snapshot: BrainSnapshot;
  }): Promise<BrainStructuredOutput | null>;
}

export type BrainCapabilityModuleRegistry = Partial<
  Record<BrainCapabilityId, BrainCapabilityModule>
>;

export function assertOrganizationScoped(
  context: BrainRunContext,
  resourceOrganizationId: string
): void {
  if (context.organizationId !== resourceOrganizationId) {
    throw new BrainOrganizationIsolationError(context.organizationId, resourceOrganizationId);
  }
}

export class BrainOrganizationIsolationError extends Error {
  constructor(requestedOrg: string, resourceOrg: string) {
    super(
      `Brain run for organization "${requestedOrg}" cannot access resources of "${resourceOrg}".`
    );
    this.name = "BrainOrganizationIsolationError";
  }
}
