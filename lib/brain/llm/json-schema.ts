/** JSON schema for strict strategy capability output. */

export const STRATEGY_LLM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["findings", "decisions", "recommendations", "actionProposals", "warnings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "value", "confidence"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          value: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "rationale", "confidence"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          rationale: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "priority"],
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    actionProposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "actionType", "label", "requiresApproval"],
        properties: {
          id: { type: "string" },
          actionType: { type: "string" },
          label: { type: "string" },
          requiresApproval: { type: "boolean" },
        },
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "code", "message"],
        properties: {
          id: { type: "string" },
          code: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
} as const;

export function strategyJsonSchemaInstruction(): string {
  return JSON.stringify(STRATEGY_LLM_JSON_SCHEMA);
}

/** Same structured output shape as strategy — channel planning reuses it. */
export const CHANNEL_PLANNING_LLM_JSON_SCHEMA = STRATEGY_LLM_JSON_SCHEMA;

export function channelPlanningJsonSchemaInstruction(): string {
  return JSON.stringify(CHANNEL_PLANNING_LLM_JSON_SCHEMA);
}

import {
  CREATIVE_CHANNEL_IDS,
  CREATIVE_DELIVERABLE_TYPES,
  CREATIVE_REVIEW_STATUSES,
  CREATIVE_GENERATION_MAX_DELIVERABLES,
  CREATIVE_GENERATION_MAX_KEY_POINTS,
} from "./creative-generation-contract";

const deliverablePlanItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "deliverableType",
    "channel",
    "purpose",
    "targetAudience",
    "objective",
    "messageAngle",
    "keyPoints",
    "callToActionDirection",
    "format",
    "reviewStatus",
    "rationale",
    "dependencies",
    "assumptions",
    "provenance",
  ],
  properties: {
    id: { type: "string", maxLength: 64 },
    deliverableType: { type: "string", enum: [...CREATIVE_DELIVERABLE_TYPES] },
    channel: { type: "string", enum: [...CREATIVE_CHANNEL_IDS] },
    purpose: { type: "string", maxLength: 240 },
    targetAudience: { type: "string", maxLength: 180 },
    objective: { type: "string", maxLength: 240 },
    messageAngle: { type: "string", maxLength: 280 },
    keyPoints: {
      type: "array",
      minItems: 1,
      maxItems: CREATIVE_GENERATION_MAX_KEY_POINTS,
      items: { type: "string", maxLength: 140 },
    },
    callToActionDirection: { type: "string", maxLength: 180 },
    format: { type: "string", maxLength: 180 },
    reviewStatus: { type: "string", enum: [...CREATIVE_REVIEW_STATUSES] },
    rationale: { type: "string", maxLength: 280 },
    dependencies: {
      type: "array",
      maxItems: 4,
      items: { type: "string", maxLength: 120 },
    },
    assumptions: {
      type: "array",
      maxItems: 4,
      items: { type: "string", maxLength: 120 },
    },
    provenance: { type: "string", maxLength: 180 },
  },
} as const;

export const CREATIVE_GENERATION_LLM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["deliverables", "decisions", "recommendations", "actionProposals", "warnings"],
  properties: {
    deliverables: {
      type: "array",
      minItems: 1,
      maxItems: CREATIVE_GENERATION_MAX_DELIVERABLES,
      items: deliverablePlanItemSchema,
    },
    decisions: STRATEGY_LLM_JSON_SCHEMA.properties.decisions,
    recommendations: STRATEGY_LLM_JSON_SCHEMA.properties.recommendations,
    actionProposals: STRATEGY_LLM_JSON_SCHEMA.properties.actionProposals,
    warnings: STRATEGY_LLM_JSON_SCHEMA.properties.warnings,
  },
} as const;

export function creativeGenerationJsonSchemaInstruction(): string {
  return JSON.stringify(CREATIVE_GENERATION_LLM_JSON_SCHEMA);
}
