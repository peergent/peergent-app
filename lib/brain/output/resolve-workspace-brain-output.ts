import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { buildCampaignBrainOutput } from "./aggregate/build-campaign-brain-output";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import { buildCampaignExecutiveBriefing } from "@/lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing";
import { buildDemoWorkspaceBrainOutput } from "./demo/demo-brain-output";
import { aggregateConfidence } from "./publish/confidence";
import { resolveBrainPresentationContext } from "./presentation-context";
import type { WorkspaceBrainOutput } from "./types";

export function resolveWorkspaceBrainOutput(input: {
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  isDemo?: boolean;
  now?: Date;
}): WorkspaceBrainOutput | null {
  const ctx = resolveBrainPresentationContext({
    peerId: input.domainInput.peerId,
    locale: input.locale,
    isDemo: input.isDemo,
    now: input.now,
  });

  if (ctx.isDemo) {
    return buildDemoWorkspaceBrainOutput(ctx);
  }

  const activeProjects = input.domainInput.projects.filter((p) => {
    const outputs = readCampaignBrainOutputs(p);
    return Boolean(outputs.strategy || outputs.creative_generation);
  });

  if (activeProjects.length === 0) return null;

  const campaignOutputs = activeProjects.map((project) => {
    const outputs = readCampaignBrainOutputs(project);
    const campaignContext = buildCampaignContext({
      project,
      domainInput: input.domainInput,
      locale: input.locale,
    });

    const briefing = buildCampaignExecutiveBriefing({
      project,
      domainInput: input.domainInput,
      allReviewItems: [],
      locale: input.locale,
    });

    return buildCampaignBrainOutput({
      ctx: {
        ...ctx,
        project,
        domainInput: input.domainInput,
        campaignContext,
      },
      outputs,
      briefing,
      workflowSteps: [],
      statusLabel: project.title,
    });
  });

  const primary = campaignOutputs[0]!;
  const allBullets = campaignOutputs.flatMap((o) => o.businessIntelligence.bullets);
  const allRecs = campaignOutputs.flatMap((o) => o.recommendations);
  const allActivity = campaignOutputs.flatMap((o) => o.activity);
  const allDecisions = campaignOutputs.flatMap((o) => o.recentDecisions);
  const allDiscoveries = campaignOutputs.flatMap((o) => o.recentDiscoveries);

  return {
    peerId: ctx.peerId,
    generatedAt: primary.generatedAt,
    executiveSummary: primary.executiveSummary,
    businessIntelligence: {
      headline: primary.businessIntelligence.headline,
      bullets: allBullets.slice(0, 8),
    },
    recommendations: allRecs.slice(0, 2),
    activity: allActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8),
    recentDiscoveries: allDiscoveries.slice(0, 5),
    recentDecisions: allDecisions.slice(0, 5),
    confidenceScore: aggregateConfidence(campaignOutputs.map((o) => o.confidenceScore)),
    sources: campaignOutputs.flatMap((o) => o.sources),
    liveCampaignIntelligence: campaignOutputs
      .map((o) => o.liveCampaignIntelligence)
      .filter(Boolean) as import("./types").LiveCampaignIntelligence[],
    executiveApprovals: campaignOutputs.flatMap((o) => o.executiveApprovals).slice(0, 3),
  };
}
