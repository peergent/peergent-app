import type { CampaignExperienceModel } from "@/lib/office/campaign/campaign-experience-types";
import type { CampaignBrainOutput } from "@/lib/brain/output";

function mapAssetKind(
  kind: CampaignBrainOutput["creativeStrategyAssets"][number]["kind"]
): CampaignExperienceModel["assets"][number]["kind"] {
  return kind;
}

/** Map Brain Output Layer → Campaign Experience view model slices. UI layout unchanged. */
export function mapCampaignExperienceFromBrain(input: {
  brain: CampaignBrainOutput;
  nl: boolean;
  performanceHref?: string | null;
}): Pick<
  CampaignExperienceModel,
  "brief" | "progress" | "recommendation" | "activity" | "assets"
> {
  const { brain, nl } = input;
  const narrative = brain.campaignNarrative;
  const sections = brain.briefSections;
  const quality = brain.qualitySummary;

  const approvalRec = brain.publicationBlocked
    ? null
    : brain.executiveApprovals[0];

  const blockedFix = brain.requiredFixes[0];

  const executiveSummaryText = quality
    ? `${sections.executiveSummary}\n\n${quality.narrative}`
    : sections.executiveSummary;

  const nextRecommendationText = blockedFix
    ? [
        nl ? "Publicatie geblokkeerd" : "Publication blocked",
        blockedFix.title,
        nl ? "Waarom dit ertoe doet:" : "Why this matters:",
        blockedFix.whyItMatters,
        nl ? "Business impact:" : "Business impact:",
        blockedFix.businessImpact,
        nl ? "Volgende stap:" : "Next:",
        blockedFix.nextStep,
      ].join("\n")
    : quality
      ? `${sections.nextRecommendation}\n\n${quality.headline}: ${quality.score}/${quality.scoreMax} — ${quality.readinessLabel}.`
      : sections.nextRecommendation;

  return {
    brief: {
      narrative: narrative.executiveSummary.narrative,
      sections: {
        executiveSummary: executiveSummaryText,
        researchFindings: sections.researchFindings,
        audienceInsight: sections.audienceInsight,
        strategicDecision: sections.strategicDecision,
        creativeDirection: sections.creativeDirection,
        expectedBusinessImpact: sections.expectedBusinessImpact,
        nextRecommendation: nextRecommendationText,
      },
    },
    progress: {
      percent: brain.progress.percent,
      statusHeadline: brain.progress.statusHeadline,
      steps: brain.progress.steps.map((step) => ({
        id: step.id,
        label: step.label,
        state: step.state,
        expansion: step.expansion,
      })),
    },
    recommendation: blockedFix
      ? {
          headline: nl ? "Publicatie geblokkeerd" : "Publication blocked",
          impact: `${blockedFix.whyItMatters} · ${blockedFix.businessImpact}`,
          primaryLabel: nl ? "Bekijk wat Emma aanpast" : "See what Emma is revising",
          href: null,
          impactMetrics: undefined,
        }
      : brain.recommendations[0]
        ? {
            headline: brain.recommendations[0].headline,
            impact: `${brain.recommendations[0].reason} · ${brain.recommendations[0].businessImpact}`,
            primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
            href: brain.recommendations[0].href ?? input.performanceHref ?? null,
            impactMetrics: [
              {
                id: "confidence",
                label: `${nl ? "Vertrouwen" : "Confidence"}: ${brain.recommendations[0].confidence.label}`,
              },
            ],
          }
        : approvalRec
          ? {
              headline: approvalRec.title,
              impact: `${approvalRec.reason} · ${approvalRec.businessImpact}`,
              primaryLabel: approvalRec.primaryLabel,
              href: approvalRec.href ?? input.performanceHref ?? null,
              impactMetrics: quality
                ? [
                    {
                      id: "quality-score",
                      label: `${quality.headline}: ${quality.score}/${quality.scoreMax}`,
                    },
                  ]
                : undefined,
            }
          : null,
    activity: brain.activity.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      timeLabel: event.timeLabel,
      message: `${event.title} — ${event.subtitle}`,
      href: event.href,
    })),
    assets: brain.creativeStrategyAssets.map((asset) => ({
      id: asset.id,
      kind: mapAssetKind(asset.kind),
      channelLabel: asset.channelLabel,
      title: asset.title,
      preview: asset.preview,
      statusLabel: asset.statusLabel,
      statusTone: asset.statusTone,
      href: null,
    })),
  };
}
