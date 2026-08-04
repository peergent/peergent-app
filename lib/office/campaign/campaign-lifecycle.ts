import type { IntegrationConnection } from "@/lib/integrations/types";
import type { CampaignSetupChannel, MarketingProject, MarketingProjectStatus } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { CampaignWorkflowStepId, CampaignWorkflowStepState } from "./workflow-types";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import type { DemoCampaignDomainOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { isCampaignScheduled } from "./campaign-schedule-state";
import { resolveProjectIdForDraft } from "@/lib/office/attribution";

/** Truthful external publishing capability — no fake “published” states. */
export type CampaignPublishingState =
  | "not_configured"
  | "ready"
  | "publishing"
  | "published"
  | "failed";

/** Canonical campaign lifecycle phase (internal model). */
export type CampaignLifecyclePhase =
  | "concept"
  | "planning"
  | "review"
  | "scheduled"
  | "publishing_pending"
  | "published"
  | "active"
  | "completed"
  | "optimizing";

const CHANNEL_PROVIDER: Partial<
  Record<CampaignSetupChannel, IntegrationConnection["id"]>
> = {
  linkedin: "linkedin",
  instagram: "instagram",
  meta_ads: "meta",
  google_ads: "google_ads",
  email: "mailchimp",
  blog: "wordpress",
  website_landing: "wordpress",
};

export function isCampaignPublished(
  project: MarketingProject,
  domainInput: MarketingPeerDomainInput,
  isDemo: boolean
): boolean {
  if (isDemo) {
    const overlay = readDemoCampaignOverlay(
      domainInput as MarketingPeerDomainInput & DemoCampaignDomainOverlay
    );
    if (overlay.demoCampaignPublished?.[project.id]) return true;
  }

  const drafts = domainInput.drafts.filter(
    (d) => resolveProjectIdForDraft(d, domainInput.workUnits) === project.id
  );
  return drafts.some((d) => d.status === "published");
}

export function resolveCampaignPublishingState(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  connections: readonly IntegrationConnection[];
  isCampaignPublished: boolean;
  isDemo: boolean;
}): CampaignPublishingState {
  if (input.isCampaignPublished) return "published";

  const selected = input.project.campaignSetup?.selectedChannels ?? [];
  const providers = selected
    .filter((channel) => channel !== "decide_later" && channel !== "other")
    .map((channel) => CHANNEL_PROVIDER[channel])
    .filter(Boolean) as IntegrationConnection["id"][];

  if (providers.length === 0) return "not_configured";

  const allConnected = providers.every(
    (providerId) =>
      input.connections.find((c) => c.id === providerId)?.status === "connected"
  );

  if (!allConnected) return "not_configured";

  // Live Office has no automatic publish executor in Sprint 7.6 — connections alone ≠ ready to publish.
  if (!input.isDemo) return "not_configured";

  return "ready";
}

function pendingDraftCount(
  projectId: string,
  domainInput: MarketingPeerDomainInput
): number {
  return domainInput.drafts.filter(
    (d) =>
      resolveProjectIdForDraft(d, domainInput.workUnits) === projectId &&
      d.status === "ready_for_review"
  ).length;
}

function needsCustomerReview(project: MarketingProject, domainInput: MarketingPeerDomainInput): boolean {
  const setup = project.campaignSetup;
  if (!setup) return false;

  if (pendingDraftCount(project.id, domainInput) > 0) return true;

  const approvals = setup.stepApprovals ?? {};
  const strategyReady = Boolean(
    setup.strategyGeneratedAt || setup.campaignBrainOutputs?.strategy
  );

  if (strategyReady && approvals.strategy_determined !== "approved") return true;
  if (approvals.strategy_determined === "approved" && approvals.channels_selected !== "approved") {
    return true;
  }
  if (approvals.channels_selected === "approved" && approvals.deliverables_created !== "approved") {
    return true;
  }

  return false;
}

function strategyRunActive(project: MarketingProject): boolean {
  const run = project.campaignSetup?.strategyRun;
  return run?.status === "queued" || run?.status === "running" || run?.status === "waiting_for_input";
}

/** Resolve canonical lifecycle phase for Office campaign workflow + Work list. */
export function resolveCampaignLifecyclePhase(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  isDemo: boolean;
  isCampaignScheduled?: boolean;
  isCampaignPublished?: boolean;
  publishingState?: CampaignPublishingState;
}): CampaignLifecyclePhase {
  const scheduled =
    input.isCampaignScheduled ??
    isCampaignScheduled(input.project, input.domainInput, input.isDemo);
  const published =
    input.isCampaignPublished ??
    isCampaignPublished(input.project, input.domainInput, input.isDemo);
  const publishingState =
    input.publishingState ??
    resolveCampaignPublishingState({
      project: input.project,
      domainInput: input.domainInput,
      connections: input.domainInput.connections,
      isCampaignPublished: published,
      isDemo: input.isDemo,
    });

  if (published) return "published";
  if (scheduled) {
    return publishingState === "not_configured" ? "scheduled" : "publishing_pending";
  }

  if (needsCustomerReview(input.project, input.domainInput)) return "review";
  if (strategyRunActive(input.project)) return "planning";

  const setup = input.project.campaignSetup;
  if (setup?.strategyGeneratedAt || setup?.campaignBrainOutputs?.strategy) return "review";
  if (setup?.businessAnalyzedApproved || setup?.campaignBrandContext) return "planning";

  return setup ? "planning" : "concept";
}

