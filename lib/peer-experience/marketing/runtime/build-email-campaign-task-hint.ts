import type { Campaign } from "@/lib/campaign";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

import type { MarketingProject } from "../projects/types";

export function buildEmailCampaignTaskHint(input: {
  project: MarketingProject;
  campaign: Campaign;
  decision: MarketingDecisionRecord;
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
  workUnit: WorkUnit;
}): string {
  const lines = [
    `Write a marketing email for "${input.project.title}" (${input.workUnit.title}).`,
    `Channel: ${input.workUnit.channel}`,
    `Approved strategy summary: ${input.strategy.summary}`,
    `Creative concept: ${input.creativeBrief.campaignGoal.summary}`,
    `Campaign goal: ${(input.project.goal ?? "").trim() || input.campaign.description || "See campaign context."}`,
    `Decision objective: ${input.decision.objective}`,
    `Primary message: ${input.creativeBrief.messagingPriorities.primaryMessage}`,
    "Produce exactly one email with subject, preview text, body, CTA, and optional send timing guidance.",
  ];

  const channelLabels =
    input.campaign.execution?.channels?.map((c) => c.label?.trim()).filter(Boolean) ?? [];
  if (channelLabels.length) {
    lines.push(`Campaign channels: ${channelLabels.join(", ")}.`);
  }

  return lines.join("\n");
}
