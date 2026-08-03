import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import { loadMarketingUnderstandingContext } from "@/lib/intelligence/adapters/marketing-understanding-adapter";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { assembleCompanyContext } from "../context/company-context-assembler";
import type { ContextAssemblyResult } from "../context/assembly-types";
import type { AsyncBrainRepositories } from "../persistence/contracts";
import type { WebsiteSnapshot } from "../website/types";

export type LiveCompanyIntelligenceInput = {
  organizationId: string;
  peerId: string;
  supabase: AppSupabaseClient;
  repositories?: Pick<AsyncBrainRepositories, "corrections" | "snapshots">;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
  websiteUrl?: string | null;
};

function websiteFromSnapshotPayload(payload: Record<string, unknown>): WebsiteSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  if ("source" in payload && "pages" in payload) {
    return payload as unknown as WebsiteSnapshot;
  }
  return null;
}

/** Live organization context — never substitutes demo fixtures. */
export async function assembleLiveCompanyContext(
  input: LiveCompanyIntelligenceInput
): Promise<ContextAssemblyResult> {
  const locale = input.locale ?? "en";
  const { slice: marketingUnderstanding } = await loadMarketingUnderstandingContext(
    input.supabase,
    input.organizationId,
    "Marketing"
  );

  const corrections = input.repositories
    ? await input.repositories.corrections.listActive(input.organizationId)
    : [];

  let websiteSnapshot: WebsiteSnapshot | null = null;
  if (input.repositories) {
    const stored = await input.repositories.snapshots.getLatest(input.organizationId, "website");
    if (stored) {
      websiteSnapshot = websiteFromSnapshotPayload(stored.payload);
    }
  }

  return assembleCompanyContext({
    organizationId: input.organizationId,
    companyProfile: null,
    marketingUnderstanding,
    websiteSnapshot,
    websiteUrl: !websiteSnapshot ? input.websiteUrl ?? null : null,
    corrections,
    campaignContext: input.campaignContext ?? null,
    locale,
  });
}
