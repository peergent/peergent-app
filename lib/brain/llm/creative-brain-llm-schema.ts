/**
 * PX-64 — strict JSON schema for final channel-ready creative assets (not plans or directions).
 */

import {
  CREATIVE_CHANNEL_IDS,
  CREATIVE_DELIVERABLE_TYPES,
  CREATIVE_GENERATION_MAX_DELIVERABLES,
  CREATIVE_GENERATION_MIN_DELIVERABLES,
} from "./creative-generation-contract";

const channelAssetSchema = {
  type: "object",
  additionalProperties: false,
  required: ["deliverableType", "channel", "headline", "hook", "body", "cta"],
  properties: {
    deliverableType: { type: "string", enum: [...CREATIVE_DELIVERABLE_TYPES] },
    channel: { type: "string", enum: [...CREATIVE_CHANNEL_IDS] },
    headline: { type: "string", minLength: 10, maxLength: 120 },
    hook: { type: "string", minLength: 20, maxLength: 300 },
    body: { type: "string", minLength: 80, maxLength: 4000 },
    cta: { type: "string", minLength: 5, maxLength: 80 },
    subject: { type: "string", maxLength: 120 },
    previewText: { type: "string", maxLength: 160 },
    headlineVariations: {
      type: "array",
      maxItems: 3,
      items: { type: "string", minLength: 5, maxLength: 90 },
    },
    descriptionVariations: {
      type: "array",
      maxItems: 3,
      items: { type: "string", minLength: 10, maxLength: 160 },
    },
    landingSections: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "body"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 120 },
          body: { type: "string", minLength: 20, maxLength: 600 },
        },
      },
    },
    hashtags: {
      type: "array",
      maxItems: 5,
      items: { type: "string", maxLength: 40 },
    },
    visualConcept: { type: "string", maxLength: 300 },
    rationale: { type: "string", maxLength: 400 },
  },
} as const;

export const CREATIVE_BRAIN_LLM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["direction", "campaign", "messaging", "deliverables", "warnings"],
  properties: {
    direction: {
      type: "object",
      additionalProperties: false,
      required: ["name", "angle", "rationale"],
      properties: {
        name: { type: "string", minLength: 3, maxLength: 120 },
        angle: { type: "string", minLength: 10, maxLength: 300 },
        rationale: { type: "string", minLength: 20, maxLength: 500 },
      },
    },
    campaign: {
      type: "object",
      additionalProperties: false,
      required: ["name", "objective", "targetAudience", "keyMessage"],
      properties: {
        name: { type: "string", minLength: 3, maxLength: 120 },
        objective: { type: "string", minLength: 10, maxLength: 300 },
        targetAudience: { type: "string", minLength: 10, maxLength: 300 },
        keyMessage: { type: "string", minLength: 10, maxLength: 300 },
      },
    },
    messaging: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "supportingMessage", "cta", "proof"],
      properties: {
        headline: { type: "string", minLength: 10, maxLength: 120 },
        supportingMessage: { type: "string", minLength: 20, maxLength: 500 },
        cta: { type: "string", minLength: 5, maxLength: 80 },
        proof: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          items: { type: "string", minLength: 5, maxLength: 200 },
        },
      },
    },
    deliverables: {
      type: "array",
      minItems: CREATIVE_GENERATION_MIN_DELIVERABLES,
      maxItems: CREATIVE_GENERATION_MAX_DELIVERABLES,
      items: channelAssetSchema,
    },
    warnings: {
      type: "array",
      maxItems: 8,
      items: { type: "string", maxLength: 200 },
    },
  },
} as const;

export type CreativeBrainLlmDeliverable = {
  readonly deliverableType: string;
  readonly channel: string;
  readonly headline: string;
  readonly hook: string;
  readonly body: string;
  readonly cta: string;
  readonly subject?: string;
  readonly previewText?: string;
  readonly headlineVariations?: readonly string[];
  readonly descriptionVariations?: readonly string[];
  readonly landingSections?: readonly { readonly title: string; readonly body: string }[];
  readonly hashtags?: readonly string[];
  readonly visualConcept?: string;
  readonly rationale?: string;
};

export type CreativeBrainLlmPayload = {
  readonly direction: {
    readonly name: string;
    readonly angle: string;
    readonly rationale: string;
  };
  readonly campaign: {
    readonly name: string;
    readonly objective: string;
    readonly targetAudience: string;
    readonly keyMessage: string;
  };
  readonly messaging: {
    readonly headline: string;
    readonly supportingMessage: string;
    readonly cta: string;
    readonly proof: readonly string[];
  };
  readonly deliverables: readonly CreativeBrainLlmDeliverable[];
  readonly warnings: readonly string[];
};

export function creativeBrainJsonSchemaInstruction(): string {
  return JSON.stringify(CREATIVE_BRAIN_LLM_JSON_SCHEMA);
}

/**
 * Architecture decision (PX-64): one structured LLM call generates all channel deliverables
 * for a campaign. This preserves cross-channel message consistency, reduces cost versus
 * per-deliverable calls, and matches Planning's batch of CreativeBriefInputs.
 */
export const CREATIVE_BRAIN_LLM_CALL_ARCHITECTURE = "single_batch_structured_call" as const;
