/**
 * PX-64 — validate Creative Brain LLM payload before graph mapping.
 */

import {
  channelMatchesApprovedSelection,
  normalizeCreativeChannelId,
  normalizeCreativeDeliverableType,
} from "./creative-generation-contract";
import type { CreativeBrainLlmPayload } from "./creative-brain-llm-schema";
import { findCreativePlaceholderIssues } from "../layers/creative/creative-placeholder-markers";

export type CreativeBrainLlmValidationResult = {
  valid: boolean;
  errors: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value.trim() : "";
}

export function validateCreativeBrainLlmPayload(
  parsed: unknown,
  input?: { approvedChannels?: readonly string[] }
): CreativeBrainLlmValidationResult {
  const errors: string[] = [];
  if (!isRecord(parsed)) {
    return { valid: false, errors: ["payload_not_object"] };
  }

  const deliverables = parsed.deliverables;
  if (!Array.isArray(deliverables) || deliverables.length === 0) {
    errors.push("missing_deliverables");
    return { valid: false, errors };
  }

  for (let i = 0; i < deliverables.length; i += 1) {
    const raw = deliverables[i];
    if (!isRecord(raw)) {
      errors.push(`deliverable_${i}_not_object`);
      continue;
    }

    const deliverableType = normalizeCreativeDeliverableType(
      stringField(raw, "deliverableType") || stringField(raw, "type")
    );
    const channel = normalizeCreativeChannelId(stringField(raw, "channel"));
    const headline = stringField(raw, "headline");
    const hook = stringField(raw, "hook");
    const body = stringField(raw, "body");
    const cta = stringField(raw, "cta");
    const subject = stringField(raw, "subject");

    if (!deliverableType) errors.push(`deliverable_${i}_invalid_type`);
    if (!channel) errors.push(`deliverable_${i}_invalid_channel`);
    if (headline.length < 10) errors.push(`deliverable_${i}_headline_too_short`);
    if (hook.length < 20) errors.push(`deliverable_${i}_hook_too_short`);
    if (body.length < 80) errors.push(`deliverable_${i}_body_too_short`);
    if (cta.length < 5) errors.push(`deliverable_${i}_cta_missing`);

    if (
      channel &&
      input?.approvedChannels?.length &&
      !channelMatchesApprovedSelection(channel, input.approvedChannels)
    ) {
      errors.push(`deliverable_${i}_channel_not_approved`);
    }

    for (const code of findCreativePlaceholderIssues({ headline, hook, body, cta, subject })) {
      errors.push(`deliverable_${i}_${code}`);
    }

    if (deliverableType === "acquisition_email" || deliverableType === "newsletter") {
      if (subject.length < 5) errors.push(`deliverable_${i}_email_subject_missing`);
    }

    if (deliverableType === "google_ads_campaign") {
      const headlines = Array.isArray(raw.headlineVariations)
        ? raw.headlineVariations.filter((h) => typeof h === "string" && h.trim())
        : [];
      if (headlines.length === 0 && headline.length < 10) {
        errors.push(`deliverable_${i}_google_headlines_missing`);
      }
    }
  }

  const messaging = parsed.messaging;
  if (isRecord(messaging)) {
    for (const code of findCreativePlaceholderIssues({
      headline: stringField(messaging, "headline"),
      body: stringField(messaging, "supportingMessage"),
      cta: stringField(messaging, "cta"),
    })) {
      errors.push(`messaging_${code}`);
    }
  } else {
    errors.push("missing_messaging");
  }

  return { valid: errors.length === 0, errors };
}

export function coerceCreativeBrainLlmPayload(parsed: unknown): CreativeBrainLlmPayload | null {
  if (!isRecord(parsed)) return null;
  const validation = validateCreativeBrainLlmPayload(parsed);
  if (!validation.valid) return null;

  const direction = parsed.direction as Record<string, unknown>;
  const campaign = parsed.campaign as Record<string, unknown>;
  const messaging = parsed.messaging as Record<string, unknown>;

  const deliverables = (parsed.deliverables as unknown[]).map((item, index) => {
    const raw = item as Record<string, unknown>;
    return {
      deliverableType:
        normalizeCreativeDeliverableType(
          stringField(raw, "deliverableType") || stringField(raw, "type")
        ) ?? "campaign_concept",
      channel: normalizeCreativeChannelId(stringField(raw, "channel")) ?? "linkedin",
      headline: stringField(raw, "headline"),
      hook: stringField(raw, "hook"),
      body: stringField(raw, "body"),
      cta: stringField(raw, "cta"),
      subject: stringField(raw, "subject") || undefined,
      previewText: stringField(raw, "previewText") || undefined,
      headlineVariations: Array.isArray(raw.headlineVariations)
        ? raw.headlineVariations.map(String).filter(Boolean)
        : undefined,
      descriptionVariations: Array.isArray(raw.descriptionVariations)
        ? raw.descriptionVariations.map(String).filter(Boolean)
        : undefined,
      landingSections: Array.isArray(raw.landingSections)
        ? raw.landingSections
            .filter(isRecord)
            .map((section) => ({
              title: stringField(section, "title"),
              body: stringField(section, "body"),
            }))
            .filter((section) => section.title && section.body)
        : undefined,
      hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.map(String).filter(Boolean) : undefined,
      visualConcept: stringField(raw, "visualConcept") || undefined,
      rationale: stringField(raw, "rationale") || undefined,
    };
  });

  return {
    direction: {
      name: stringField(direction, "name"),
      angle: stringField(direction, "angle"),
      rationale: stringField(direction, "rationale"),
    },
    campaign: {
      name: stringField(campaign, "name"),
      objective: stringField(campaign, "objective"),
      targetAudience: stringField(campaign, "targetAudience"),
      keyMessage: stringField(campaign, "keyMessage"),
    },
    messaging: {
      headline: stringField(messaging, "headline"),
      supportingMessage: stringField(messaging, "supportingMessage"),
      cta: stringField(messaging, "cta"),
      proof: Array.isArray(messaging.proof) ? messaging.proof.map(String).filter(Boolean) : [],
    },
    deliverables,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String).filter(Boolean) : [],
  };
}
