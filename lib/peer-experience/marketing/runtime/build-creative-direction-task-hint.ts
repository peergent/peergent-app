import type { Campaign } from "@/lib/campaign";
import type { MarketingDecisionRecord } from "@/lib/marketing-decision";
import type { MarketingStrategy } from "@/lib/marketing-intelligence";

import type { MarketingProject } from "../projects/types";

export function buildCreativeDirectionTaskHint(input: {
  project: MarketingProject;
  campaign: Campaign;
  decision: MarketingDecisionRecord;
  strategy: MarketingStrategy;
}): string {
  const lines = [
    `Prepare creative direction for "${input.project.title}".`,
    `Approved strategy summary: ${input.strategy.summary}`,
    `Campaign goal: ${(input.project.goal ?? "").trim() || input.campaign.description || "See campaign context."}`,
    `Decision objective: ${input.decision.objective}`,
  ];

  if (input.strategy.contentPillars.length) {
    lines.push(
      `Strategy pillars: ${input.strategy.contentPillars
        .slice(0, 4)
        .map((p) => p.name)
        .join(", ")}.`
    );
  }

  lines.push(
    "Produce creative direction only — concept, angle, tone, visual guidance, messaging hierarchy, CTA direction, and brand constraints."
  );

  return lines.join("\n");
}
