import type { CampaignBrainOutput, WorkspaceBrainOutput } from "../types";
import type { BrainPresentationContext } from "../presentation-context";
import { buildCampaignBrainOutput } from "../aggregate/build-campaign-brain-output";
import type { CampaignBrainPresentationContext } from "../presentation-context";

/** Deterministic demo intelligence — structured like live brain output, not ad-hoc UI strings. */
export function buildDemoCampaignBrainOutput(input: {
  ctx: CampaignBrainPresentationContext;
  statusLabel: string;
  workflowSteps: import("@/lib/office/campaign/workflow-types").CampaignWorkflowStep[];
  recommendationHref?: string | null;
}): CampaignBrainOutput {
  const nl = input.ctx.locale === "nl";
  const now = input.ctx.now.toISOString();

  const demoBriefing = {
    title: nl ? "Executive review" : "Executive review",
    preparedAt: now,
    companyName: input.ctx.campaignContext.companyName,
    sections: [
      {
        id: "executive-summary",
        title: nl ? "Executive summary" : "Executive summary",
        summary: nl
          ? "Research ontdekte 8 concurrenten, 132 geïndexeerde pagina's en een prijs-kloof. Strategie koos snelheid als positionering."
          : "Research discovered 8 competitors, 132 indexed pages, and a pricing gap. Strategy chose speed as positioning.",
      },
      {
        id: "business-impact",
        title: nl ? "Business impact" : "Business impact",
        summary: nl ? "€8.400 extra omzet verwacht over zes weken." : "€8,400 additional revenue expected over six weeks.",
      },
      {
        id: "approval-summary",
        title: nl ? "Goedkeuring" : "Approval summary",
        summary: nl
          ? "Drie deliverables klaar. Één goedkeuring resterend."
          : "Three deliverables ready. One approval remains.",
      },
    ],
    topDecisions: [],
    decisions: [],
    recommendationSummary: nl
      ? "Verhoog Google Ads-budget met €250/dag."
      : "Increase Google Ads budget by €250/day.",
    requiredDecisions: [],
  };

  const demoStrategy = {
    capabilityId: "strategy",
    capabilityVersion: "1.0.0",
    findings: [
      {
        id: "f-competitors",
        label: nl ? "Concurrenten" : "Competitors",
        value: nl ? "8 concurrenten" : "8 competitors",
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
    recommendations: [
      {
        id: "rec-budget",
        label: nl ? "Verhoog Google Ads-budget met €250/dag" : "Increase Google Ads budget by €250/day",
        priority: "high" as const,
        provenance: [],
      },
    ],
    actionProposals: [],
    executionResults: [],
    warnings: [],
    errors: [],
    generatedAt: now,
  };

  return buildCampaignBrainOutput({
    ctx: input.ctx,
    outputs: { strategy: demoStrategy },
    briefing: demoBriefing,
    workflowSteps: input.workflowSteps,
    statusLabel: input.statusLabel,
    deliverableCount: 3,
    recommendationHref: input.recommendationHref ?? null,
  });
}

export function buildDemoWorkspaceBrainOutput(ctx: BrainPresentationContext): WorkspaceBrainOutput {
  const nl = ctx.locale === "nl";
  const now = ctx.now.toISOString();

  return {
    peerId: ctx.peerId,
    generatedAt: now,
    executiveSummary: {
      whatWeDiscovered: nl
        ? "Google Ads genereerde 18% meer gekwalificeerde leads dan vorige week."
        : "Google Ads generated 18% more qualified leads than last week.",
      whyItMatters: nl
        ? "LinkedIn-engagement daalde 9% — budget verschuiven loont."
        : "LinkedIn engagement dropped 9% — shifting budget pays off.",
      decisionMade: nl
        ? "Aanbeveling: verhoog Google Ads-budget met €250/dag."
        : "Recommendation: increase Google Ads budget by €250/day.",
      whatHappensNext: nl
        ? "Concurrent X lanceerde een onboarding-campagne — CPC kan stijgen."
        : "Competitor X launched an onboarding campaign — CPC may rise.",
      expectedBusinessImpact: nl
        ? "Organisch SEO groeit door na de juli-update."
        : "Organic SEO continues growing after the July update.",
      narrative: nl
        ? "Google Ads presteert het sterkst. Verschuif budget vóór Q4."
        : "Google Ads is outperforming. Shift budget before Q4.",
    },
    businessIntelligence: {
      headline: nl ? "Business intelligence" : "Business intelligence",
      bullets: [
        {
          id: "demo-bi-1",
          text: nl
            ? "Google Ads genereerde 18% meer gekwalificeerde leads dan vorige week."
            : "Google Ads generated 18% more qualified leads than last week.",
          tone: "positive",
          source: "optimization",
        },
        {
          id: "demo-bi-2",
          text: nl ? "LinkedIn-engagement daalde 9%." : "LinkedIn engagement dropped 9%.",
          tone: "attention",
          source: "marketing_intelligence",
        },
        {
          id: "demo-bi-3",
          text: nl
            ? "Organisch SEO groeit door na de juli-update."
            : "Organic SEO continues growing after the July update.",
          tone: "positive",
          source: "research",
        },
        {
          id: "demo-bi-4",
          text: nl
            ? "Concurrent X lanceerde een campagne rond onboarding."
            : "Competitor X launched a campaign around onboarding.",
          tone: "insight",
          source: "research",
        },
        {
          id: "demo-bi-5",
          text: nl
            ? "Aanbeveling: verhoog Google Ads-budget met €250/dag."
            : "Recommendation: increase Google Ads budget by €250/day.",
          tone: "recommendation",
          source: "strategy",
        },
      ],
    },
    recommendations: [
      {
        id: "demo-rec-1",
        headline: nl ? "Verhoog Google Ads-budget met €250/dag" : "Increase Google Ads budget by €250/day",
        reason: nl
          ? "Google Ads levert 23% hogere ROAS dan LinkedIn over 14 dagen."
          : "Google Ads delivers 23% higher ROAS than LinkedIn over 14 days.",
        expectedOutcome: nl ? "+14 extra leads verwacht" : "+14 extra leads expected",
        confidence: { value: 0.85, label: nl ? "Hoog" : "High" },
        businessImpact: nl ? "+21% ROAS verbetering" : "+21% ROAS improvement",
        whyNow: nl ? "Vóór Q4-budgetbeslissingen." : "Before Q4 budget decisions.",
        href: null,
        source: "strategy",
      },
    ],
    activity: [
      {
        id: "demo-act-1",
        timestamp: new Date(ctx.now.getTime() - 3 * 60_000).toISOString(),
        timeLabel: nl ? "3 minuten geleden" : "3 minutes ago",
        title: nl ? "Google Ads-campagne gepubliceerd" : "Google Ads campaign published",
        subtitle: nl ? "Budget verhoogd met €120." : "Budget increased by €120.",
        tone: "success",
        sourceBrain: "planning",
        whyItMatters: nl ? "Directe impact op leadvolume." : "Direct impact on lead volume.",
        href: null,
      },
      {
        id: "demo-act-2",
        timestamp: new Date(ctx.now.getTime() - 11 * 60_000).toISOString(),
        timeLabel: nl ? "11 minuten geleden" : "11 minutes ago",
        title: nl ? "LinkedIn-post bereikte 12.000 impressies" : "LinkedIn post reached 12,000 impressions",
        subtitle: nl ? "Best presterende content vandaag." : "Top performing content today.",
        tone: "insight",
        sourceBrain: "optimization",
        whyItMatters: nl ? "Valideert contentrichting." : "Validates content direction.",
        href: null,
      },
    ],
    recentDiscoveries: [],
    recentDecisions: [],
    confidenceScore: { value: 0.85, label: nl ? "Hoog" : "High" },
    sources: [{ capabilityId: "strategy", source: "strategy", generatedAt: now }],
  };
}
