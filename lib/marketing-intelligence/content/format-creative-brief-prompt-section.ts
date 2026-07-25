import type { PromptPackage } from "@/lib/prompt-builder";
import type { CreativeBrief } from "@/lib/creative-brief";

export const CREATIVE_BRIEF_PROMPT_DELIMITER_START = "--- Creative Brief Constraints ---";
export const CREATIVE_BRIEF_PROMPT_DELIMITER_END = "--- End Creative Brief Constraints ---";

/**
 * Precedence (highest first):
 * 1. Platform safety and response validation (parser / schema — not in this section)
 * 2. Explicit user task request when permitted
 * 3. Marketing Decision hard constraints (enforced before brief assembly)
 * 4. Creative Brief constraints (this section)
 * 5. Existing strategy / plan guidance in the task prompt
 * 6. Model creativity
 *
 * Do not use this section to override platform validation or hard decision blocks.
 */

function line(label: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return `${label}: ${trimmed}`;
}

function listSection(title: string, values: readonly string[] | undefined): string | null {
  if (!values?.length) {
    return null;
  }
  return [title, ...values.map((entry) => `- ${entry}`)].join("\n");
}

/** Deterministic Creative Brief prompt section — no JSON, IDs, evidence, or assembly trace. */
export function formatCreativeBriefPromptSection(brief: CreativeBrief): string {
  const blocks: string[] = [
    CREATIVE_BRIEF_PROMPT_DELIMITER_START,
    "Treat the following as binding creative constraints for this draft. They do not replace plan activity requirements or platform validation.",
  ];

  const orderedLines = [
    line("Campaign goal", brief.campaignGoal.summary),
    line("Objective", brief.campaignGoal.objective),
    line("Audience", brief.audience.segmentLabel),
    line("Audience description", brief.audience.description),
    line("Channel", `${brief.channel.channel}${brief.channel.placement ? ` (${brief.channel.placement})` : ""}`),
    line("Content type", brief.contentType),
    line("Tone directive", brief.tone.directive),
    line("Primary CTA guidance", brief.cta.primary),
    line("Secondary CTA guidance", brief.cta.secondary),
    line("Primary message", brief.messagingPriorities.primaryMessage),
    line("Visual guidance", brief.visualPriorities.summary),
    line("Deliverable", brief.outputRequirements.deliverableSummary),
  ].filter((entry): entry is string => Boolean(entry));

  blocks.push(...orderedLines);

  const listBlocks = [
    listSection("Supporting messages", brief.messagingPriorities.supportingMessages),
    listSection("Proof points", brief.messagingPriorities.proofPoints),
    listSection("Tone traits", brief.tone.traits),
    listSection("Tone avoid", brief.tone.avoid),
    listSection("Visual must include", brief.visualPriorities.mustInclude),
    listSection("Visual must avoid", brief.visualPriorities.mustAvoid),
    listSection("Forbidden claims", brief.forbiddenClaims),
    listSection("Forbidden words", brief.forbiddenWords),
    listSection(
      "Required disclaimers",
      brief.requiredDisclaimers.map((d) => d.text)
    ),
    listSection("Platform link rules", brief.platformConstraints.linkRules),
    listSection("Output variants", brief.outputRequirements.variants),
  ].filter((entry): entry is string => Boolean(entry));

  blocks.push(...listBlocks);

  if (brief.platformConstraints.maxCharacters) {
    blocks.push(`Max characters: ${brief.platformConstraints.maxCharacters}`);
  }
  if (brief.platformConstraints.aspectRatio) {
    blocks.push(`Aspect ratio: ${brief.platformConstraints.aspectRatio}`);
  }
  if (brief.platformConstraints.safeZoneNotes?.trim()) {
    blocks.push(`Safe zones: ${brief.platformConstraints.safeZoneNotes.trim()}`);
  }

  if (brief.approvalRequirements.brandReviewRequired) {
    blocks.push("Draft for brand review — do not imply final approval.");
  }
  if (brief.approvalRequirements.legalReviewRequired) {
    blocks.push("Draft for legal review — include required disclaimers verbatim.");
  }
  if (brief.approvalRequirements.notes?.trim()) {
    blocks.push(`Approval notes: ${brief.approvalRequirements.notes.trim()}`);
  }

  blocks.push(CREATIVE_BRIEF_PROMPT_DELIMITER_END);
  return blocks.join("\n");
}

/** Appends deterministic Creative Brief constraints after the legacy task prompt. */
export function enrichMarketingContentPromptPackage(
  promptPackage: PromptPackage,
  brief: CreativeBrief
): PromptPackage {
  return {
    ...promptPackage,
    taskPrompt: `${promptPackage.taskPrompt}\n\n${formatCreativeBriefPromptSection(brief)}`,
    warnings: [...promptPackage.warnings, "Creative Brief constraints applied to content prompt."],
  };
}
