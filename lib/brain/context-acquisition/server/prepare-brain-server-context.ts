import "server-only";

import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import { acquireBrainContext } from "../acquire-brain-context";
import type { BrainContextAcquisitionPackage } from "../types";
import type { ContextAssemblyResult } from "../../context/assembly-types";
import { assembleCompanyContextSync } from "../../context/company-context-assembler";
import { buildCompanySnapshot } from "../../company/snapshot-builder";
import { assertLiveBrainServerContext } from "./context-acquisition-config";

export type PrepareBrainServerContextInput = {
  supabase: AppSupabaseClient;
  organizationId: string;
  projectId?: string;
  peerId: string;
  peerRole: string;
  campaignContext?: CampaignContext | null;
  locale?: "nl" | "en";
  phase?: import("../../project-engine/types").ProjectBrainId | "project_start";
};

export type PrepareBrainServerContextResult = {
  package: BrainContextAcquisitionPackage;
  assembly: ContextAssemblyResult;
  realContext: true;
};

function resolveAssemblyForProduction(input: {
  pkg: BrainContextAcquisitionPackage;
  organizationId: string;
  campaignContext: CampaignContext | null;
  locale: "nl" | "en";
}): ContextAssemblyResult {
  if (input.pkg.assembly) {
    return input.pkg.assembly;
  }

  const snapshot =
    input.pkg.handoff.companySnapshot ??
    buildCompanySnapshot({ organizationId: input.organizationId }).snapshot;

  return assembleCompanyContextSync({
    organizationId: input.organizationId,
    companyProfile: snapshot.profile,
    marketingUnderstanding: null,
    websiteSnapshot: snapshot.website,
    websiteUrl: input.campaignContext?.websiteUrl ?? null,
    campaignContext: input.campaignContext,
    locale: input.locale,
  });
}

/**
 * Canonical pre-flight for live Brain server paths — acquire real organizational
 * context via PX-49 before any capability reasoning begins.
 */
export async function prepareBrainServerContext(
  input: PrepareBrainServerContextInput
): Promise<PrepareBrainServerContextResult> {
  assertLiveBrainServerContext({ peerId: input.peerId, supabase: input.supabase });

  const locale = input.locale ?? "en";
  const pkg = await acquireBrainContext({
    supabase: input.supabase,
    organizationId: input.organizationId,
    projectId: input.projectId,
    peerId: input.peerId,
    task: {
      peerRole: input.peerRole,
      phase: input.phase ?? "project_start",
      locale,
    },
    campaignContext: input.campaignContext ?? null,
  });

  const assembly = resolveAssemblyForProduction({
    pkg,
    organizationId: input.organizationId,
    campaignContext: input.campaignContext ?? null,
    locale,
  });

  return {
    package: pkg,
    assembly,
    realContext: true,
  };
}
