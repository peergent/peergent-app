import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import { assertDemoEnvironmentOnly } from "../context/resolve-environment";
import { getBrainCapability } from "../capabilities/registry";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { executeCompanyUnderstanding } from "../capabilities/company-understanding";
import { executeWebsiteUnderstanding } from "../capabilities/website-understanding";
import { buildPeergentCompanyProfile } from "./peergent-company-profile";
import { buildCompanySnapshot } from "../company/snapshot-builder";
import { getDemoWebsiteSnapshot, seedPeergentDemoWebsiteSnapshotSync } from "./demo-intelligence-store";

/**
 * Deterministic demo provider — same runtime, demo adapter only.
 * Uses Peergent company profile and simulated website snapshots.
 */
export class DemoBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "demo";

  async execute(input: {
    context: BrainRunContext;
    snapshot: BrainSnapshot;
    capabilityId: BrainCapabilityId;
  }): Promise<BrainStructuredOutput> {
    assertDemoEnvironmentOnly(input.context.environment);

    const def = getBrainCapability(input.capabilityId);
    const generatedAt = new Date().toISOString();
    const locale = input.context.locale === "nl" ? "nl" : "en";

    const companyProfile = buildPeergentCompanyProfile(locale, generatedAt);
    const websiteSnapshot =
      getDemoWebsiteSnapshot(companyProfile.organizationId) ?? seedPeergentDemoWebsiteSnapshotSync();

    const { snapshot: companySnapshot } = buildCompanySnapshot({
      organizationId: companyProfile.organizationId,
      companyProfile,
      websiteSnapshot,
      assembledAt: generatedAt,
    });

    if (input.capabilityId === "company_understanding") {
      return executeCompanyUnderstanding({ companySnapshot, locale });
    }

    if (input.capabilityId === "website_understanding") {
      return executeWebsiteUnderstanding({ companySnapshot, websiteSnapshot, locale });
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
}

export function createDemoBrainProvider(): DemoBrainCapabilityProvider {
  return new DemoBrainCapabilityProvider();
}
