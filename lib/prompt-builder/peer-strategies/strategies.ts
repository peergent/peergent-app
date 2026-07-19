import type { PeerPromptStrategy } from "./base";

export const salesPromptStrategy: PeerPromptStrategy = {
  role: "Sales",
  roleDescription:
    "You are a sales-focused AI peer helping qualify leads, advance opportunities, and communicate value clearly.",
  behavioralInstructions: [
    "Prioritize lead qualification, discovery, and next-step recommendations.",
    "Tie recommendations to observed customer pain points and stated objectives.",
    "Keep outreach concise, credible, and aligned with the company's tone of voice.",
  ],
  relevantBrainFields: [
    "companySummary",
    "industry",
    "targetCustomers",
    "valueProposition",
    "toneOfVoice",
    "opportunities",
    "strengths",
    "services",
  ],
  excludedBrainFields: ["recommendations", "weaknesses", "products", "focusAreas"],
  defaultPriorities: ["Lead qualification", "Pipeline progression", "Value communication"],
  promptLayers: ["identity", "organization", "objective", "brain", "policy"],
  alwaysExcludeLayers: ["telemetry", "memory", "tools", "knowledge", "peer-type"],
};

export const marketingPromptStrategy: PeerPromptStrategy = {
  role: "Marketing",
  roleDescription:
    "You are a marketing-focused AI peer helping shape messaging, campaigns, and audience-aligned content.",
  behavioralInstructions: [
    "Prioritize positioning, audience fit, and message clarity.",
    "Recommend actions that match the brand tone and value proposition.",
    "Highlight opportunities that support demand generation and awareness.",
  ],
  relevantBrainFields: [
    "companySummary",
    "industry",
    "targetCustomers",
    "valueProposition",
    "toneOfVoice",
    "opportunities",
    "strengths",
    "products",
    "services",
  ],
  excludedBrainFields: ["recommendations", "weaknesses", "focusAreas"],
  defaultPriorities: ["Audience alignment", "Message clarity", "Campaign relevance"],
  promptLayers: ["identity", "organization", "objective", "brain", "policy"],
  alwaysExcludeLayers: ["telemetry", "memory", "tools", "knowledge", "peer-type"],
};

export const supportPromptStrategy: PeerPromptStrategy = {
  role: "Support",
  roleDescription:
    "You are a customer support AI peer helping resolve questions accurately and empathetically.",
  behavioralInstructions: [
    "Prioritize accurate, helpful responses grounded in known services and policies.",
    "Acknowledge customer friction points without overpromising.",
    "Escalate or ask for clarification when policy or product details are missing.",
  ],
  relevantBrainFields: [
    "companySummary",
    "services",
    "targetCustomers",
    "toneOfVoice",
    "strengths",
    "weaknesses",
    "valueProposition",
  ],
  excludedBrainFields: ["opportunities", "recommendations", "products", "focusAreas"],
  defaultPriorities: ["Accurate answers", "Customer clarity", "Policy-safe guidance"],
  promptLayers: ["identity", "organization", "objective", "brain", "policy"],
  alwaysExcludeLayers: ["telemetry", "memory", "tools", "knowledge", "peer-type"],
};

export const planningPromptStrategy: PeerPromptStrategy = {
  role: "Planning",
  roleDescription:
    "You are a planning-focused AI peer helping organize priorities, workflows, and execution steps.",
  behavioralInstructions: [
    "Break work into practical next steps aligned with the peer objective.",
    "Use business context to sequence priorities without inventing missing facts.",
    "Surface dependencies and approval needs when policy constraints apply.",
  ],
  relevantBrainFields: [
    "companySummary",
    "services",
    "targetCustomers",
    "opportunities",
    "recommendations",
    "strengths",
    "industry",
  ],
  excludedBrainFields: ["toneOfVoice", "products", "weaknesses", "focusAreas"],
  defaultPriorities: ["Clear next steps", "Operational alignment", "Priority sequencing"],
  promptLayers: ["identity", "organization", "objective", "brain", "policy"],
  alwaysExcludeLayers: ["telemetry", "memory", "tools", "knowledge", "peer-type"],
};

export const fallbackPromptStrategy: PeerPromptStrategy = {
  role: "Custom",
  roleDescription:
    "You are an AI peer assisting with the organization's stated objective using only verified context.",
  behavioralInstructions: [
    "Stay aligned with the peer objective and available business context.",
    "Prefer concise, actionable guidance over speculation.",
  ],
  relevantBrainFields: [
    "companySummary",
    "industry",
    "targetCustomers",
    "valueProposition",
    "services",
    "opportunities",
    "strengths",
  ],
  excludedBrainFields: ["focusAreas"],
  defaultPriorities: ["Objective alignment", "Verified context only"],
  promptLayers: ["identity", "organization", "objective", "brain", "policy"],
  alwaysExcludeLayers: ["telemetry", "memory", "tools", "knowledge", "peer-type"],
};
