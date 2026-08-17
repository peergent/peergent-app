/**
 * PX-57 — builds CampaignApprovalPackage from resolved brain graphs.
 */

import type { CampaignContext } from "@/lib/office/campaign/campaign-context";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { PlanningBrainGraph } from "../layers/planning/brain-types";
import type { StrategyBrainGraph } from "../layers/strategy/brain-types";
import type { CreativeGraph } from "../layers/creative/types";
import type { ValidationGraph } from "../layers/validation/types";
import { materializeCreativeContentArtifacts } from "../layers/creative/materialize-creative-content-artifacts";
import {
  evaluateCreativePublicationInvariants,
  evaluateValidationPublicationInvariants,
  publicationReadyFromInvariants,
} from "./publication-readiness-invariants";
import type {
  CampaignApprovalDeliverableContent,
  CampaignApprovalPackage,
} from "./campaign-approval-package-types";

function executionModeLabel(mode: CampaignApprovalMode | undefined): CampaignApprovalPackage["executionPlan"]["mode"] {
  switch (mode) {
    case "approval_before_generation":
    case "blocked_manual_only":
      return "manual";
    case "no_approval_required":
      return "fully_automatic";
    default:
      return "semi_automatic";
  }
}

function channelLabels(graph: CreativeGraph): string[] {
  return [...new Set(graph.channelPlans.map((p) => String(p.channel)))];
}

function scheduleSummary(planning: PlanningBrainGraph | null | undefined, nl: boolean): string | null {
  const plan = planning?.campaignPlans?.[0];
  if (!plan) return null;
  if (plan.startWindow && plan.endWindow) {
    return nl ? `${plan.startWindow} – ${plan.endWindow}` : `${plan.startWindow} – ${plan.endWindow}`;
  }
  return plan.startWindow ?? plan.endWindow ?? null;
}

export function materializeCampaignApprovalPackage(input: {
  organizationId: string;
  projectId: string;
  campaignName: string;
  campaignContext?: CampaignContext | null;
  creativeGraph: CreativeGraph | null;
  validationGraph: ValidationGraph | null;
  planningGraph?: PlanningBrainGraph | null;
  strategyGraph?: StrategyBrainGraph | null;
  approvalMode?: CampaignApprovalMode;
  locale?: "nl" | "en";
}): CampaignApprovalPackage | null {
  if (!input.creativeGraph) return null;

  const nl = input.locale === "nl";
  const creative = input.creativeGraph;
  const contentArtifacts = materializeCreativeContentArtifacts(creative, {
    locale: input.locale,
    audience: input.campaignContext?.audience,
  });

  const invariantIssues = [
    ...evaluateCreativePublicationInvariants({
      creative,
      contentArtifacts,
      locale: input.locale,
    }),
    ...evaluateValidationPublicationInvariants({
      validation: input.validationGraph,
      locale: input.locale,
    }),
  ];

  const selected = creative.campaigns.find((c) => c.selected) ?? creative.campaigns[0];
  const validation = input.validationGraph;

  const deliverables: CampaignApprovalDeliverableContent[] = contentArtifacts.map((artifact) => {
    const valDecision = validation?.report.approvedDeliverables.find(
      (d) => d.deliverableId === artifact.sourceDeliverableId
    );
    return {
      id: artifact.id,
      sourceDeliverableId: artifact.sourceDeliverableId,
      channel: artifact.channel,
      format: artifact.format,
      deliverableType: artifact.deliverableType,
      headline: artifact.headline,
      hook: artifact.hook,
      body: artifact.body,
      cta: artifact.cta,
      targetAudience: artifact.targetAudience,
      intendedTiming: artifact.intendedTiming,
      subject: artifact.subject,
      previewText: artifact.previewText,
      slides: artifact.slides,
      hashtags: artifact.hashtags,
      mediaNotes: artifact.mediaNotes,
      validationStatus: valDecision?.approved ? "passed" : valDecision ? "failed" : "pending",
      validationSummary: valDecision?.reason ?? null,
    };
  });

  const packageId = `approval-pkg-${input.projectId}-${creative.createdAt}`;
  const publicationReady = publicationReadyFromInvariants(invariantIssues);

  return {
    version: {
      creativeGraphRef: `creative:${input.organizationId}:${input.projectId}:${creative.createdAt}`,
      validationGraphRef: validation
        ? `validation:${input.organizationId}:${input.projectId}:${validation.createdAt}`
        : `validation:${input.organizationId}:${input.projectId}:missing`,
      planningGraphRef: input.planningGraph
        ? `planning:${input.organizationId}:${input.projectId}:${input.planningGraph.createdAt}`
        : null,
      strategyGraphRef: input.strategyGraph
        ? `strategy:${input.organizationId}:${input.projectId}`
        : null,
      packageId,
      materializedAt: new Date().toISOString(),
    },
    campaign: {
      projectId: input.projectId,
      organizationId: input.organizationId,
      name: input.campaignName,
      objective:
        input.campaignContext?.goals[0] ??
        selected?.objective ??
        (nl ? "Campagnedoel" : "Campaign objective"),
      audience:
        input.campaignContext?.audience ??
        selected?.targetAudience ??
        (nl ? "Doelgroep" : "Target audience"),
      strategicRationale: creative.direction?.rationale ?? selected?.businessValue ?? "",
      channels: channelLabels(creative),
      scheduleSummary: scheduleSummary(input.planningGraph, nl),
    },
    strategySummary:
      input.strategyGraph?.positioningStrategy?.positioningStatement ??
      input.strategyGraph?.selectedStrategy ??
      creative.direction?.angle ??
      selected?.keyMessage ??
      "",
    validation: {
      publicationReadiness: validation?.report.publicationReadiness ?? "BLOCKED",
      overallScore: validation?.report.overallScore.value ?? 0,
      summary: validation?.report.reasoningSummary ?? (nl ? "Validatie ontbreekt." : "Validation missing."),
      blockingIssueCount: invariantIssues.filter((i) => i.blocking).length,
    },
    deliverables,
    executionPlan: {
      mode: executionModeLabel(input.approvalMode),
      readyForHandoff: publicationReady,
      blockedReason: publicationReady
        ? null
        : invariantIssues.find((i) => i.blocking)?.message ??
          (nl ? "Publicatiepakket niet gereed." : "Publication package not ready."),
    },
    blockingIssues: invariantIssues.filter((i) => i.blocking).map((i) => ({
      code: i.code,
      message: i.message,
      field: i.field,
    })),
    publicationReady,
  };
}

/** Gate: episode may enter waiting_for_approval only when package is publication-ready. */
export function assertCampaignApprovalPackageReady(
  pkg: CampaignApprovalPackage | null
): { ok: true } | { ok: false; reason: string; issues: readonly { code: string; message: string }[] } {
  if (!pkg) {
    return { ok: false, reason: "approval_package_missing", issues: [{ code: "missing_package", message: "Campaign approval package could not be materialized." }] };
  }
  if (!pkg.publicationReady) {
    return {
      ok: false,
      reason: "approval_package_not_ready",
      issues: pkg.blockingIssues,
    };
  }
  if (pkg.deliverables.length === 0) {
    return {
      ok: false,
      reason: "approval_package_empty",
      issues: [{ code: "empty_deliverables", message: "No deliverables in approval package." }],
    };
  }
  return { ok: true };
}
