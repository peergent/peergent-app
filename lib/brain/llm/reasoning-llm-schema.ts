/** JSON schema for Reasoning Brain LLM output. */

export const REASONING_LLM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "interpretations",
    "opportunities",
    "risks",
    "hypotheses",
    "contradictions",
    "unknowns",
    "strategicImplications",
  ],
  properties: {
    interpretations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "summary", "confidence", "importance", "supportedEvidenceIds", "claimType"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          importance: { type: "string", enum: ["low", "medium", "high", "critical"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
          claimType: { type: "string", enum: ["OBSERVATION", "INFERENCE", "UNKNOWN"] },
        },
      },
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "description", "reason", "confidence", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          reason: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "description", "severity", "confidence", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    hypotheses: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "statement", "confidence", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          statement: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    contradictions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "companyClaim", "researchClaim", "interpretation", "confidence"],
        properties: {
          id: { type: "string" },
          companyClaim: { type: "string" },
          researchClaim: { type: "string" },
          interpretation: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    unknowns: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "question", "reason"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    strategicImplications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "summary", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          summary: { type: "string" },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export type ReasoningLlmPayload = {
  interpretations: Array<{
    id: string;
    title: string;
    summary: string;
    confidence: "low" | "medium" | "high";
    importance: "low" | "medium" | "high" | "critical";
    supportedEvidenceIds: string[];
    claimType: "OBSERVATION" | "INFERENCE" | "UNKNOWN";
  }>;
  opportunities: Array<{
    id: string;
    description: string;
    reason: string;
    confidence: "low" | "medium" | "high";
    supportedEvidenceIds: string[];
  }>;
  risks: Array<{
    id: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    confidence: "low" | "medium" | "high";
    supportedEvidenceIds: string[];
  }>;
  hypotheses: Array<{
    id: string;
    statement: string;
    confidence: "low" | "medium" | "high";
    supportedEvidenceIds: string[];
  }>;
  contradictions: Array<{
    id: string;
    companyClaim: string;
    researchClaim: string;
    interpretation: string;
    confidence: "low" | "medium" | "high";
  }>;
  unknowns: Array<{ id: string; question: string; reason: string }>;
  strategicImplications: Array<{ id: string; summary: string; supportedEvidenceIds: string[] }>;
};
