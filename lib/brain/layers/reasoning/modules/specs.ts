import type { ReasoningModuleSpec } from "../reasoning-module";

export const BUSINESS_REASONING_SPEC: ReasoningModuleSpec = {
  id: "business_reasoning",
  version: "1.0.0",
  purpose: "Build internal business model — what is sold, to whom, why, differentiation, maturity.",
  implemented: true,
  inputDescription: "ResearchGraph company, products, services evidence.",
  outputDescription: "BusinessModel nodes with confidence — no strategy.",
};

export const CUSTOMER_REASONING_SPEC: ReasoningModuleSpec = {
  id: "customer_reasoning",
  version: "1.0.0",
  purpose: "Infer ICP, pain points, motivations, buying triggers — never invent personas.",
  implemented: true,
  inputDescription: "ResearchGraph audience and campaign context evidence.",
  outputDescription: "CustomerModel nodes or explicit unknowns.",
};

export const COMPETITOR_REASONING_SPEC: ReasoningModuleSpec = {
  id: "competitor_reasoning",
  version: "1.0.0",
  purpose: "Transform competitor research into landscape understanding.",
  implemented: true,
  inputDescription: "ResearchGraph competitors evidence.",
  outputDescription: "CompetitiveLandscape nodes — no market share invention.",
};

export const OFFER_REASONING_SPEC: ReasoningModuleSpec = {
  id: "offer_reasoning",
  version: "1.0.0",
  purpose: "Understand offer structure and pricing signals — unknown when absent.",
  implemented: false,
  inputDescription: "ResearchGraph offer and products evidence.",
  outputDescription: "BusinessModel supplement nodes.",
};

export const BRAND_REASONING_SPEC: ReasoningModuleSpec = {
  id: "brand_reasoning",
  version: "1.0.0",
  purpose: "Understand brand expression and consistency signals.",
  implemented: false,
  inputDescription: "ResearchGraph brand evidence.",
  outputDescription: "StrategicThemes and market position signals.",
};

export const MARKET_REASONING_SPEC: ReasoningModuleSpec = {
  id: "market_reasoning",
  version: "1.0.0",
  purpose: "Infer market category and maturity — unknown when insufficient evidence.",
  implemented: false,
  inputDescription: "ResearchGraph market and industry evidence.",
  outputDescription: "MarketPosition supplement nodes.",
};

export const POSITIONING_REASONING_SPEC: ReasoningModuleSpec = {
  id: "positioning_reasoning",
  version: "1.0.0",
  purpose: "Infer premium, budget, specialist, generalist, innovator, local, leader, emerging.",
  implemented: true,
  inputDescription: "ResearchGraph positioning and website language.",
  outputDescription: "MarketPosition nodes or Unknown.",
};

export const RISK_REASONING_SPEC: ReasoningModuleSpec = {
  id: "risk_reasoning",
  version: "1.0.0",
  purpose: "Detect risks from evidence gaps and competitive pressure.",
  implemented: true,
  inputDescription: "ResearchGraph risks, unknowns, competitors.",
  outputDescription: "Risk nodes with evidence — no mitigation recommendations.",
};

export const OPPORTUNITY_REASONING_SPEC: ReasoningModuleSpec = {
  id: "opportunity_reasoning",
  version: "1.0.0",
  purpose: "Identify opportunities from research — not action recommendations.",
  implemented: true,
  inputDescription: "ResearchGraph opportunities, SEO, website gaps.",
  outputDescription: "Opportunity understanding nodes only.",
};

export const CONSTRAINT_REASONING_SPEC: ReasoningModuleSpec = {
  id: "constraint_reasoning",
  version: "1.0.0",
  purpose: "Detect constraints Strategy must respect — budget unknown, single location, etc.",
  implemented: true,
  inputDescription: "ResearchGraph unknowns and profile gaps.",
  outputDescription: "Constraint nodes for downstream Strategy.",
};

export const PATTERN_RECOGNITION_SPEC: ReasoningModuleSpec = {
  id: "pattern_recognition",
  version: "1.0.0",
  purpose: "Discover cross-evidence patterns with provenance.",
  implemented: true,
  inputDescription: "Combined ResearchGraph evidence signals.",
  outputDescription: "Pattern nodes linking multiple evidence refs.",
};

export const CONTRADICTION_DETECTION_SPEC: ReasoningModuleSpec = {
  id: "contradiction_detection",
  version: "1.0.0",
  purpose: "Detect conflicting evidence — reduce confidence, never hide.",
  implemented: true,
  inputDescription: "ResearchGraph evidence pairs.",
  outputDescription: "Contradiction nodes with unresolved status.",
};

export const UNKNOWN_RESOLUTION_SPEC: ReasoningModuleSpec = {
  id: "unknown_resolution",
  version: "1.0.0",
  purpose: "Preserve and propagate unknowns — future Layers must not hallucinate.",
  implemented: true,
  inputDescription: "ResearchGraph unknowns.",
  outputDescription: "ReasoningUnknown nodes carried forward.",
};

export const REASONING_MODULE_SPECS: readonly ReasoningModuleSpec[] = [
  BUSINESS_REASONING_SPEC,
  CUSTOMER_REASONING_SPEC,
  COMPETITOR_REASONING_SPEC,
  OFFER_REASONING_SPEC,
  BRAND_REASONING_SPEC,
  MARKET_REASONING_SPEC,
  POSITIONING_REASONING_SPEC,
  RISK_REASONING_SPEC,
  OPPORTUNITY_REASONING_SPEC,
  CONSTRAINT_REASONING_SPEC,
  PATTERN_RECOGNITION_SPEC,
  CONTRADICTION_DETECTION_SPEC,
  UNKNOWN_RESOLUTION_SPEC,
];

export function getReasoningModuleSpec(id: ReasoningModuleSpec["id"]): ReasoningModuleSpec {
  const spec = REASONING_MODULE_SPECS.find((s) => s.id === id);
  if (!spec) throw new Error(`Unknown reasoning module: ${id}`);
  return spec;
}
