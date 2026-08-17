/**
 * PX-57 — episode gate before entering waiting_for_approval.
 */

import type { ProjectEpisodeRecord } from "../project-runtime/types";
import {
  assertCampaignApprovalPackageReady,
  materializeCampaignApprovalPackage,
} from "./materialize-campaign-approval-package";

export function evaluateEpisodeApprovalPackageGate(episode: ProjectEpisodeRecord): {
  allowed: boolean;
  reason: string | null;
  packageId: string | null;
} {
  const resolved = episode.resolvedGraphs ?? {};
  const pkg = materializeCampaignApprovalPackage({
    organizationId: episode.snapshot.organizationId,
    projectId: episode.snapshot.projectId,
    campaignName: episode.snapshot.projectId,
    creativeGraph: resolved.creativeGraph ?? null,
    validationGraph: resolved.validationGraph ?? null,
    planningGraph: resolved.planningBrainGraph ?? null,
    strategyGraph: resolved.strategyBrainGraph ?? null,
  });

  const gate = assertCampaignApprovalPackageReady(pkg);
  if (!gate.ok) {
    return { allowed: false, reason: gate.reason, packageId: pkg?.version.packageId ?? null };
  }
  return { allowed: true, reason: null, packageId: pkg!.version.packageId };
}
