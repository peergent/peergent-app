import type { MarketingContentDraft } from "@/lib/marketing-intelligence";

/** Emma explains deliverable choices — max 5 grounded bullets. */
export function buildEmmaRationaleBullets(draft: MarketingContentDraft): string[] {
  const bullets: string[] = [];

  if (draft.rationale?.why) bullets.push(draft.rationale.why);
  if (draft.targetAudience) {
    bullets.push(`I wrote this for ${draft.targetAudience}.`);
  }
  if (draft.callToAction) {
    bullets.push(`The call-to-action focuses on: "${draft.callToAction}".`);
  }
  if (draft.keywords.length > 0) {
    bullets.push(`I prioritized ${draft.keywords.slice(0, 3).join(", ")} from your strategy.`);
  }
  if (
    draft.contentType.includes("social") ||
    (draft.channel ?? "").toLowerCase().includes("instagram")
  ) {
    bullets.push("I used a 4:5 visual format for stronger feed visibility on Instagram.");
  }

  if (bullets.length === 0) {
    bullets.push("This direction aligns with what has performed well for your audience.");
  }

  return bullets.slice(0, 5);
}
