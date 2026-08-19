/**
 * PX-63 — materialize CompanyGraph from episode handoff when capability path skipped storage.
 */

import { CompanyLayer } from "../layers/company/company-layer";
import { getDefaultCompanyRepository } from "../layers/company/company-repository";
import type { CompanyGraph } from "../layers/company/types";
import type { BrainHandoffContext } from "./types";

export function ensureCompanyGraphFromHandoff(handoff: BrainHandoffContext): CompanyGraph {
  const existing = getDefaultCompanyRepository().getLatest(handoff.organizationId)?.graph ?? null;
  if (existing) return existing;

  const layer = new CompanyLayer();
  const output = layer.produceAndStore({
    organizationId: handoff.organizationId,
    projectId: handoff.projectId,
    episodeId: handoff.episodeId,
    locale: handoff.locale,
    companySnapshot: handoff.companySnapshot,
    brandGraph: handoff.brandGraph,
    author: "episode-handoff",
    changeReason: "Materialized for intelligence pipeline",
  });

  return output.graph;
}
