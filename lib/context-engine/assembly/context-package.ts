import type { ContextBundle } from "../types";
import type { ContextPackage } from "@/lib/intelligence";
import type { BusinessBrainContextSlice } from "@/lib/intelligence/types/business-brain-context-slice";
import type { CompanyDnaContextSlice } from "@/lib/intelligence/types/company-dna-context-slice";
import type { BusinessBrainQueryPlan } from "@/lib/intelligence/types/business-brain-query";
import type { MarketingUnderstandingContextSlice } from "@/lib/intelligence/types/marketing-understanding-context-slice";

function collectSources(bundle: ContextBundle) {
  const seen = new Set<string>();
  const sources: ContextPackage["meta"]["sources"] = [];

  for (const slice of Object.values(bundle.layers)) {
    if (!slice) continue;
    for (const source of slice.sources) {
      if (seen.has(source.id)) continue;
      seen.add(source.id);
      sources.push(source);
    }
  }

  return sources;
}

function buildWarnings(bundle: ContextBundle): string[] {
  const warnings: string[] = [];

  const dna = bundle.layers["company-dna"]?.data as CompanyDnaContextSlice | undefined;
  if (!dna?.available) {
    warnings.push("Company DNA unavailable or empty");
  }

  const brain = bundle.layers["business-brain"]?.data as BusinessBrainContextSlice | undefined;
  if (!brain?.available) {
    warnings.push("Business Brain unavailable");
  } else if (brain.sparse) {
    warnings.push("Business Brain is sparse — limited business knowledge");
  }

  if (brain?.truncated) {
    warnings.push("Business Brain retrieval was truncated to fit context budget");
  }

  const marketing = bundle.layers["marketing-understanding"]?.data as
    | MarketingUnderstandingContextSlice
    | undefined;
  if (marketing?.roleApplicable) {
    if (!marketing.available) {
      warnings.push("Marketing Understanding unavailable or empty");
    } else if (marketing.sparse) {
      warnings.push(
        `Marketing Understanding is sparse (${marketing.completeness}% complete) — gaps: ${marketing.gaps.join(", ")}`
      );
    }
  }

  for (const layer of bundle.meta.missingLayers) {
    if (layer === "telemetry") continue;
    warnings.push(`${layer} layer not loaded`);
  }

  return [...new Set(warnings)];
}

/** Assembles the v2 Context Package from an internal ContextBundle. */
export function assembleContextPackage(
  bundle: ContextBundle,
  options?: {
    taskHint?: string;
    businessBrainQueryPlan?: BusinessBrainQueryPlan;
    cacheHits?: string[];
  }
): ContextPackage {
  const loadedLayers = Object.keys(bundle.layers);
  const brain = bundle.layers["business-brain"]?.data as BusinessBrainContextSlice | undefined;

  return {
    version: "2.0",
    traceId: bundle.meta.traceId,
    scope: bundle.scope,
    taskHint: options?.taskHint,
    slices: {
      identity: bundle.layers.identity?.data,
      organization: bundle.layers.organization?.data,
      objective: bundle.layers.objective?.data,
      policy: bundle.layers.policy?.data,
      companyDna: bundle.layers["company-dna"]?.data as CompanyDnaContextSlice | undefined,
      businessBrain: brain,
      marketingUnderstanding: bundle.layers["marketing-understanding"]?.data as
        | MarketingUnderstandingContextSlice
        | undefined,
      peerType: bundle.layers["peer-type"]?.data,
      knowledge: bundle.layers.knowledge?.data,
      memory: bundle.layers.memory?.data,
      tools: bundle.layers.tools?.data,
    },
    retrieval: options?.businessBrainQueryPlan
      ? {
          businessBrainQueryPlan: options.businessBrainQueryPlan,
          truncated: brain?.truncated,
        }
      : undefined,
    meta: {
      completeness: bundle.meta.completeness,
      loadedLayers,
      missingLayers: bundle.meta.missingLayers,
      warnings: buildWarnings(bundle),
      sources: collectSources(bundle),
      assembledAt: new Date().toISOString(),
      cacheHits: options?.cacheHits ?? [],
    },
  };
}
