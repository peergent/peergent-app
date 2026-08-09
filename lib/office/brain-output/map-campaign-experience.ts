import type { CampaignExperienceModel } from "@/lib/office/campaign/campaign-experience-types";
import type { CampaignBrainOutput } from "@/lib/brain/output";

/** Map Brain Output Layer → Campaign Experience view model slices. UI layout unchanged. */
export function mapCampaignExperienceFromBrain(input: {
  brain: CampaignBrainOutput;
  nl: boolean;
  performanceHref?: string | null;
}): Pick<
  CampaignExperienceModel,
  "brief" | "progress" | "recommendation" | "activity"
> {
  const { brain, nl } = input;
  const narrative = brain.campaignNarrative;

  return {
    brief: {
      narrative: narrative.executiveSummary.narrative,
      sections: {
        executiveSummary: narrative.executiveSummary.whatWeDiscovered,
        businessGoal: narrative.sections.businessGoal,
        currentStatus: narrative.sections.currentStatus,
        expectedImpact: narrative.sections.expectedImpact,
        nextDecision: narrative.sections.nextDecision,
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
    recommendation: brain.recommendations[0]
      ? {
          headline: brain.recommendations[0].headline,
          impact: `${brain.recommendations[0].businessImpact} · ${brain.recommendations[0].whyNow}`,
          primaryLabel: nl ? "Bekijk aanbeveling" : "View recommendation",
          href: brain.recommendations[0].href ?? input.performanceHref ?? null,
          impactMetrics: [
            {
              id: "confidence",
              label: `${nl ? "Vertrouwen" : "Confidence"}: ${brain.recommendations[0].confidence.label}`,
            },
          ],
        }
      : null,
    activity: brain.activity.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      timeLabel: event.timeLabel,
      message: `${event.title} — ${event.subtitle}`,
      href: event.href,
    })),
  };
}
