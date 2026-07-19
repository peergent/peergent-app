import type { CompanyDna, UpdateCompanyDnaInput } from "@/lib/company-dna";
import type {
  BusinessBrainProduct,
  BrainService,
  Competitor,
  CreateCompetitorInput,
  CreateCustomerSegmentInput,
  CreateFactInput,
  CreateInternalProcessInput,
  CreateKnowledgeSourceInput,
  CreateProductInput,
  CreateServiceInput,
  CustomerSegment,
  InternalProcess,
  KnowledgeSource,
  BusinessFact,
  UpdateCompetitorInput,
  UpdateCustomerSegmentInput,
  UpdateFactInput,
  UpdateInternalProcessInput,
  UpdateKnowledgeSourceInput,
  UpdateProductInput,
  UpdateServiceInput,
} from "@/lib/business-brain";
import type {
  BrandPositioning,
  CreateMarketingContentInput,
  CreateMarketingGoalInput,
  MarketingContentItem,
  MarketingGoal,
  MarketingProfileAggregate,
  UpdateMarketingContentInput,
  UpdateMarketingGoalInput,
  UpdateMarketingProfileInput,
} from "@/lib/marketing-intelligence";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed.");
  }
  return data;
}

export async function fetchCompanyDna(): Promise<CompanyDna> {
  const response = await fetch("/api/company-dna");
  const data = await parseJson<{ companyDna: CompanyDna }>(response);
  return data.companyDna;
}

export async function updateCompanyDna(input: UpdateCompanyDnaInput): Promise<CompanyDna> {
  const response = await fetch("/api/company-dna", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ companyDna: CompanyDna }>(response);
  return data.companyDna;
}

export async function fetchMarketingProfile(): Promise<MarketingProfileAggregate> {
  const response = await fetch("/api/marketing-intelligence");
  const data = await parseJson<{ profile: MarketingProfileAggregate }>(response);
  return data.profile;
}

export async function updateMarketingProfile(
  input: UpdateMarketingProfileInput
): Promise<MarketingProfileAggregate> {
  const response = await fetch("/api/marketing-intelligence", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ profile: MarketingProfileAggregate }>(response);
  return data.profile;
}

type EntityRoutes = {
  list: string;
  item: (id: string) => string;
};

const BRAIN_ROUTES = {
  products: { list: "/api/business-brain/products", item: (id) => `/api/business-brain/products/${id}` },
  services: { list: "/api/business-brain/services", item: (id) => `/api/business-brain/services/${id}` },
  "customer-segments": {
    list: "/api/business-brain/customer-segments",
    item: (id) => `/api/business-brain/customer-segments/${id}`,
  },
  competitors: { list: "/api/business-brain/competitors", item: (id) => `/api/business-brain/competitors/${id}` },
  "internal-processes": {
    list: "/api/business-brain/internal-processes",
    item: (id) => `/api/business-brain/internal-processes/${id}`,
  },
  facts: { list: "/api/business-brain/facts", item: (id) => `/api/business-brain/facts/${id}` },
  "knowledge-sources": {
    list: "/api/business-brain/knowledge-sources",
    item: (id) => `/api/business-brain/knowledge-sources/${id}`,
  },
} as const satisfies Record<string, EntityRoutes>;

export async function listBrainProducts(): Promise<BusinessBrainProduct[]> {
  const data = await parseJson<{ products: BusinessBrainProduct[] }>(
    await fetch(BRAIN_ROUTES.products.list)
  );
  return data.products;
}

