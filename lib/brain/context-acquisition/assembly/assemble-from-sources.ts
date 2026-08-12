import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import { assembleCompanyContext } from "../../context/company-context-assembler";
import type { ContextAssemblyResult } from "../../context/assembly-types";
import type { AcquireBrainContextInput } from "../types";

export async function assembleContextFromSources(
  input: AcquireBrainContextInput
): Promise<ContextAssemblyResult | null> {
  try {
    const { slice: understanding } = await loadMarketingUnderstandingContext(
      input.supabase,
      input.organizationId,
      input.task.peerRole,
      "project_context"
    );

    if (!understanding.available && !input.campaignContext) {
      return null;
    }

    return assembleCompanyContext({
      organizationId: input.organizationId,
      marketingUnderstanding: understanding.available ? understanding : null,
      websiteSnapshot: null,
      websiteUrl: input.campaignContext?.websiteUrl ?? null,
      campaignContext: input.campaignContext ?? null,
      locale: input.task.locale ?? "en",
    });
  } catch {
    return null;
  }
}
