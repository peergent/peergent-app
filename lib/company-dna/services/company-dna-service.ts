import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { CompanyDnaRepository } from "../repositories";
import type { CompanyDna, UpdateCompanyDnaInput } from "../types";

export class CompanyDnaNotFoundError extends Error {
  constructor(message = "Company DNA not found for this organization.") {
    super(message);
    this.name = "CompanyDnaNotFoundError";
  }
}

export class CompanyDnaService {
  private readonly repo: CompanyDnaRepository;

  constructor(supabase: AppSupabaseClient) {
    this.repo = new CompanyDnaRepository(supabase);
  }

  async getOrCreate(organizationId: string): Promise<CompanyDna> {
    const existing = await this.repo.findByOrganizationId(organizationId);
    return existing ?? this.repo.create(organizationId);
  }

  async update(organizationId: string, input: UpdateCompanyDnaInput): Promise<CompanyDna> {
    const dna = await this.getOrCreate(organizationId);
    return this.repo.update(dna.id, input);
  }
}

export function createCompanyDnaService(supabase: AppSupabaseClient): CompanyDnaService {
  return new CompanyDnaService(supabase);
}
