import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CompanySnapshot } from "../company/snapshot";
import { assertDemoEnvironmentOnly } from "../context/resolve-environment";
import { getBrainCapability } from "../capabilities/registry";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { executeCompanyUnderstanding } from "../capabilities/company-understanding";
import { executeWebsiteUnderstanding } from "../capabilities/website-understanding";

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
};

/**
 * Deterministic demo provider — same runtime, demo adapter only.
 * Uses assembled company snapshot from runtime context assembly.
 */
export class DemoBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "demo";

  executeSync(input: ProviderInput): BrainStructuredOutput {
    assertDemoEnvironmentOnly(input.context.environment);

    const def = getBrainCapability(input.capabilityId);
    const generatedAt = new Date().toISOString();
    const locale = input.context.locale === "nl" ? "nl" : "en";
    const companySnapshot = input.companySnapshot;

    if (!companySnapshot) {
      return {
        ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
        warnings: [
          {
            id: "warn-no-company-snapshot",
            code: "insufficient_company_context",
            message: "No company snapshot available for demo execution.",
            provenance: [{ kind: "demo_fixture", refId: input.context.organizationId }],
          },
        ],
      };
    }

    if (input.capabilityId === "company_understanding") {
      return executeCompanyUnderstanding({ companySnapshot, locale });
    }

    if (input.capabilityId === "website_understanding") {
      return executeWebsiteUnderstanding({
        companySnapshot,
        websiteSnapshot: companySnapshot.website ?? undefined,
        locale,
      });
    }

    return {
      ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
      findings: [
        {
          id: `demo-${input.capabilityId}-finding`,
          label: "Demo fixture",
          value: `Deterministic output for ${input.capabilityId}`,
          confidence: "medium",
          provenance: [
            {
              kind: "demo_fixture",
              refId: `demo:${input.context.organizationId}:${input.capabilityId}`,
              label: "Demo Brain provider",
              capturedAt: generatedAt,
            },
          ],
        },
      ],
    };
  }

  async execute(input: ProviderInput): Promise<BrainStructuredOutput> {
    return this.executeSync(input);
  }
}

export function createDemoBrainProvider(): DemoBrainCapabilityProvider {
  return new DemoBrainCapabilityProvider();
}