/** Map lifecycle phase → marketing project status vocabulary for Work list. */
export function lifecyclePhaseToProjectStatus(phase: CampaignLifecyclePhase): MarketingProjectStatus {
  switch (phase) {
    case "concept":
    case "planning":
      return "planning";
    case "review":
      return "waiting_for_review";
    case "scheduled":
    case "publishing_pending":
      return "scheduled";
    case "published":
    case "active":
      return "publishing";
    case "optimizing":
      return "monitoring_results";
    case "completed":
      return "completed";
    default:
      return "planning";
  }
}

export function customerLifecycleLabel(
  phase: CampaignLifecyclePhase,
  nl: boolean
): string {
  const labels: Record<CampaignLifecyclePhase, { en: string; nl: string }> = {
    concept: { en: "Concept", nl: "Concept" },
    planning: { en: "Planning", nl: "Planning" },
    review: { en: "Review", nl: "Review" },
    scheduled: { en: "Scheduled", nl: "Ingepland" },
    publishing_pending: { en: "Awaiting publication", nl: "Wacht op publicatie" },
    published: { en: "Published", nl: "Gepubliceerd" },
    active: { en: "Active", nl: "Actief" },
    completed: { en: "Completed", nl: "Afgerond" },
    optimizing: { en: "Optimizing", nl: "Optimaliseren" },
  };
  return nl ? labels[phase].nl : labels[phase].en;
}

/** Published workflow step when internally scheduled but not externally published. */
export function resolvePublishedStepState(input: {
  isCampaignScheduled: boolean;
  isCampaignPublished: boolean;
  isDemo: boolean;
  publishingState: CampaignPublishingState;
}): CampaignWorkflowStepState {
  if (input.isCampaignPublished) return "done";
  if (!input.isCampaignScheduled) return "upcoming";
  if (input.isDemo && input.publishingState !== "not_configured") return "active";
  return "upcoming";
}

export function workflowStatusHintForStep(input: {
  stepId: CampaignWorkflowStepId;
  state: CampaignWorkflowStepState;
  isCampaignScheduled: boolean;
  isCampaignPublished: boolean;
  publishingState: CampaignPublishingState;
  locale?: string | null;
}): string | undefined {
  const nl = input.locale === "nl";

  if (input.state === "skipped") {
    return nl ? "Overgeslagen" : "Skipped";
  }

  if (input.stepId === "scheduled" && input.state === "done" && input.isCampaignScheduled) {
    return nl ? "Campagne is ingepland." : "Campaign is scheduled.";
  }

  if (
    input.stepId === "published" &&
    input.isCampaignScheduled &&
    !input.isCampaignPublished &&
    input.publishingState === "not_configured"
  ) {
    return nl
      ? "Automatische publicatie is nog niet gekoppeld."
      : "Automatic publishing is not connected yet.";
  }

  if (input.state !== "active") return undefined;

  if (input.stepId === "published" && input.publishingState === "not_configured") {
    return nl
      ? "Automatische publicatie is nog niet gekoppeld."
      : "Automatic publishing is not connected yet.";
  }

  return nl ? "Actief — jouw input nodig" : "Active — your input needed";
}

export function deriveOfficeCampaignWorkMeta(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  isDemo: boolean;
  awaitingProjectIds: ReadonlySet<string>;
  locale?: "en" | "nl";
}): {
  lifecyclePhase: CampaignLifecyclePhase;
  publishingState: CampaignPublishingState;
  projectStatus: MarketingProjectStatus;
  hasStarted: boolean;
  awaitingCustomer: boolean;
} {
  const published = isCampaignPublished(input.project, input.domainInput, input.isDemo);
  const scheduled = isCampaignScheduled(input.project, input.domainInput, input.isDemo);
  const publishingState = resolveCampaignPublishingState({
    project: input.project,
    domainInput: input.domainInput,
    connections: input.domainInput.connections,
    isCampaignPublished: published,
    isDemo: input.isDemo,
  });
  const lifecyclePhase = resolveCampaignLifecyclePhase({
    project: input.project,
    domainInput: input.domainInput,
    isDemo: input.isDemo,
    isCampaignScheduled: scheduled,
    isCampaignPublished: published,
    publishingState,
  });

  const setup = input.project.campaignSetup;
  const hasStarted = Boolean(
    setup &&
      (setup.businessAnalyzedApproved ||
        setup.strategyGeneratedAt ||
        setup.campaignBrainOutputs ||
        setup.stepApprovals ||
        scheduled)
  );

  const awaitingCustomer =
    needsCustomerReview(input.project, input.domainInput) ||
    input.awaitingProjectIds.has(input.project.id);

  return {
    lifecyclePhase,
    publishingState,
    projectStatus: lifecyclePhaseToProjectStatus(lifecyclePhase),
    hasStarted,
    awaitingCustomer,
  };
}
