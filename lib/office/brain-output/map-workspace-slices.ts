import type { WorkspaceBrainOutput } from "@/lib/brain/output";
import type {
  MarketingChartMetricOption,
  MarketingWorkspaceActivityBand,
  MarketingWorkspaceApprovalItem,
  MarketingWorkspaceBiBullet,
  MarketingWorkspaceBands,
  MarketingWorkspaceCampaignCard,
} from "@/lib/office/workspace/types";

export type WorkspaceBrainSlices = {
  biBulletsByMetric: Record<string, readonly MarketingWorkspaceBiBullet[]>;
  defaultBiBullets: readonly MarketingWorkspaceBiBullet[];
  activity: MarketingWorkspaceActivityBand;
  recommendation: MarketingWorkspaceBands["recommendation"];
  campaignCards: readonly MarketingWorkspaceCampaignCard[];
  approvals: MarketingWorkspaceBands["approvals"];
};

function mapBulletTone(
  tone: WorkspaceBrainOutput["businessIntelligence"]["bullets"][number]["tone"]
): MarketingWorkspaceBiBullet["tone"] {
  return tone;
}

function mapBiBullets(
  bullets: WorkspaceBrainOutput["businessIntelligence"]["bullets"]
): readonly MarketingWorkspaceBiBullet[] {
  return bullets.map((b) => ({
    id: b.id,
    text: b.text,
    tone: mapBulletTone(b.tone),
  }));
}

function enrichCampaignCard(
  card: MarketingWorkspaceCampaignCard,
  intel: WorkspaceBrainOutput["liveCampaignIntelligence"][number] | undefined,
  nl: boolean
): MarketingWorkspaceCampaignCard {
  if (!intel || intel.campaignId !== card.id) return card;

  return {
    ...card,
    previewHeadline: intel.primaryMessage,
    previewBody: [
      nl ? `Hoek: ${intel.angle}` : `Angle: ${intel.angle}`,
      nl ? `Waarom gekozen: ${intel.reasonSelected}` : `Why selected: ${intel.reasonSelected}`,
      nl ? `Verwachte impact: ${intel.expectedOutcome}` : `Expected impact: ${intel.expectedOutcome}`,
    ].join("\n"),
    progressCaption: intel.reasonSelected,
    milestoneLabel: intel.expectedOutcome,
  };
}

function mapExecutiveApprovals(
  actions: WorkspaceBrainOutput["executiveApprovals"],
  nl: boolean
): MarketingWorkspaceApprovalItem[] {
  return actions.map((action) => ({
    id: action.id,
    title: action.title,
    unblocks: `${action.reason} ${action.businessImpact}`,
    primaryLabel: action.primaryLabel,
    href: action.href ?? "/inbox",
    ageLabel: null,
  }));
}

/** Map Brain Output Layer → Marketing Workspace band slices. UI layout unchanged. */
export function mapWorkspaceSlicesFromBrain(input: {
  brain: WorkspaceBrainOutput;
  nl: boolean;
  performanceHref: string;
  existingCampaignCards?: readonly MarketingWorkspaceCampaignCard[];
}): WorkspaceBrainSlices {
  const { brain, nl } = input;
  const defaultBullets = mapBiBullets(brain.businessIntelligence.bullets);
  const topRec = brain.recommendations[0];

  const intelByCampaign = new Map(
    brain.liveCampaignIntelligence.map((intel) => [intel.campaignId, intel])
  );

  const campaignCards = (input.existingCampaignCards ?? []).map((card) =>
    enrichCampaignCard(card, intelByCampaign.get(card.id), nl)
  );

  const approvals =
    brain.executiveApprovals.length > 0
      ? {
          items: mapExecutiveApprovals(brain.executiveApprovals, nl),
          totalCount: brain.executiveApprovals.length,
          overflowLabel: null,
          overflowHref: "/inbox",
        }
      : null;

  return {
    defaultBiBullets: defaultBullets,
    biBulletsByMetric: {
      revenue: defaultBullets,
      leads: defaultBullets,
      traffic: defaultBullets,
      roas: defaultBullets,
      ctr: defaultBullets,
      cpc: defaultBullets,
      spend: defaultBullets,
    },
    activity: {
      title: nl ? "Recente activiteit" : "Recent activity",
      items: brain.activity.map((event) => ({
        id: event.id,
        timestamp: event.timestamp,
        timeLabel: event.timeLabel,
        title: event.title,
        subtitle: event.subtitle,
        tone: event.tone,
        href: event.href,
      })),
      emptyMessage: null,
    },
    recommendation: topRec
      ? {
          headline: topRec.headline,
          impact: `${topRec.reason} ${topRec.businessImpact}`,
          primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
          href: topRec.href ?? input.performanceHref,
          impactMetrics: [
            {
              id: "confidence",
              label: `${nl ? "Vertrouwen" : "Confidence"}: ${topRec.confidence.label}`,
            },
          ],
        }
      : null,
    campaignCards,
    approvals,
  };
}

/** Apply brain BI bullets to performance metrics when present. */
export function applyBrainBulletsToMetrics(
  metrics: readonly MarketingChartMetricOption[],
  bulletsByMetric: Record<string, readonly MarketingWorkspaceBiBullet[]>,
  defaultBullets: readonly MarketingWorkspaceBiBullet[]
): MarketingChartMetricOption[] {
  return metrics.map((metric) => ({
    ...metric,
    bullets: bulletsByMetric[metric.id]?.length
      ? bulletsByMetric[metric.id]!
      : defaultBullets.length > 0
        ? defaultBullets
        : metric.bullets,
  }));
}
