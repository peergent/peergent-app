export { brandBrainLoader } from "./brand-brain-loader";
export { organizationLoader } from "./organization-loader";
export { peerLoader, objectiveLoader } from "./peer-loader";
export { policyLoader, preferencesLoader } from "./preferences-loader";
export { knowledgeLoader } from "./knowledge-loader";
export { companyDnaLoader } from "./company-dna-loader";
export { businessBrainDomainLoader } from "./business-brain-domain-loader";
export { marketingUnderstandingLoader } from "./marketing-understanding-loader";
export { memoryLoader, toolsLoader, telemetryLoader } from "./brain-loader";
export type { ContextLoader, LoaderContext, ContextSliceResult } from "./base";
export { createStubSource } from "./base";

import { brandBrainLoader } from "./brand-brain-loader";
import { businessBrainDomainLoader } from "./business-brain-domain-loader";
import { marketingUnderstandingLoader } from "./marketing-understanding-loader";
import { memoryLoader, telemetryLoader, toolsLoader } from "./brain-loader";
import { companyDnaLoader } from "./company-dna-loader";
import { knowledgeLoader } from "./knowledge-loader";
import { organizationLoader } from "./organization-loader";
import { objectiveLoader, peerLoader } from "./peer-loader";
import { policyLoader } from "./preferences-loader";
import type { ContextLoader } from "./base";

export const defaultLoaders: ContextLoader<unknown>[] = [
  peerLoader,
  organizationLoader,
  objectiveLoader,
  policyLoader,
  telemetryLoader,
  knowledgeLoader,
  memoryLoader,
  toolsLoader,
  companyDnaLoader,
  businessBrainDomainLoader,
  brandBrainLoader,
  marketingUnderstandingLoader,
];

/** Layers loaded by buildContext() for a complete AI request. */
export const BUILD_CONTEXT_LAZY_LAYERS = [
  "company-dna",
  "business-brain",
  "marketing-understanding",
  "brand-brain",
  "peer-type",
] as const;
