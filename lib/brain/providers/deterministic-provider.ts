import type { BrainCapabilityProvider } from "../providers/provider-interface";
import type { BrainRunContext } from "../context/run-context";
import type { BrainSnapshot } from "../context/snapshot";
import type { BrainCapabilityId } from "../capabilities/registry";
import type { BrainStructuredOutput } from "../evidence/structured-output";
import type { CompanySnapshot } from "../company/snapshot";
import type { CapabilityExecutionContext } from "../capabilities/execution-context";
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
import { PLACEHOLDER_MARKET_UNDERSTANDING_VALUE } from "../project-runtime/intelligence-pipeline-diagnostics";

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

/** Provider-neutral deterministic execution — allowed in live until LLM adapters connect. */
export function executeDeterministicCapability(input: ProviderInput): BrainStructuredOutput {
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
          message: "No company snapshot available for deterministic execution.",
          provenance: [{ kind: "assumption", refId: input.context.organizationId }],
        },
      ],
    };
  }

  switch (input.capabilityId) {
    case "company_understanding":
      return executeCompanyUnderstanding({ companySnapshot: execCtx.companySnapshot, locale });
    case "website_understanding":
      return executeWebsiteUnderstanding({
        companySnapshot: execCtx.companySnapshot,
        websiteSnapshot: execCtx.companySnapshot.website ?? undefined,
        locale,
      });
    case "brand_understanding":
      return executeBrandUnderstanding(execCtx);
    case "competitor_understanding":
      return executeCompetitorUnderstanding(execCtx);
    case "strategy":
      return executeStrategy(execCtx);
    case "channel_planning":
      return executeChannelPlanning(execCtx);
    case "creative_generation":
      return executeCreativeGeneration(execCtx);
    case "performance_interpretation":
      return executePerformanceInterpretation(execCtx);
    case "optimization":
      return executeOptimization(execCtx);
    case "market_understanding":
      if (input.context.environment === "live") {
        return {
          ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
          warnings: [
            {
              id: "warn-market-understanding-blocked",
              code: "market_understanding_requires_brain_pipeline",
              message:
                "Market understanding must be produced by Reasoning/Marketing Intelligence brain layers in production.",
              provenance: [
                {
                  kind: "assumption",
                  refId: `${input.context.organizationId}:market_understanding:blocked`,
                },
              ],
            },
          ],
          errors: [
            {
              id: "err-market-understanding-blocked",
              code: "placeholder_blocked",
              message: PLACEHOLDER_MARKET_UNDERSTANDING_VALUE,
              retryable: false,
              provenance: [
                {
                  kind: "assumption",
                  refId: `${input.context.organizationId}:market_understanding:blocked`,
                },
              ],
            },
          ],
        };
      }
      return {
        ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
        findings: [
          {
            id: `deterministic-${input.capabilityId}`,
            label: "Deterministic output",
            value: `Deterministic output for ${input.capabilityId}`,
            confidence: "medium",
            provenance: [
              {
                kind: "assumption",
                refId: `${input.context.organizationId}:${input.capabilityId}`,
                capturedAt: generatedAt,
              },
            ],
          },
        ],
      };
    default:
      return {
        ...emptyBrainStructuredOutput(input.capabilityId, def.version, generatedAt),
        findings: [
          {
            id: `deterministic-${input.capabilityId}`,
            label: "Deterministic output",
            value: `Deterministic output for ${input.capabilityId}`,
            confidence: "medium",
            provenance: [
              {
                kind: "assumption",
                refId: `${input.context.organizationId}:${input.capabilityId}`,
                capturedAt: generatedAt,
              },
            ],
          },
        ],
      };
  }
}

export class DeterministicBrainCapabilityProvider implements BrainCapabilityProvider {
  readonly id = "deterministic";

  executeSync(input: ProviderInput): BrainStructuredOutput {
    return executeDeterministicCapability(input);
  }

  async execute(input: ProviderInput): Promise<BrainStructuredOutput> {
    return this.executeSync(input);
  }
}

export function createDeterministicBrainProvider(): DeterministicBrainCapabilityProvider {
  return new DeterministicBrainCapabilityProvider();
}
