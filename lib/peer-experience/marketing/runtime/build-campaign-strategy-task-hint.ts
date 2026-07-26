import type { CreativeBrief } from "@/lib/creative-brief";
import type { Campaign } from "@/lib/campaign";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";

import type { MarketingProject } from "../projects/types";

export function buildCampaignStrategyTaskHint(input: {
  project: MarketingProject;
  campaign: Campaign;
  decision: MarketingDecisionRecord;
  brief?: CreativeBrief;
}): string {
  const lines = [
    `Develop the campaign strategy for "${input.project.title}".`,
    `Campaign goal: ${input.project.goal.trim() || input.campaign.description || "See campaign context."}`,
    `Marketing decision objective: ${input.decision.objective}`,
  ];

  if (input.decision.channelRecommendations.length) {
    const channels = input.decision.channelRecommendations
      .filter((c) => c.status === "RECOMMENDED" || c.status === "ALLOWED")
      .slice(0, 6)
      .map((c) => c.label)
      .join(", ");
    if (channels) {
      lines.push(`Policy-aligned channels to consider: ${channels}.`);
    }
  }

  if (input.decision.ctaStrategy.primaryPattern) {
    lines.push(`CTA guidance from policy: ${input.decision.ctaStrategy.primaryPattern}`);
  }

  if (input.brief?.messagingPriorities.primaryMessage?.trim()) {
    lines.push(
      `Creative brief primary message: ${input.brief.messagingPriorities.primaryMessage.trim()}`
    );
  }

  lines.push(
    "Ground recommendations in verified Marketing Understanding and this campaign scope only."
  );

  return lines.join("\n");
}
