import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import {
  BusinessBrainRepository,
  CompetitorsRepository,
  CustomerSegmentsRepository,
  FactsRepository,
  InternalProcessesRepository,
  KnowledgeSourcesRepository,
  ProductsRepository,
  ServicesRepository,
} from "../repositories";
import type {
  BrainService,
  BusinessBrain,
  BusinessBrainAggregate,
  BusinessBrainProduct,
  BusinessFact,
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
  UpdateCompetitorInput,
  UpdateCustomerSegmentInput,
  UpdateFactInput,
  UpdateInternalProcessInput,
  UpdateKnowledgeSourceInput,
  UpdateProductInput,
  UpdateServiceInput,
} from "../types";

export class BusinessBrainNotFoundError extends Error {
  constructor(message = "Business Brain not found for this organization.") {
    super(message);
    this.name = "BusinessBrainNotFoundError";
  }
}

export class BusinessBrainEntityNotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found.`);
    this.name = "BusinessBrainEntityNotFoundError";
  }
}

export class BusinessBrainService {
  private readonly brainRepo: BusinessBrainRepository;
  private readonly productsRepo: ProductsRepository;
  private readonly servicesRepo: ServicesRepository;
  private readonly segmentsRepo: CustomerSegmentsRepository;
  private readonly competitorsRepo: CompetitorsRepository;
  private readonly processesRepo: InternalProcessesRepository;
  private readonly sourcesRepo: KnowledgeSourcesRepository;
  private readonly factsRepo: FactsRepository;

  constructor(supabase: AppSupabaseClient) {
    this.brainRepo = new BusinessBrainRepository(supabase);
    this.productsRepo = new ProductsRepository(supabase);
    this.servicesRepo = new ServicesRepository(supabase);
    this.segmentsRepo = new CustomerSegmentsRepository(supabase);
    this.competitorsRepo = new CompetitorsRepository(supabase);
    this.processesRepo = new InternalProcessesRepository(supabase);
    this.sourcesRepo = new KnowledgeSourcesRepository(supabase);
    this.factsRepo = new FactsRepository(supabase);
  }

  async getOrCreateBrain(organizationId: string): Promise<BusinessBrain> {
    const existing = await this.brainRepo.findByOrganizationId(organizationId);
    return existing ?? this.brainRepo.create(organizationId);
  }

  async getAggregate(organizationId: string): Promise<BusinessBrainAggregate> {
    const brain = await this.getOrCreateBrain(organizationId);

    const [
      products,
      services,
      customerSegments,
      competitors,
      internalProcesses,
      knowledgeSources,
      facts,
    ] = await Promise.all([
      this.productsRepo.listByBusinessBrainId(brain.id),
      this.servicesRepo.listByBusinessBrainId(brain.id),
      this.segmentsRepo.listByBusinessBrainId(brain.id),
      this.competitorsRepo.listByBusinessBrainId(brain.id),
      this.processesRepo.listByBusinessBrainId(brain.id),
      this.sourcesRepo.listByBusinessBrainId(brain.id),
      this.factsRepo.listByBusinessBrainId(brain.id),
    ]);

    return {
      ...brain,
      products,
      services,
      customerSegments,
      competitors,
      internalProcesses,
      knowledgeSources,
      facts,
    };
  }

  private async requireBrain(organizationId: string): Promise<BusinessBrain> {
    return this.getOrCreateBrain(organizationId);
  }

  private async assertEntityBelongsToOrg(
    organizationId: string,
    businessBrainId: string
  ): Promise<void> {
    const brain = await this.requireBrain(organizationId);
    if (brain.id !== businessBrainId) {
      throw new BusinessBrainNotFoundError();
    }
  }

  // Products
  async listProducts(organizationId: string) {
    const brain = await this.requireBrain(organizationId);
    return this.productsRepo.listByBusinessBrainId(brain.id);
  }

  async createProduct(organizationId: string, input: CreateProductInput) {
    const brain = await this.requireBrain(organizationId);
    return this.productsRepo.create(brain.id, input);
  }

  async updateProduct(organizationId: string, id: string, input: UpdateProductInput) {
    const entity = await this.productsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Product");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.productsRepo.update(id, input);
  }

  async deleteProduct(organizationId: string, id: string) {
    const entity = await this.productsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Product");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.productsRepo.delete(id);
  }

  // Services
  async listServices(organizationId: string): Promise<BrainService[]> {
    const brain = await this.requireBrain(organizationId);
    return this.servicesRepo.listByBusinessBrainId(brain.id);
  }

  async createService(organizationId: string, input: CreateServiceInput) {
    const brain = await this.requireBrain(organizationId);
    return this.servicesRepo.create(brain.id, input);
  }

  async updateService(organizationId: string, id: string, input: UpdateServiceInput) {
    const entity = await this.servicesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Service");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.servicesRepo.update(id, input);
  }

  async deleteService(organizationId: string, id: string) {
    const entity = await this.servicesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Service");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.servicesRepo.delete(id);
  }

  // Customer segments
  async listCustomerSegments(organizationId: string): Promise<CustomerSegment[]> {
    const brain = await this.requireBrain(organizationId);
    return this.segmentsRepo.listByBusinessBrainId(brain.id);
  }

  async createCustomerSegment(organizationId: string, input: CreateCustomerSegmentInput) {
    const brain = await this.requireBrain(organizationId);
    return this.segmentsRepo.create(brain.id, input);
  }

  async updateCustomerSegment(
    organizationId: string,
    id: string,
    input: UpdateCustomerSegmentInput
  ) {
    const entity = await this.segmentsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Customer segment");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.segmentsRepo.update(id, input);
  }

  async deleteCustomerSegment(organizationId: string, id: string) {
    const entity = await this.segmentsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Customer segment");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.segmentsRepo.delete(id);
  }

  // Competitors
  async listCompetitors(organizationId: string): Promise<Competitor[]> {
    const brain = await this.requireBrain(organizationId);
    return this.competitorsRepo.listByBusinessBrainId(brain.id);
  }

  async createCompetitor(organizationId: string, input: CreateCompetitorInput) {
    const brain = await this.requireBrain(organizationId);
    return this.competitorsRepo.create(brain.id, input);
  }

  async updateCompetitor(organizationId: string, id: string, input: UpdateCompetitorInput) {
    const entity = await this.competitorsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Competitor");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.competitorsRepo.update(id, input);
  }

  async deleteCompetitor(organizationId: string, id: string) {
    const entity = await this.competitorsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Competitor");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.competitorsRepo.delete(id);
  }

  // Internal processes
  async listInternalProcesses(organizationId: string): Promise<InternalProcess[]> {
    const brain = await this.requireBrain(organizationId);
    return this.processesRepo.listByBusinessBrainId(brain.id);
  }

  async createInternalProcess(organizationId: string, input: CreateInternalProcessInput) {
    const brain = await this.requireBrain(organizationId);
    return this.processesRepo.create(brain.id, input);
  }

  async updateInternalProcess(
    organizationId: string,
    id: string,
    input: UpdateInternalProcessInput
  ) {
    const entity = await this.processesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Internal process");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.processesRepo.update(id, input);
  }

  async deleteInternalProcess(organizationId: string, id: string) {
    const entity = await this.processesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Internal process");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.processesRepo.delete(id);
  }

  // Knowledge sources
  async listKnowledgeSources(organizationId: string): Promise<KnowledgeSource[]> {
    const brain = await this.requireBrain(organizationId);
    return this.sourcesRepo.listByBusinessBrainId(brain.id);
  }

  async createKnowledgeSource(organizationId: string, input: CreateKnowledgeSourceInput) {
    const brain = await this.requireBrain(organizationId);
    return this.sourcesRepo.create(brain.id, input);
  }

  async updateKnowledgeSource(
    organizationId: string,
    id: string,
    input: UpdateKnowledgeSourceInput
  ) {
    const entity = await this.sourcesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Knowledge source");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.sourcesRepo.update(id, input);
  }

  async deleteKnowledgeSource(organizationId: string, id: string) {
    const entity = await this.sourcesRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Knowledge source");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.sourcesRepo.delete(id);
  }

  // Facts
  async listFacts(organizationId: string): Promise<BusinessFact[]> {
    const brain = await this.requireBrain(organizationId);
    return this.factsRepo.listByBusinessBrainId(brain.id);
  }

  async createFact(organizationId: string, input: CreateFactInput) {
    const brain = await this.requireBrain(organizationId);
    return this.factsRepo.create(brain.id, input);
  }

  async updateFact(organizationId: string, id: string, input: UpdateFactInput) {
    const entity = await this.factsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Fact");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    return this.factsRepo.update(id, input);
  }

  async deleteFact(organizationId: string, id: string) {
    const entity = await this.factsRepo.findById(id);
    if (!entity) throw new BusinessBrainEntityNotFoundError("Fact");
    await this.assertEntityBelongsToOrg(organizationId, entity.businessBrainId);
    await this.factsRepo.delete(id);
  }
}

export function createBusinessBrainService(supabase: AppSupabaseClient): BusinessBrainService {
  return new BusinessBrainService(supabase);
}
