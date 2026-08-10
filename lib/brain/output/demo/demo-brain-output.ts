import type { CampaignBrainOutput, WorkspaceBrainOutput } from "../types";
import type { BrainPresentationContext } from "../presentation-context";
import { buildCampaignBrainOutput } from "../aggregate/build-campaign-brain-output";
import type { CampaignBrainPresentationContext } from "../presentation-context";
import { buildDemoCreativeGraph } from "./demo-creative-graph";
import { buildDemoValidationGraph } from "./demo-validation-graph";
import { mapCreativeGraphToBrainOutput } from "@/lib/brain/layers/creative/map-creative-graph-to-output";
import { mapValidationGraphToBrainOutput } from "@/lib/brain/layers/validation/map-validation-graph-to-output";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { resolveBrainPresentationContext } from "../presentation-context";

/** Deterministic demo intelligence — Creative Brain primary source. */
export function buildDemoCampaignBrainOutput(input: {
  ctx: CampaignBrainPresentationContext;
  statusLabel: string;
  workflowSteps: import("@/lib/office/campaign/workflow-types").CampaignWorkflowStep[];
  recommendationHref?: string | null;
}): CampaignBrainOutput {
  const nl = input.ctx.locale === "nl";
  const now = input.ctx.now.toISOString();

  const creativeGraph = buildDemoCreativeGraph({
    organizationId: input.ctx.campaignContext.companyName,
    campaignId: input.ctx.project.id,
    nl,
    now,
  });

  const demoStrategy = {
    capabilityId: "strategy",
    capabilityVersion: "1.0.0",
    findings: [
      {
        id: "f-competitors",
        label: nl ? "Concurrenten" : "Competitors",
        value: nl ? "12 concurrenten" : "12 competitors",
        confidence: "high" as const,
        provenance: [],
      },
      {
        id: "f-pages",
        label: nl ? "Geïndexeerde pagina's" : "Indexed pages",
        value: "132",
        confidence: "high" as const,
        provenance: [],
      },
      {
        id: "f-usp",
        label: nl ? "Sterkste USP" : "Strongest USP",
        value: nl ? "Snelle time-to-value voor MKB" : "Fast time-to-value for SMBs",
        confidence: "medium" as const,
        provenance: [],
      },
    ],
    decisions: [],
    recommendations: [],
    actionProposals: [],
    executionResults: [],
    warnings: [],
    errors: [],
    generatedAt: now,
  };

  const creativeOutput = mapCreativeGraphToBrainOutput({
    graph: creativeGraph,
    campaignContext: input.ctx.campaignContext,
    locale: input.ctx.locale,
  });

  const validationGraph = buildDemoValidationGraph({
    organizationId: input.ctx.campaignContext.companyName,
    campaignId: input.ctx.project.id,
    nl,
    now,
  });

  const validationOutput = mapValidationGraphToBrainOutput({
    graph: validationGraph,
    campaignContext: input.ctx.campaignContext,
    locale: input.ctx.locale,
  });

  const demoBriefing = {
    title: nl ? "Executive review" : "Executive review",
    preparedAt: now,
    companyName: input.ctx.campaignContext.companyName,
    sections: [
      {
        id: "executive-summary",
        title: nl ? "Executive summary" : "Executive summary",
        summary: nl
          ? "Emma analyseerde 12 concurrenten en koos Operational Freedom."
          : "Emma analysed 12 competitors and selected Operational Freedom.",
      },
      {
        id: "business-impact",
        title: nl ? "Business impact" : "Business impact",
        summary: nl ? "+18% gekwalificeerde leads verwacht." : "+18% qualified leads expected.",
      },
      {
        id: "approval-summary",
        title: nl ? "Goedkeuring" : "Approval summary",
        summary: nl
          ? "Campagneconcept klaar. Één goedkeuring resterend."
          : "Campaign concept ready. One approval remains.",
      },
    ],
    topDecisions: [],
    decisions: [],
    recommendationSummary: nl
      ? "Verhoog Google Ads-budget — koopintentie presteert 24% beter."
      : "Increase Google Ads budget — purchase intent outperforms by 24%.",
    requiredDecisions: [
      nl ? "Keur campagneconcept Operational Freedom goed." : "Approve campaign concept Operational Freedom.",
    ],
  };

  return buildCampaignBrainOutput({
    ctx: input.ctx,
    outputs: {
      strategy: demoStrategy,
      creative_generation: creativeOutput,
      validation: validationOutput,
    },
    briefing: demoBriefing,
    workflowSteps: input.workflowSteps,
    statusLabel: input.statusLabel,
    deliverableCount: creativeGraph.deliverables.length,
    recommendationHref: input.recommendationHref ?? null,
  });
}

export function buildDemoWorkspaceBrainOutput(ctx: BrainPresentationContext): WorkspaceBrainOutput {
  const domainInput = buildDemoDomainInput({
    locale: ctx.locale,
    now: ctx.now,
  });
  const project = domainInput.projects[0]!;
  const presentationCtx: CampaignBrainPresentationContext = {
    ...resolveBrainPresentationContext({
      peerId: ctx.peerId,
      locale: ctx.locale,
      isDemo: true,
      now: ctx.now,
    }),
    project,
    domainInput,
    campaignContext: buildCampaignContext({
      project,
      domainInput,
      locale: ctx.locale,
    }),
  };

  const campaignBrain = buildDemoCampaignBrainOutput({
    ctx: presentationCtx,
    statusLabel: ctx.locale === "nl" ? "Wacht op goedkeuring" : "Awaiting approval",
    workflowSteps: [],
  });

  return {
    peerId: ctx.peerId,
    generatedAt: campaignBrain.generatedAt,
    executiveSummary: campaignBrain.executiveSummary,
    businessIntelligence: campaignBrain.businessIntelligence,
    recommendations: campaignBrain.recommendations,
    activity: campaignBrain.activity,
    recentDiscoveries: campaignBrain.recentDiscoveries,
    recentDecisions: campaignBrain.recentDecisions,
    confidenceScore: campaignBrain.confidenceScore,
    sources: campaignBrain.sources,
    liveCampaignIntelligence: campaignBrain.liveCampaignIntelligence
      ? [campaignBrain.liveCampaignIntelligence]
      : [],
    executiveApprovals: campaignBrain.executiveApprovals,
  };
}
