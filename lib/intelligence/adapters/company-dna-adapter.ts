import { createCompanyDnaService } from "@/lib/company-dna";
import { createSupabaseSource } from "@/lib/context-engine/data/sources";
import type { SourceRef } from "@/lib/context-engine/types/sources";
import type { AppSupabaseClient } from "../api/org-context";
import {
  companyDnaToContextSlice,
} from "../types/company-dna-context-slice";

export type CompanyDnaLoadResult = {
  slice: ReturnType<typeof companyDnaToContextSlice>;
  sources: SourceRef[];
};

export async function loadCompanyDnaContext(
  supabase: AppSupabaseClient,
  organizationId: string
): Promise<CompanyDnaLoadResult> {
  const service = createCompanyDnaService(supabase);
  const dna = await service.getOrCreate(organizationId);
  const slice = companyDnaToContextSlice(dna);

  return {
    slice,
    sources: [
      createSupabaseSource(
        "company_dna",
        organizationId,
        slice.available ? "Company DNA" : "Company DNA (empty)"
      ),
    ],
  };
}
