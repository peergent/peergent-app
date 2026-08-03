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
