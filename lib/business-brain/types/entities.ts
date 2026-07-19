import type {
  FactConfidence,
  FactImportance,
  KnowledgeSourceType,
} from "./graph";

export type BusinessBrainProduct = {
  id: string;
  businessBrainId: string;
  name: string;
  description?: string;
  category?: string;
  pricingModel?: string;
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BrainService = {
  id: string;
  businessBrainId: string;
  name: string;
  description?: string;
  category?: string;
  deliveryModel?: string;
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSegment = {
  id: string;
  businessBrainId: string;
  name: string;
  description?: string;
  segments: string[];
  painPoints: string[];
  buyingTriggers: string[];
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Competitor = {
  id: string;
  businessBrainId: string;
  name: string;
  website?: string;
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type InternalProcess = {
  id: string;
  businessBrainId: string;
  name: string;
  description?: string;
  category?: string;
  steps: string[];
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeSource = {
  id: string;
  businessBrainId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  summary?: string;
  content?: string;
  sourceUrl?: string;
  storageRef?: string;
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type BusinessFact = {
  id: string;
  businessBrainId: string;
  subject: string;
  predicate: string;
  value: string;
  source?: string;
  confidence: FactConfidence;
  verified: boolean;
  importance: FactImportance;
  lastUpdated: string;
  metadata: Record<string, unknown>;
  graphExternalId?: string;
  sortOrder: number;
  createdAt: string;
};

export type BusinessBrain = {
  id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessBrainAggregate = BusinessBrain & {
  products: BusinessBrainProduct[];
  services: BrainService[];
  customerSegments: CustomerSegment[];
  competitors: Competitor[];
  internalProcesses: InternalProcess[];
  knowledgeSources: KnowledgeSource[];
  facts: BusinessFact[];
};

export type CreateProductInput = Omit<
  BusinessBrainProduct,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateServiceInput = Omit<
  BrainService,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateServiceInput = Partial<
  Omit<CreateServiceInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateCustomerSegmentInput = Omit<
  CustomerSegment,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateCustomerSegmentInput = Partial<
  Omit<CreateCustomerSegmentInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateCompetitorInput = Omit<
  Competitor,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateCompetitorInput = Partial<
  Omit<CreateCompetitorInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateInternalProcessInput = Omit<
  InternalProcess,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateInternalProcessInput = Partial<
  Omit<CreateInternalProcessInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateKnowledgeSourceInput = Omit<
  KnowledgeSource,
  "id" | "businessBrainId" | "createdAt" | "updatedAt"
>;

export type UpdateKnowledgeSourceInput = Partial<
  Omit<CreateKnowledgeSourceInput, "metadata"> & { metadata?: Record<string, unknown> }
>;

export type CreateFactInput = Omit<
  BusinessFact,
  "id" | "businessBrainId" | "lastUpdated" | "createdAt"
>;

export type UpdateFactInput = Partial<
  Omit<CreateFactInput, "metadata"> & { metadata?: Record<string, unknown> }
>;