export async function createBrainProduct(input: CreateProductInput): Promise<BusinessBrainProduct> {
  const data = await parseJson<{ product: BusinessBrainProduct }>(
    await fetch(BRAIN_ROUTES.products.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.product;
}

export async function updateBrainProduct(
  id: string,
  input: UpdateProductInput
): Promise<BusinessBrainProduct> {
  const data = await parseJson<{ product: BusinessBrainProduct }>(
    await fetch(BRAIN_ROUTES.products.item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.product;
}

export async function deleteBrainProduct(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES.products.item(id), { method: "DELETE" }));
}

export async function listBrainServices(): Promise<BrainService[]> {
  const data = await parseJson<{ services: BrainService[] }>(
    await fetch(BRAIN_ROUTES.services.list)
  );
  return data.services;
}

export async function createBrainService(input: CreateServiceInput): Promise<BrainService> {
  const data = await parseJson<{ service: BrainService }>(
    await fetch(BRAIN_ROUTES.services.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.service;
}

export async function updateBrainService(id: string, input: UpdateServiceInput): Promise<BrainService> {
  const data = await parseJson<{ service: BrainService }>(
    await fetch(BRAIN_ROUTES.services.item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.service;
}

export async function deleteBrainService(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES.services.item(id), { method: "DELETE" }));
}

export async function listCustomerSegments(): Promise<CustomerSegment[]> {
  const data = await parseJson<{ customerSegments: CustomerSegment[] }>(
    await fetch(BRAIN_ROUTES["customer-segments"].list)
  );
  return data.customerSegments;
}

export async function createCustomerSegment(
  input: CreateCustomerSegmentInput
): Promise<CustomerSegment> {
  const data = await parseJson<{ customerSegment: CustomerSegment }>(
    await fetch(BRAIN_ROUTES["customer-segments"].list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.customerSegment;
}

export async function updateCustomerSegment(
  id: string,
  input: UpdateCustomerSegmentInput
): Promise<CustomerSegment> {
  const data = await parseJson<{ customerSegment: CustomerSegment }>(
    await fetch(BRAIN_ROUTES["customer-segments"].item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.customerSegment;
}

export async function deleteCustomerSegment(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES["customer-segments"].item(id), { method: "DELETE" }));
}

export async function listCompetitors(): Promise<Competitor[]> {
  const data = await parseJson<{ competitors: Competitor[] }>(
    await fetch(BRAIN_ROUTES.competitors.list)
  );
  return data.competitors;
}

export async function createCompetitor(input: CreateCompetitorInput): Promise<Competitor> {
  const data = await parseJson<{ competitor: Competitor }>(
    await fetch(BRAIN_ROUTES.competitors.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.competitor;
}

export async function updateCompetitor(id: string, input: UpdateCompetitorInput): Promise<Competitor> {
  const data = await parseJson<{ competitor: Competitor }>(
    await fetch(BRAIN_ROUTES.competitors.item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.competitor;
}

export async function deleteCompetitor(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES.competitors.item(id), { method: "DELETE" }));
}

export async function listInternalProcesses(): Promise<InternalProcess[]> {
  const data = await parseJson<{ internalProcesses: InternalProcess[] }>(
    await fetch(BRAIN_ROUTES["internal-processes"].list)
  );
  return data.internalProcesses;
}

export async function createInternalProcess(
  input: CreateInternalProcessInput
): Promise<InternalProcess> {
  const data = await parseJson<{ internalProcess: InternalProcess }>(
    await fetch(BRAIN_ROUTES["internal-processes"].list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.internalProcess;
}

export async function updateInternalProcess(
  id: string,
  input: UpdateInternalProcessInput
): Promise<InternalProcess> {
  const data = await parseJson<{ internalProcess: InternalProcess }>(
    await fetch(BRAIN_ROUTES["internal-processes"].item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.internalProcess;
}

export async function deleteInternalProcess(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES["internal-processes"].item(id), { method: "DELETE" }));
}

export async function listFacts(): Promise<BusinessFact[]> {
  const data = await parseJson<{ facts: BusinessFact[] }>(await fetch(BRAIN_ROUTES.facts.list));
  return data.facts;
}

export async function createFact(input: CreateFactInput): Promise<BusinessFact> {
  const data = await parseJson<{ fact: BusinessFact }>(
    await fetch(BRAIN_ROUTES.facts.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.fact;
}

export async function updateFact(id: string, input: UpdateFactInput): Promise<BusinessFact> {
  const data = await parseJson<{ fact: BusinessFact }>(
    await fetch(BRAIN_ROUTES.facts.item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.fact;
}

export async function deleteFact(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES.facts.item(id), { method: "DELETE" }));
}

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const data = await parseJson<{ knowledgeSources: KnowledgeSource[] }>(
    await fetch(BRAIN_ROUTES["knowledge-sources"].list)
  );
  return data.knowledgeSources;
}

export async function createKnowledgeSource(
  input: CreateKnowledgeSourceInput
): Promise<KnowledgeSource> {
  const data = await parseJson<{ knowledgeSource: KnowledgeSource }>(
    await fetch(BRAIN_ROUTES["knowledge-sources"].list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.knowledgeSource;
}

export async function updateKnowledgeSource(
  id: string,
  input: UpdateKnowledgeSourceInput
): Promise<KnowledgeSource> {
  const data = await parseJson<{ knowledgeSource: KnowledgeSource }>(
    await fetch(BRAIN_ROUTES["knowledge-sources"].item(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.knowledgeSource;
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await parseJson(await fetch(BRAIN_ROUTES["knowledge-sources"].item(id), { method: "DELETE" }));
}

export async function listMarketingGoals(): Promise<MarketingGoal[]> {
  const data = await parseJson<{ goals: MarketingGoal[] }>(
    await fetch("/api/marketing-intelligence/goals")
  );
  return data.goals;
}

export async function createMarketingGoal(input: CreateMarketingGoalInput): Promise<MarketingGoal> {
  const data = await parseJson<{ goal: MarketingGoal }>(
    await fetch("/api/marketing-intelligence/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.goal;
}

export async function updateMarketingGoal(
  id: string,
  input: UpdateMarketingGoalInput
): Promise<MarketingGoal> {
  const data = await parseJson<{ goal: MarketingGoal }>(
    await fetch(`/api/marketing-intelligence/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.goal;
}

export async function deleteMarketingGoal(id: string): Promise<void> {
  await parseJson(await fetch(`/api/marketing-intelligence/goals/${id}`, { method: "DELETE" }));
}

export async function listMarketingContent(): Promise<MarketingContentItem[]> {
  const data = await parseJson<{ contentItems: MarketingContentItem[] }>(
    await fetch("/api/marketing-intelligence/content")
  );
  return data.contentItems;
}

export async function createMarketingContent(
  input: CreateMarketingContentInput
): Promise<MarketingContentItem> {
  const data = await parseJson<{ contentItem: MarketingContentItem }>(
    await fetch("/api/marketing-intelligence/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.contentItem;
}

export async function updateMarketingContent(
  id: string,
  input: UpdateMarketingContentInput
): Promise<MarketingContentItem> {
  const data = await parseJson<{ contentItem: MarketingContentItem }>(
    await fetch(`/api/marketing-intelligence/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
  );
  return data.contentItem;
}

export async function deleteMarketingContent(id: string): Promise<void> {
  await parseJson(await fetch(`/api/marketing-intelligence/content/${id}`, { method: "DELETE" }));
}

export type { BrandPositioning };
