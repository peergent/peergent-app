import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
import { assertDemoEnvironmentOnly } from "../context/resolve-environment";
import { getBrainCapability } from "../capabilities/registry";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { executeCompanyUnderstanding } from "../capabilities/company-understanding";
import { executeWebsiteUnderstanding } from "../capabilities/website-understanding";
import { executeBrandUnderstanding } from "../capabilities/brand-understanding";
import { executeCompetitorUnderstanding } from "../capabilities/competitor-understanding";
import { executeStrategy } from "../capabilities/strategy";
import { executeChannelPlanning } from "../capabilities/channel-planning";
import { executeCreativeGeneration } from "../capabilities/creative-generation";
import { executePerformanceInterpretation } from "../capabilities/performance-interpretation";
import { executeOptimization } from "../capabilities/optimization";

type ProviderInput = {
  context: BrainRunContext;
  snapshot: BrainSnapshot;
  capabilityId: BrainCapabilityId;
  companySnapshot?: CompanySnapshot;
  executionContext?: CapabilityExecutionContext;
};

function buildExecContext(input: ProviderInput): CapabilityExecutionContext | null {
  if (input.executionContext) return input.executionContext;
  if (!input.companySnapshot) return null;
  return {
    companySnapshot: input.companySnapshot,
    upstreamOutputs: {},
    locale: input.context.locale === "nl" ? "nl" : "en",
  };
}

/**
 * Deterministic demo provider — all Sprint 5 capabilities in demo/test.
 */
export class DemoBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "demo";

  executeSync(input: ProviderInput): BrainStructuredOutput {
    assertDemoEnvironmentOnly(input.context.environment);

    const def = getBrainCapability(input.capabilityId);
    const generatedAt = new Date().toISOString();
    const locale = input.context.locale === "nl" ? "nl" : "en";
    const execCtx = buildExecContext(input);

    if (!execCtx) {
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

    let output: BrainStructuredOutput;
    switch (input.capabilityId) {
      case "company_understanding":
        output = executeCompanyUnderstanding({ companySnapshot: execCtx.companySnapshot, locale });
        break;
      case "website_understanding":
        output = executeWebsiteUnderstanding({
          companySnapshot: execCtx.companySnapshot,
          websiteSnapshot: execCtx.companySnapshot.website ?? undefined,
          locale,
        });
        break;
      case "brand_understanding":
        output = executeBrandUnderstanding(execCtx);
        break;
      case "competitor_understanding":
        output = executeCompetitorUnderstanding(execCtx);
        break;
      case "strategy":
        output = executeStrategy(execCtx);
        break;
      case "channel_planning":
        output = executeChannelPlanning(execCtx);
        break;
      case "creative_generation":
        output = executeCreativeGeneration(execCtx);
        break;
      case "performance_interpretation":
        output = executePerformanceInterpretation(execCtx);
        break;
      case "optimization":
        output = executeOptimization(execCtx);
        break;
      default:
        output = {
          ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
          findings: [
            {
              id: `demo-${input.capabilityId}`,
              label: "Demo fixture",
              value: `Deterministic output for ${input.capabilityId}`,
              confidence: "medium",
              provenance: [
                {
                  kind: "demo_fixture",
                  refId: `demo:${input.context.organizationId}:${input.capabilityId}`,
                  capturedAt: generatedAt,
                },
              ],
            },
          ],
        };
    }

    return output;
  }

  async execute(input: ProviderInput): Promise<BrainStructuredOutput> {
    return this.executeSync(input);
  }
}

export function createDemoBrainProvider(): DemoBrainCapabilityProvider {
  return new DemoBrainCapabilityProvider();
}
