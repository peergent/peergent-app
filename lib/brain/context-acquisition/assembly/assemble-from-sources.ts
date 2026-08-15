import { assembleCompanyContext } from "../../context/company-context-assembler";
import type { ContextAssemblyResult } from "../../context/assembly-types";
import type { AcquireBrainContextInput } from "../types";
import { materializeOrganizationKnowledge } from "../../organization-knowledge";

export async function assembleContextFromSources(
  input: AcquireBrainContextInput
): Promise<ContextAssemblyResult | null> {
  try {
    const materialized = await materializeOrganizationKnowledge({
      supabase: input.supabase,
      organizationId: input.organizationId,
      peerId: input.peerId,
      peerRole: input.task.peerRole,
      campaignWebsiteSkipped: input.campaignContext?.websiteState === "skipped",
    });

    const understanding = materialized.marketingUnderstanding;

    if (!understanding?.available && !input.campaignContext && !materialized.websiteSnapshot) {
      return null;
    }

    return assembleCompanyContext({
      organizationId: input.organizationId,
      marketingUnderstanding: understanding?.available ? understanding : null,
      websiteSnapshot: materialized.websiteSnapshot,
      websiteUrl: input.campaignContext?.websiteUrl ?? null,
      campaignContext: input.campaignContext ?? null,
      locale: input.task.locale ?? "en",
    });
  } catch {
    return null;
  }
}
