import type { Campaign } from "@/lib/campaign";
import type { CreativeBrief } from "@/lib/creative-brief";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";

import type { MarketingProject } from "../projects/types";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";

export function buildLinkedInPostTaskHint(input: {
  project: MarketingProject;
  campaign: Campaign;
  decision: MarketingDecisionRecord;
  strategy: MarketingStrategy;
  creativeBrief: CreativeBrief;
  workUnit: WorkUnit;
}): string {
  const lines = [
    `Write a LinkedIn post for "${input.project.title}" (${input.workUnit.title}).`,
    `Approved strategy summary: ${input.strategy.summary}`,
    `Creative concept: ${input.creativeBrief.campaignGoal.summary}`,
    `Campaign goal: ${(input.project.goal ?? "").trim() || input.campaign.description || "See campaign context."}`,
    `Decision objective: ${input.decision.objective}`,
    `Primary message: ${input.creativeBrief.messagingPriorities.primaryMessage}`,
    "Produce exactly one LinkedIn post with hook, body, CTA, hashtags, suggested image description, and publishing recommendation.",
  ];

  return lines.join("\n");
}
