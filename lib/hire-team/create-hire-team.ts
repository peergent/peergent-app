import { buildPeerInsertFromRecommendation } from "@/lib/website-intelligence/map-recommendation-to-peer";
import type { WorkforceRecommendation } from "@/lib/website-intelligence";
import { withOrganizationId } from "@/lib/peers/queries";
import { createClient } from "@/lib/supabase/client";

export type CreateHireTeamResult =
  | { ok: true; salesPeerId: string; marketingPeerId: string }
  | { ok: false; error: string; salesPeerId?: string };

type CreateHireTeamParams = {
  sales: WorkforceRecommendation;
  marketing: WorkforceRecommendation;
  websiteUrl: string;
  organizationId?: string | null;
  existingSalesPeerId?: string;
  existingMarketingPeerId?: string;
};

export async function createHireTeam(
  params: CreateHireTeamParams
): Promise<CreateHireTeamResult> {
  const {
    sales,
    marketing,
    websiteUrl,
    organizationId,
    existingSalesPeerId,
    existingMarketingPeerId,
  } = params;

  if (existingSalesPeerId && existingMarketingPeerId) {
    return {
      ok: true,
      salesPeerId: existingSalesPeerId,
      marketingPeerId: existingMarketingPeerId,
    };
  }

  if (!organizationId) {
    return { ok: false, error: "no_organization" };
  }

  const supabase = createClient();
  const salesInsert = withOrganizationId(
    buildPeerInsertFromRecommendation(sales, websiteUrl),
    organizationId
  );
  const marketingInsert = withOrganizationId(
    buildPeerInsertFromRecommendation(marketing, websiteUrl),
    organizationId
  );

  let salesPeerId = existingSalesPeerId;

  if (!salesPeerId) {
    const { data: salesData, error: salesError } = await supabase
      .from("peers")
      .insert(salesInsert)
      .select("id")
      .single();

    if (salesError) {
      console.error("Hire team — Sales Peer creation failed:", salesError);
      return { ok: false, error: "creation_failed" };
    }

    salesPeerId = salesData.id;
  }

  if (existingMarketingPeerId) {
    if (!salesPeerId) {
      return { ok: false, error: "creation_failed" };
    }
    return {
      ok: true,
      salesPeerId,
      marketingPeerId: existingMarketingPeerId,
    };
  }

  const { data: marketingData, error: marketingError } = await supabase
    .from("peers")
    .insert(marketingInsert)
    .select("id")
    .single();

  if (marketingError) {
    console.error("Hire team — Marketing Peer creation failed:", marketingError);
    return { ok: false, error: "creation_failed", salesPeerId };
  }

  if (!salesPeerId) {
    return { ok: false, error: "creation_failed" };
  }

  return {
    ok: true,
    salesPeerId,
    marketingPeerId: marketingData.id,
  };
}
