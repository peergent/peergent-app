import type { BrainCapabilityId, BrainSnapshotSliceKey } from "../capabilities/registry";
import type { ReadinessDimension } from "../context/readiness";
import { getBrainCapability } from "../capabilities/registry";
import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  buildStrategyReadinessDiagnostic,
  buildStrategyReadinessKnowledgeResolvedDiagnostic,
  emitStrategyReadinessDiagnostic,
  emitStrategyReadinessKnowledgeResolvedDiagnostic,
  evaluateEffectiveStrategyContextReadiness,
  type StrategyReadinessEnrichmentInput,
} from "../strategy-readiness";

export type CapabilityExecutionRequirements = {
  minimumReadinessScore: number;
  requiredDimensions: readonly ReadinessDimension[];
  criticalFields: readonly string[];
  partialExecutionAllowed: boolean;
};

const REQUIREMENTS: Readonly<Record<BrainCapabilityId, CapabilityExecutionRequirements>> = {
  company_understanding: {
    minimumReadinessScore: 35,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  website_understanding: {
    minimumReadinessScore: 50,
    requiredDimensions: ["website"],
    criticalFields: ["website"],
    partialExecutionAllowed: true,
  },
  brand_understanding: {
    minimumReadinessScore: 35,
    requiredDimensions: ["brand"],
    criticalFields: ["tone"],
    partialExecutionAllowed: true,
  },
  market_understanding: {
    minimumReadinessScore: 35,
    requiredDimensions: ["business"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  competitor_understanding: {
    minimumReadinessScore: 35,
    requiredDimensions: ["business"],
    criticalFields: ["mainCompetitors"],
    partialExecutionAllowed: true,
  },
  strategy: {
    minimumReadinessScore: 70,
    requiredDimensions: ["company_profile", "business"],
    criticalFields: ["targetAudiences", "goals"],
    partialExecutionAllowed: false,
  },
  channel_planning: {
    minimumReadinessScore: 50,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  campaign_planning: {
    minimumReadinessScore: 50,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  creative_generation: {
    minimumReadinessScore: 50,
    requiredDimensions: ["brand"],
    criticalFields: ["tone"],
    partialExecutionAllowed: true,
  },
  validation: {
    minimumReadinessScore: 50,
    requiredDimensions: ["brand"],
    criticalFields: [],
    partialExecutionAllowed: false,
  },
  performance_interpretation: {
    minimumReadinessScore: 35,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  optimization: {
    minimumReadinessScore: 50,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  memory: {
    minimumReadinessScore: 0,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: true,
  },
  execution: {
    minimumReadinessScore: 50,
    requiredDimensions: ["company_profile"],
    criticalFields: [],
    partialExecutionAllowed: false,
  },
};

export function getCapabilityExecutionRequirements(
  capabilityId: BrainCapabilityId
): CapabilityExecutionRequirements {
  return REQUIREMENTS[capabilityId];
}

export type ReadinessGateResult =
  | { ok: true; partial: boolean }
  | { ok: false; status: "waiting_for_input" | "blocked"; reasons: readonly string[] };

export function evaluateReadinessGate(input: {
  capabilityId: BrainCapabilityId;
  overallScore: number;
  dimensionScores: Readonly<Record<ReadinessDimension, number>>;
  missingCriticalFields: readonly string[];
  assemblyState: import("../context/assembly-types").ContextAssemblyState;
  campaignContext?: CampaignContext | null;
  strategyReadinessEnrichment?: StrategyReadinessEnrichmentInput | null;
  strategyReadinessDiagnostic?: {
    organizationId: string;
    projectId: string;
    episodeId?: string;
  } | null;
}): ReadinessGateResult {
  if (input.capabilityId === "strategy" && input.campaignContext) {
    const enrichment: StrategyReadinessEnrichmentInput = {
      campaignContext: input.campaignContext,
      companyProfile: input.strategyReadinessEnrichment?.companyProfile ?? null,
      companyWebsiteSnapshot: input.strategyReadinessEnrichment?.companyWebsiteSnapshot ?? null,
      resolvedGraphs: input.strategyReadinessEnrichment?.resolvedGraphs ?? null,
      upstreamCapabilityOutputs: input.strategyReadinessEnrichment?.upstreamCapabilityOutputs ?? null,
      inflightGraphs: input.strategyReadinessEnrichment?.inflightGraphs ?? null,
    };
    const evaluation = evaluateEffectiveStrategyContextReadiness({
      ...enrichment,
      campaignContext: input.campaignContext,
    });
    if (input.strategyReadinessDiagnostic) {
      const diagnosticBase = {
        ...enrichment,
        campaignContext: input.campaignContext,
        organizationId: input.strategyReadinessDiagnostic.organizationId,
        projectId: input.strategyReadinessDiagnostic.projectId,
        episodeId: input.strategyReadinessDiagnostic.episodeId,
      };
      emitStrategyReadinessDiagnostic(buildStrategyReadinessDiagnostic(diagnosticBase));
      emitStrategyReadinessKnowledgeResolvedDiagnostic(
        buildStrategyReadinessKnowledgeResolvedDiagnostic(diagnosticBase)
      );
    }
    if (evaluation.ready) {
      return { ok: true, partial: false };
    }
    return {
      ok: false,
      status: "waiting_for_input",
      reasons: [...evaluation.machineReasonCodes],
    };
  }

  const req = getCapabilityExecutionRequirements(input.capabilityId);
  const reasons: string[] = [];

  if (input.assemblyState === "unknown") {
    return {
      ok: false,
      status: "waiting_for_input",
      reasons: ["No company context is available."],
    };
  }

  for (const dim of req.requiredDimensions) {
    if ((input.dimensionScores[dim] ?? 0) === 0) {
      reasons.push(`Missing required dimension: ${dim}`);
    }
  }

  for (const field of req.criticalFields) {
    if (input.missingCriticalFields.includes(field)) {
      reasons.push(`Missing critical field: ${field}`);
    }
  }

  if (reasons.length > 0 && !req.partialExecutionAllowed) {
    return { ok: false, status: "waiting_for_input", reasons };
  }

  if (input.overallScore < req.minimumReadinessScore) {
    if (req.partialExecutionAllowed && input.overallScore > 0) {
      return { ok: true, partial: true };
    }
    return {
      ok: false,
      status: input.overallScore === 0 ? "blocked" : "waiting_for_input",
      reasons: [`Readiness score ${input.overallScore} below minimum ${req.minimumReadinessScore}`],
    };
  }

  return { ok: true, partial: input.assemblyState === "partial" || input.assemblyState === "needs_information" };
}

/** Extra slices always included for known facts / unknowns when relevant. */
export function capabilityContextSlices(capabilityId: BrainCapabilityId): readonly BrainSnapshotSliceKey[] {
  const def = getBrainCapability(capabilityId);
  return [...new Set([...def.requiredContext, ...def.optionalContext])];
}

export function missingCriticalFieldsFromAssembly(
  capabilityId: BrainCapabilityId,
  missingInformation: readonly { fieldKey: string; priority: string }[]
): readonly string[] {
  const req = getCapabilityExecutionRequirements(capabilityId);
  const missingKeys = new Set(missingInformation.map((m) => m.fieldKey));
  return req.criticalFields.filter((f) => missingKeys.has(f));
}
