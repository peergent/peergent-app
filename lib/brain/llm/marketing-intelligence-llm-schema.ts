/** JSON schema for Marketing Intelligence Brain LLM output. */

export const MARKETING_INTELLIGENCE_LLM_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "audienceIntelligence",
    "competitorIntelligence",
    "positioningIntelligence",
    "messagingIntelligence",
    "channelImplications",
    "opportunities",
    "risks",
    "campaignRecommendations",
  ],
  properties: {
    audienceIntelligence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "summary", "classification", "supportedEvidenceIds", "reasoningEvidenceIds"],
        properties: {
          id: { type: "string" },
          summary: { type: "string" },
          classification: { type: "string", enum: ["OBSERVED", "DERIVED", "HISTORICAL", "UNKNOWN"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
          reasoningEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    competitorIntelligence: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "summary", "classification", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          summary: { type: "string" },
          classification: { type: "string", enum: ["OBSERVED", "DERIVED", "HISTORICAL", "UNKNOWN"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    positioningIntelligence: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "classification", "supportedEvidenceIds"],
      properties: {
        summary: { type: "string" },
        classification: { type: "string", enum: ["OBSERVED", "DERIVED", "HISTORICAL", "UNKNOWN"] },
        supportedEvidenceIds: { type: "array", items: { type: "string" } },
      },
    },
    messagingIntelligence: {
      type: "object",
      additionalProperties: false,
      required: ["dominantThemes", "differentiationAngles", "classification", "supportedEvidenceIds"],
      properties: {
        dominantThemes: { type: "array", items: { type: "string" } },
        differentiationAngles: { type: "array", items: { type: "string" } },
        classification: { type: "string", enum: ["OBSERVED", "DERIVED", "HISTORICAL", "UNKNOWN"] },
        supportedEvidenceIds: { type: "array", items: { type: "string" } },
      },
    },
    channelImplications: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["channel", "implication", "classification"],
        properties: {
          channel: { type: "string" },
          implication: { type: "string" },
          classification: { type: "string", enum: ["OBSERVED", "DERIVED", "UNKNOWN"] },
        },
      },
    },
    opportunities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "description", "classification", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          classification: { type: "string", enum: ["OBSERVED", "DERIVED", "UNKNOWN"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "description", "classification", "supportedEvidenceIds"],
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          classification: { type: "string", enum: ["OBSERVED", "DERIVED", "UNKNOWN"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
        },
      },
    },
    campaignRecommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "recommendation", "classification", "supportedEvidenceIds", "reasoningRefs"],
        properties: {
          id: { type: "string" },
          recommendation: { type: "string" },
          classification: { type: "string", enum: ["DERIVED", "UNKNOWN"] },
          supportedEvidenceIds: { type: "array", items: { type: "string" } },
          reasoningRefs: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export type MarketingIntelligenceLlmPayload = {
  audienceIntelligence: Array<{
    id: string;
    summary: string;
    classification: "OBSERVED" | "DERIVED" | "HISTORICAL" | "UNKNOWN";
    supportedEvidenceIds: string[];
    reasoningEvidenceIds: string[];
  }>;
  competitorIntelligence: Array<{
    id: string;
    summary: string;
    classification: "OBSERVED" | "DERIVED" | "HISTORICAL" | "UNKNOWN";
    supportedEvidenceIds: string[];
  }>;
  positioningIntelligence: {
    summary: string;
    classification: "OBSERVED" | "DERIVED" | "HISTORICAL" | "UNKNOWN";
    supportedEvidenceIds: string[];
  };
  messagingIntelligence: {
    dominantThemes: string[];
    differentiationAngles: string[];
    classification: "OBSERVED" | "DERIVED" | "HISTORICAL" | "UNKNOWN";
    supportedEvidenceIds: string[];
  };
  channelImplications: Array<{
    channel: string;
    implication: string;
    classification: "OBSERVED" | "DERIVED" | "UNKNOWN";
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    classification: "OBSERVED" | "DERIVED" | "UNKNOWN";
    supportedEvidenceIds: string[];
  }>;
  risks: Array<{
    id: string;
    description: string;
    classification: "OBSERVED" | "DERIVED" | "UNKNOWN";
    supportedEvidenceIds: string[];
  }>;
  campaignRecommendations: Array<{
    id: string;
    recommendation: string;
    classification: "DERIVED" | "UNKNOWN";
    supportedEvidenceIds: string[];
    reasoningRefs: string[];
  }>;
};
