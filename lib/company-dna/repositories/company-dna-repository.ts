import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CompanyDna, UpdateCompanyDnaInput } from "../types";
import {
  parseDecisionPrinciples,
  parseRiskProfile,
  parseToneOfVoice,
  parseValues,
  requireOrganizationId,
  toJson,
} from "./mappers";

type CompanyDnaRow = Database["public"]["Tables"]["company_dna"]["Row"];

function mapRow(row: CompanyDnaRow): CompanyDna {
  return {
    id: row.id,
    organizationId: row.organization_id,
    mission: row.mission ?? undefined,
    values: parseValues(row.values),
    toneOfVoice: parseToneOfVoice(row.tone_of_voice),
    riskProfile: parseRiskProfile(row.risk_profile),
    decisionPrinciples: parseDecisionPrinciples(row.decision_principles),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CompanyDnaRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async findByOrganizationId(organizationId: string): Promise<CompanyDna | null> {
    const { data, error } = await this.supabase
      .from("company_dna")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load Company DNA: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(organizationId: string | null | undefined): Promise<CompanyDna> {
    const orgId = requireOrganizationId(organizationId);

    const { data, error } = await this.supabase
      .from("company_dna")
      .insert({
        organization_id: orgId,
        values: toJson([]),
        tone_of_voice: toJson({}),
        risk_profile: toJson({}),
        decision_principles: toJson([]),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create Company DNA: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateCompanyDnaInput): Promise<CompanyDna> {
    const payload: Database["public"]["Tables"]["company_dna"]["Update"] = {};

    if (input.mission !== undefined) payload.mission = input.mission ?? null;
    if (input.values !== undefined) payload.values = toJson(input.values);
    if (input.toneOfVoice !== undefined) payload.tone_of_voice = toJson(input.toneOfVoice);
    if (input.riskProfile !== undefined) payload.risk_profile = toJson(input.riskProfile);
    if (input.decisionPrinciples !== undefined) {
      payload.decision_principles = toJson(input.decisionPrinciples);
    }

    const { data, error } = await this.supabase
      .from("company_dna")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update Company DNA: ${error.message}`);
    }

    return mapRow(data);
  }
}
