import type { ParsedDelegationIntent } from "./parse-delegation-intent";
import { channelLabel, objectiveLabel } from "./parse-delegation-intent";

export type AssignmentSummary = {
  headline: string;
  deliverables: string[];
  objectiveLine: string;
};

function deliverablesForIntent(intent: ParsedDelegationIntent): string[] {
  const items: string[] = [];
  const channel = intent.channel;

  if (channel === "instagram" || channel === "linkedin" || intent.needsVisual) {
    items.push("Caption");
    if (intent.needsVisual || channel === "instagram") {
      items.push("Image");
    }
    if (channel === "instagram") {
      items.push("Hashtags");
      items.push("Suggested publish time");
    }
  } else if (channel === "newsletter" || channel === "email") {
    items.push("Subject line");
    items.push("Email body");
    items.push("Call to action");
  } else if (channel === "blog") {
    items.push("Article outline");
    items.push("Full blog draft");
    items.push("SEO keywords");
  } else if (channel === "google_ads" || channel === "meta_ads") {
    items.push("Ad copy");
    items.push("Headlines");
    items.push("Call to action");
  } else {
    items.push("Draft content");
    items.push("Call to action");
  }

  return items;
}

export function buildAssignmentSummary(
  intent: ParsedDelegationIntent,
  answers: Record<string, string>,
  brandName = "your business"
): AssignmentSummary {
  const objective = objectiveLabel(intent.objective, answers.objective);
  const deliverable = channelLabel(intent.channel);
  const audience = answers.audience?.trim() || intent.audience;

  const headline = audience
    ? `I'm creating ${deliverable.toLowerCase()} for ${brandName}, aimed at ${audience}.`
    : `I'm creating ${deliverable.toLowerCase()} for ${brandName}.`;

  return {
    headline,
    deliverables: deliverablesForIntent(intent),
    objectiveLine: `Goal: ${objective}`,
  };
}
