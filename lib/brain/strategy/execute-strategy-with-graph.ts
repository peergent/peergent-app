import type { CapabilityExecutionContext, CapabilityExecutionResult } from "../capabilities/execution-context";
import { emptyBrainStructuredOutput } from "../evidence/structured-output";
import { getBrainCapability } from "../capabilities/registry";
import { profileProvenance, campaignProvenance } from "../capabilities/shared/provenance";
import { buildStrategyGraph } from "./build-strategy-graph";
import { mapStrategyGraphToBrainOutput } from "./map-strategy-graph-to-output";
import { resolveStrategySources } from "./strategy-sources";
import { validateStrategyQuality } from "./strategy-quality-validator";
import { finalizeStrategyWithSelfCritique } from "./strategy-self-critique";

function isPlaceholderGoal(text: string): boolean {
  const n = text.toLowerCase().trim();
  return !n || n.length < 4 || ["custom goal", "aangepast doel"].includes(n);
}

/**
 * Strategy execution using ReasoningGraph → StrategyGraph → BrainStructuredOutput.
 * Legacy upstreamOutputs remain as fallback when reasoning is unavailable.
 */
export function executeStrategyWithGraph(ctx: CapabilityExecutionContext): CapabilityExecutionResult {
  const def = getBrainCapability("strategy");
  const generatedAt = new Date().toISOString();
  const nl = ctx.locale === "nl";
  const campaign = ctx.campaignContext;
  const orgId = ctx.companySnapshot.organizationId;
  const base = emptyBrainStructuredOutput("strategy", def.version, generatedAt);

  if (!campaign) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-campaign",
          code: "missing_campaign_context",
          message: nl ? "Geen campagnecontext beschikbaar." : "No campaign context available.",
          provenance: [profileProvenance(orgId, "campaign")],
        },
      ],
    };
  }

  const goals = campaign.goals.filter((g) => !isPlaceholderGoal(g));
  if (goals.length === 0 && !campaign.description.trim()) {
    return {
      ...base,
      warnings: [
        {
          id: "warn-no-goal",
          code: "missing_campaign_goal",
          message: nl
            ? "Ik heb nog een campagnedoel nodig voordat ik strategie kan bepalen."
            : "I still need a campaign goal before determining strategy.",
          provenance: [campaignProvenance(campaign.projectId, "goals")],
        },
      ],
    };
  }

  const sources = resolveStrategySources(ctx);
  const { graph: strategyGraph, critique } = finalizeStrategyWithSelfCritique({
    ctx,
    campaignContext: campaign,
  });

  const quality = validateStrategyQuality(strategyGraph, {
    campaignContext: campaign,
    companyName: campaign.companyName,
    minOverall: ctx.reasoningGraph ? 40 : 30,
  });

  const brandOut = ctx.upstreamOutputs.brand_understanding;
  const websiteOut = ctx.upstreamOutputs.website_understanding;

  const output = mapStrategyGraphToBrainOutput({
    graph: strategyGraph,
    campaignContext: campaign,
    organizationId: orgId,
    locale: ctx.locale,
    brandCapabilityUsed: Boolean(brandOut),
    websiteLimited: !websiteOut?.findings.length,
  });

  if (!quality.valid && ctx.reasoningGraph) {
    return {
      ...output,
      warnings: [
        ...output.warnings,
        ...quality.issues.slice(0, 2).map((issue, i) => ({
          id: `warn-strategy-quality-${i + 1}`,
          code: issue.code,
          message: issue.message,
          provenance: [campaignProvenance(campaign.projectId, "strategy_quality")],
        })),
        ...(critique.iterationsUsed > 0
          ? [
              {
                id: "warn-strategy-self-critique",
                code: "strategy_self_critique",
                message:
                  nl
                    ? `Strategie verfijnd na ${critique.iterationsUsed} self-critique ronde(s). Kwaliteitsscore: ${critique.qualityScore}.`
                    : `Strategy refined after ${critique.iterationsUsed} self-critique round(s). Quality score: ${critique.qualityScore}.`,
                provenance: [campaignProvenance(campaign.projectId, "strategy_self_critique")],
              },
            ]
          : []),
      ],
    };
  }

  return output;
}
