import type { WorkspaceBrainOutput } from "@/lib/brain/output";
import type {
  MarketingChartMetricOption,
  MarketingWorkspaceActivityBand,
  MarketingWorkspaceBiBullet,
  MarketingWorkspaceBands,
} from "@/lib/office/workspace/types";

export type WorkspaceBrainSlices = {
  biBulletsByMetric: Record<string, readonly MarketingWorkspaceBiBullet[]>;
  defaultBiBullets: readonly MarketingWorkspaceBiBullet[];
  activity: MarketingWorkspaceActivityBand;
  recommendation: MarketingWorkspaceBands["recommendation"];
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

/** Map Brain Output Layer → Marketing Workspace band slices. UI layout unchanged. */
export function mapWorkspaceSlicesFromBrain(input: {
  brain: WorkspaceBrainOutput;
  nl: boolean;
  performanceHref: string;
}): WorkspaceBrainSlices {
  const { brain, nl } = input;
  const defaultBullets = mapBiBullets(brain.businessIntelligence.bullets);

  const topRec = brain.recommendations[0];

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
