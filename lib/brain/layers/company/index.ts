export {
  COMPANY_LAYER_VERSION,
  type CompanyGraph,
  type CompanyBrainInput,
  type CompanyBrainOutput,
  type CompanyOutput,
  type CompanyFact,
  type CompanyNode,
  type CompanyRelation,
  type CompanyVersion,
  type CompanyKnowledgeSource,
  type CompanyKnowledgeSourceKind,
  type CompanyEvidence,
  type CompanyDomainId,
  type CompanyConfidence,
  type CompanyGraphSnapshot,
  type CompanyHistory,
  type CompanyHistoryEntry,
  type CompanyBrainPayload,
  type CompanySnapshot,
} from "./types";

export { COMPANY_DOMAIN_SPECS, COMPANY_LAYER_ORDER } from "./modules/specs";
export { buildCompanyGraph } from "./build-company-graph";
export { buildCompanyRelations } from "./company-relations";
export { createCompanyVersion, nextCompanyVersion, compareCompanyVersions } from "./company-versioning";
export {
  validateCompanyGraph,
  scoreCompanyQuality,
  type CompanyValidationResult,
} from "./company-validator";
export { mapCompanyGraphToBrainOutput, buildCompanyOutput } from "./company-output";
export {
  CompanyLayer,
  createCompanyLayer,
  collectCompanyGraph,
  type CompanyLayerResult,
} from "./company-layer";
export {
  InMemoryCompanyRepository,
  getDefaultCompanyRepository,
  resetDefaultCompanyRepository,
  appendHistoryEntry,
} from "./company-repository";
export type { CompanyRepository, CompanyStoreRecord } from "./company-repository";
export {
  createFact,
  profileConfidence,
  profileFreshness,
  listFacts,
} from "./company-graph";
export {
  CompanyBrainExecutor,
  createCompanyBrainExecutor,
  companyBrainContract,
  createFromBrainInputs,
} from "./company-brain-executor";
