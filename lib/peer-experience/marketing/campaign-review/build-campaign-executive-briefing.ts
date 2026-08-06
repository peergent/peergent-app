import type { BrainStructuredOutput } from "@/lib/brain/evidence/structured-output";
import { buildExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import type { ExecutiveCampaignBriefing } from "@/lib/brain/presentation/executive-briefing";
import { ensureCampaignPlanning, readPlanningGraphFromOutputs } from "@/lib/brain/integration/ensure-campaign-planning";
import { resolveOrganizationId } from "@/lib/brain/integration/resolve-company-intelligence";
import { readCampaignBrainOutputs } from "@/lib/office/campaign/campaign-brain-outputs";
import { buildCampaignContext } from "@/lib/office/campaign/campaign-context";
import {
  resolveCampaignExperienceMode,
  shouldUseExecutiveBriefing,
} from "@/lib/office/campaign/campaign-experience-mode";
import type { CampaignApprovalMode } from "@/lib/campaign/types/campaign";
import type { MarketingProject } from "../projects/types";
import type { MarketingPeerDomainInput } from "../view-models/marketing-peer-domain-input";
import type { CampaignReviewItem } from "./campaign-review-types";
import {
  isCampaignApprovalPending,
  resolveCampaignApprovalForProject,
} from "../campaign-approval";
import type { CampaignApprovalMap } from "../campaign-approval";

function isStrategyBrainOutputReady(output: BrainStructuredOutput | undefined): boolean {
  if (!output) return false;
  if (output.capabilityId !== "strategy") return false;
  if (output.errors.length > 0) return false;
  const hasFindings = output.findings.length > 0;
  const hasDecisions =
    (output.decisionRecords?.length ?? 0) > 0 || output.decisions.length > 0;
  return hasFindings && hasDecisions;
}

export function isExecutiveBriefingReady(input: {
  allReviewItems: readonly CampaignReviewItem[];
  approvalMode?: CampaignApprovalMode;
  project?: MarketingProject;
  domainInput?: MarketingPeerDomainInput;
}): boolean {
  const mode = resolveCampaignExperienceMode(input.approvalMode);
  if (!shouldUseExecutiveBriefing(mode)) return false;

  const strategyItem = input.allReviewItems.find((i) => i.artifactType === "campaign_strategy");
  const brainOutputs = input.project ? readCampaignBrainOutputs(input.project) : {};
  const brainReady = isStrategyBrainOutputReady(brainOutputs.strategy);

  // Office Sprint 7.6 campaigns persist strategy in brain outputs — not as marketing work units.
  // Briefing remains available after approval, scheduling, and publication.
  if (brainReady) {
    return true;
  }

  if (!strategyItem?.preview) return false;

  if (strategyItem.status === "in_progress" || strategyItem.status === "blocked") {
    return false;
  }

  return strategyItem.status === "prepared" || strategyItem.status === "awaiting_review";
}

export function isExecutiveBriefingPendingApproval(input: {
  project: MarketingProject;
  allReviewItems: readonly CampaignReviewItem[];
  approvalMode?: CampaignApprovalMode;
  campaignApprovalByProjectId?: CampaignApprovalMap;
  executiveBriefing?: ExecutiveCampaignBriefing | null;
}): boolean {
  const briefing =
    input.executiveBriefing ??
    buildCampaignExecutiveBriefing({
      project: input.project,
      allReviewItems: input.allReviewItems,
      approvalMode: input.approvalMode,
    });

  return isCampaignApprovalPending({
    project: input.project,
    allReviewItems: input.allReviewItems,
    approvalMode: input.approvalMode,
    campaignApproval: resolveCampaignApprovalForProject({
      projectId: input.project.id,
      campaignApprovalByProjectId: input.campaignApprovalByProjectId,
    }),
    executiveBriefing: briefing,
  });
}

function resolveDomainInput(
  project: MarketingProject,
  domainInput?: MarketingPeerDomainInput
): MarketingPeerDomainInput {
  if (domainInput) return domainInput;
  return {
    peerId: project.peerId,
    organizationId: undefined,
    userName: "",
    peerName: "",
    campaignTitle: project.title,
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    drafts: [],
    publicationPackages: [],
    activityFeed: [],
    workUnits: [],
    projects: [],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

export function buildCampaignExecutiveBriefing(input: {
  project: MarketingProject;
  domainInput?: MarketingPeerDomainInput;
  allReviewItems: readonly CampaignReviewItem[];
  approvalMode?: CampaignApprovalMode;
  locale?: string | null;
}): ExecutiveCampaignBriefing | null {
  if (!isExecutiveBriefingReady({
    allReviewItems: input.allReviewItems,
    approvalMode: input.approvalMode,
    project: input.project,
    domainInput: input.domainInput,
  })) return null;

  const brainOutputs = readCampaignBrainOutputs(input.project);
  const locale = input.locale === "nl" ? "nl" : "en";
  const domain = resolveDomainInput(input.project, input.domainInput);

  const campaignContext = buildCampaignContext({
    project: input.project,
    domainInput: domain,
    locale: input.locale,
  });

  let planningGraph = readPlanningGraphFromOutputs(brainOutputs);

  if (brainOutputs.strategy && !planningGraph) {
    const planningResult = ensureCampaignPlanning({
      project: input.project,
      campaignContext,
      strategyOutput: brainOutputs.strategy,
      organizationId: resolveOrganizationId(domain.peerId, domain.organizationId),
      locale,
    });
    planningGraph = planningResult.graph ?? null;
  }

  return buildExecutiveCampaignBriefing({
    campaignContext,
    strategy: brainOutputs.strategy,
    channels: brainOutputs.channel_planning,
    creative: brainOutputs.creative_generation,
    planningGraph,
    locale,
  });
}
