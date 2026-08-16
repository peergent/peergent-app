import {
  deriveProjectStatus,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { officeHref } from "../links";
import { resolveProjectIdForDraft } from "../attribution";
import { customerLabelForProjectStatus } from "./customer-facing-status";
import { readDemoCampaignOverlay } from "@/lib/office/demo/demo-campaign-domain-overlay";
import { buildCampaignWorkflowViewModel } from "./build-campaign-workflow";
import { buildCampaignContext } from "./campaign-context";
import { buildWebsiteMissingPrompt, buildCompetitorMissingPrompt } from "./build-campaign-workflow-evidence";
import {
  EMMA_OPENING_EN,
  EMMA_OPENING_NL,
  EMMA_PLAN_STEPS_EN,
  EMMA_PLAN_STEPS_NL,
} from "./build-structured-strategy-evidence";
import { workflowBasedStatusLabel } from "./campaign-workflow-status";
import {
  isEpisodeRuntimeAuthoritative,
  resolveEpisodeStatusLabel,
  type CampaignRuntimeProjection,
} from "./campaign-runtime-projection";
import { readCampaignScheduleRecord } from "./campaign-schedule-state";
import { buildOptimizationMetrics, formatOfficeDate } from "./campaign-optimization";
import { buildCampaignResultsViewModel } from "./build-campaign-results";
import type { CampaignExecutionMode } from "./workflow-types";
import type { CampaignDurationSnapshot } from "./campaign-duration";
import { formatDurationPresetLabel, formatDurationRange, formatRunningStatus } from "./campaign-duration";

export type CampaignWorkspaceItemKind = "completed" | "pending" | "preview";

export type CampaignWorkspaceItem = {
  id: string;
  kind: CampaignWorkspaceItemKind;
  label: string;
  description?: string;
  draftId?: string;
  channel?: string;
  reviewHref?: string;
  previewHref?: string;
  detailHref?: string;
  evidence?: string;
  actionable: boolean;
};

export type CampaignDetailTimelineStep = {
  id: string;
  label: string;
  state: "done" | "active" | "upcoming";
};

export type CampaignActivityItem = {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
};

export type CampaignScheduleInfo = {
  scheduledAt: string;
  scheduledAtLabel: string;
  channels: string[];
  deliverableLabels: string[];
  /** Live Office — truthful note when external publish is unavailable. */
  integrationsNote?: string;
};

export type CampaignDetailViewModel = {
  peerId: string;
  projectId: string;
  name: string;
  statusLabel: string;
  lifecycleStatus: "review" | "ready_to_schedule" | "scheduled" | "published" | "planning";
  goal: string;
  why: string;
  channels: string[];
  ownerLabel: string;
  createdAtLabel: string;
  detailHref: string;
  scheduleInfo: CampaignScheduleInfo | null;
  publishedAtLabel: string | null;
  emmaOpeningLine: string | null;
  emmaPlanSteps: readonly string[];
  websitePrompt: { message: string; addWebsiteLabel: string; skipLabel: string } | null;
  websiteEditUrl: string | null;
  competitorPrompt: { message: string; addLabel: string; skipLabel: string } | null;
  manualChoiceSummary: readonly { label: string; value: string }[] | null;
  executionMode: CampaignExecutionMode;
  optimizationMetrics: readonly { label: string; value: string }[];
  optimizationHasData: boolean;
  resultsViewModel: import("./build-campaign-results").CampaignResultsViewModel;
  performanceLabel: string;
  performanceActionable: boolean;
  durationSummary: {
    runningLabel: string | null;
    dateRangeLabel: string | null;
    statusLabel: string | null;
    duration: CampaignDurationSnapshot | null;
  } | null;
  deliverablesSectionLabel: string;
  completed: CampaignWorkspaceItem[];
  pending: CampaignWorkspaceItem[];
  previews: CampaignWorkspaceItem[];
  timeline: CampaignDetailTimelineStep[];
  activityItems: CampaignActivityItem[];
  producedDrafts: MarketingContentDraft[];
  workflow: import("./workflow-types").CampaignWorkflowViewModel;
};

function channelLabel(channel: string, nl: boolean): string {
  const map: Record<string, { en: string; nl: string }> = {
    linkedin: { en: "LinkedIn", nl: "LinkedIn" },
    instagram: { en: "Instagram", nl: "Instagram" },
    google_ads: { en: "Google Ads", nl: "Google Ads" },
    newsletter: { en: "Newsletter", nl: "Nieuwsbrief" },
    email: { en: "Email", nl: "E-mail" },
    blog: { en: "Blog", nl: "Blog" },
    website_landing: { en: "Landing page", nl: "Landingspagina" },
  };
  return map[channel]?.[nl ? "nl" : "en"] ?? channel;
}

function projectDrafts(
  projectId: string,
  domainInput: MarketingPeerDomainInput
): MarketingContentDraft[] {
  return domainInput.drafts.filter(
    (draft) => resolveProjectIdForDraft(draft, domainInput.workUnits) === projectId
  );
}

function buildTimeline(
  status: ReturnType<typeof deriveProjectStatus>,
  nl: boolean
): CampaignDetailTimelineStep[] {
  const steps: { id: string; en: string; nl: string }[] = [
    { id: "research", en: "Research", nl: "Onderzoek" },
    { id: "strategy", en: "Strategy", nl: "Strategie" },
    { id: "production", en: "Content production", nl: "Contentproductie" },
    { id: "review", en: "Review", nl: "Review" },
    { id: "scheduled", en: "Scheduled", nl: "Ingepland" },
    { id: "published", en: "Published", nl: "Gepubliceerd" },
    { id: "measurement", en: "Measurement", nl: "Meting" },
  ];

  const order = ["planning", "preparing", "waiting_for_review", "scheduled", "publishing", "monitoring_results", "completed"];
  const idx = order.indexOf(status);

  return steps.map((step, index) => {
    let state: CampaignDetailTimelineStep["state"] = "upcoming";
    if (idx >= 5 && index <= 5) state = "done";
    else if (idx >= 3 && index <= 4) state = index <= 3 ? "done" : "active";
    else if (idx >= 1 && index <= 2) state = index <= 1 ? "done" : "active";
    else if (idx >= 0 && index === 0) state = "done";
    if (status === "waiting_for_review" && step.id === "review") state = "active";
    if (status === "preparing" && step.id === "production") state = "active";
    return { id: step.id, label: nl ? step.nl : step.en, state };
  });
}

export function buildCampaignDetailViewModel(input: {
  peerId: string;
  projectId: string;
  domainInput: MarketingPeerDomainInput;
  locale?: string | null;
  isDemo?: boolean;
  runtimeProjection?: CampaignRuntimeProjection | null;
}): CampaignDetailViewModel | null {
  const { peerId, projectId, domainInput } = input;
  const nl = input.locale === "nl";
  const isDemo = input.isDemo ?? peerId === "demo";
  const overlay = readDemoCampaignOverlay(domainInput);
  const project = domainInput.projects.find((p) => p.id === projectId);
  if (!project) return null;

  const drafts = projectDrafts(projectId, domainInput);
  const status = deriveProjectStatus(
    project,
    domainInput.workUnits,
    domainInput.drafts,
    new Set()
  );

  const scheduleRecord = readCampaignScheduleRecord(project, domainInput, isDemo);
  const publishedRecord = overlay.demoCampaignPublished?.[projectId];
  const hasPublished = drafts.some((d) => d.status === "published");
  const hasPending = drafts.some((d) => d.status === "ready_for_review");
  const deliverablesApproved =
    project.campaignSetup?.stepApprovals?.deliverables_created === "approved";
  const allApproved =
    (drafts.length > 0 &&
      drafts.every((d) => d.status === "approved" || d.status === "ready_to_publish" || d.status === "published")) ||
    deliverablesApproved;

  let lifecycleStatus: CampaignDetailViewModel["lifecycleStatus"] = "planning";
  if (hasPublished || publishedRecord) lifecycleStatus = "published";
  else if (scheduleRecord) lifecycleStatus = "scheduled";
  else if (allApproved && !hasPending) lifecycleStatus = "ready_to_schedule";
  else if (hasPending || status === "waiting_for_review") lifecycleStatus = "review";

  let statusLabel = customerLabelForProjectStatus(status, input.locale, {
    hasPendingReview: hasPending,
  });
  if (lifecycleStatus === "scheduled") statusLabel = nl ? "Ingepland" : "Scheduled";
  if (lifecycleStatus === "published") statusLabel = nl ? "Gepubliceerd" : "Published";
  if (lifecycleStatus === "ready_to_schedule") statusLabel = nl ? "Klaar om in te plannen" : "Ready to schedule";

  const workflow = buildCampaignWorkflowViewModel({
    peerId,
    project,
    domainInput,
    locale: input.locale,
    isDemo,
    runtimeProjection: input.runtimeProjection,
  });
  const activeWorkflowStep = workflow.steps.find((s) => s.state === "active");
  const episodeRuntime = isEpisodeRuntimeAuthoritative(input.runtimeProjection)
    ? input.runtimeProjection
    : null;
  const workflowStatus = episodeRuntime
    ? resolveEpisodeStatusLabel(episodeRuntime, input.locale)
    : workflowBasedStatusLabel({
        activeStepId: activeWorkflowStep?.id,
        campaignContext:
          overlay.demoCampaignContexts?.[projectId] ??
          buildCampaignContext({ project, domainInput, locale: input.locale }),
        executionMode: workflow.executionMode,
        pendingApprovalCount: workflow.approvalCenter.count,
        locale: input.locale,
        lifecyclePublished: lifecycleStatus === "published",
        lifecycleScheduled: lifecycleStatus === "scheduled",
      });
  if (workflowStatus && lifecycleStatus !== "published" && lifecycleStatus !== "scheduled") {
    statusLabel = workflowStatus;
  }
  if (
    episodeRuntime &&
    (episodeRuntime.lifecycleState === "waiting_for_approval" ||
      episodeRuntime.episodeStatus === "waiting_for_approval")
  ) {
    lifecycleStatus = "review";
  }

  const rawChannels = [
    ...new Set(drafts.map((d) => d.channel).filter(Boolean) as string[]),
  ];
  const channels = rawChannels.map((c) => channelLabel(c, nl));

  const completed: CampaignWorkspaceItem[] = [];
  const pending: CampaignWorkspaceItem[] = [];
  const previews: CampaignWorkspaceItem[] = [];
  const seenPreviewChannels = new Set<string>();

  for (const draft of drafts) {
    const label = draft.title || channelLabel(draft.channel ?? "content", nl);
    const previewHref = `${officeHref(peerId, "content")}?preview=${draft.id}`;
    const detailHref = `/office/${peerId}/content/${draft.id}`;

    if (draft.status === "published" || draft.status === "approved") {
      completed.push({
        id: draft.id,
        kind: "completed",
        label,
        description: draft.objective,
        draftId: draft.id,
        channel: draft.channel ?? undefined,
        previewHref,
        detailHref,
        evidence: draft.body?.slice(0, 240),
        actionable: Boolean(draft.body),
      });
    }

    if (draft.status === "ready_for_review") {
      pending.push({
        id: draft.id,
        kind: "pending",
        label,
        description: nl ? "Wacht op jouw goedkeuring" : "Waiting for your approval",
        draftId: draft.id,
        channel: draft.channel ?? undefined,
        previewHref,
        detailHref,
        reviewHref: previewHref,
        actionable: true,
      });
    }

    const channel = draft.channel ?? "content";
    if (!seenPreviewChannels.has(channel)) {
      seenPreviewChannels.add(channel);
      previews.push({
        id: `preview-${channel}`,
        kind: "preview",
        label: channelLabel(channel, nl),
        draftId: draft.id,
        channel,
        previewHref,
        actionable: true,
      });
    }
  }

  if (pending.length === 0 && status === "waiting_for_review") {
    pending.push({
      id: "pending-review",
      kind: "pending",
      label: nl ? "Goedkeuring headline" : "Headline approval",
      description: nl ? "Er staat content klaar voor review." : "Content is ready for review.",
      actionable: drafts.some((d) => d.status === "ready_for_review"),
      previewHref: drafts.find((d) => d.status === "ready_for_review")
        ? `${officeHref(peerId, "content")}?preview=${drafts.find((d) => d.status === "ready_for_review")!.id}`
        : undefined,
    });
  }

  const stepApprovals = overlay.demoCampaignStepApprovals?.[projectId];

  const demoActivity: CampaignActivityItem[] = (overlay.demoCampaignActivity ?? [])
    .filter((item) => item.projectId === projectId)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      timeLabel: new Date(item.at).toLocaleDateString(nl ? "nl-NL" : "en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

  const activityItems: CampaignActivityItem[] = demoActivity
    .slice()
    .reverse()
    .slice(0, 8);

  const campaignContext =
    overlay.demoCampaignContexts?.[projectId] ??
    buildCampaignContext({
      project,
      domainInput,
      locale: input.locale,
      websiteSkipped: overlay.demoCampaignContexts?.[projectId]?.websiteState === "skipped",
      websiteUrl: overlay.demoCampaignContexts?.[projectId]?.websiteUrl ?? undefined,
      competitors: overlay.demoCampaignContexts?.[projectId]?.competitors,
      competitorsSkipped: overlay.demoCampaignContexts?.[projectId]?.competitorsSkipped,
    });

  const isNewWizardCampaign =
    project.origin === "campaign_wizard" &&
    !publishedRecord &&
    !scheduleRecord &&
    demoActivity.length <= 2;

  const emmaOpeningLine = isNewWizardCampaign ? (nl ? EMMA_OPENING_NL : EMMA_OPENING_EN) : null;

  const emmaPlanSteps = isNewWizardCampaign
    ? nl
      ? EMMA_PLAN_STEPS_NL
      : EMMA_PLAN_STEPS_EN
    : [];

  const websitePrompt =
    campaignContext.websiteState === "missing" &&
    !stepApprovals?.website_analyzed
      ? buildWebsiteMissingPrompt(campaignContext, nl)
      : null;

  const websiteEditUrl =
    (campaignContext.websiteState === "simulated_analysis_complete" ||
      campaignContext.websiteState === "available") &&
    campaignContext.websiteUrl
      ? campaignContext.websiteUrl
      : null;

  const competitorPrompt =
    !campaignContext.isSeedCampaign &&
    campaignContext.competitorContextState === "missing" &&
    !stepApprovals?.competitors_analyzed &&
    (stepApprovals?.website_analyzed === "approved" || campaignContext.websiteState !== "missing")
      ? buildCompetitorMissingPrompt(campaignContext, nl)
      : null;

  const setup = project.campaignSetup;
  const manualChoiceSummary =
    campaignContext.campaignMode === "manual" && setup
      ? [
          {
            label: nl ? "Doelen" : "Goals",
            value: campaignContext.goals.join(" · ") || "—",
          },
          {
            label: nl ? "Doelgroep" : "Audience",
            value: campaignContext.audience || "—",
          },
          {
            label: nl ? "Kanalen" : "Channels",
            value:
              campaignContext.selectedChannels.length > 0
                ? campaignContext.selectedChannels.map((c) => channelLabel(c, nl)).join(", ")
                : "—",
          },
          {
            label: nl ? "Onderdelen" : "Deliverables",
            value:
              campaignContext.selectedDeliverables.length > 0
                ? campaignContext.selectedDeliverables
                    .map((d) => d.replace(/_/g, " "))
                    .join(", ")
                : "—",
          },
          {
            label: nl ? "Timing" : "Timing",
            value: setup.startDate
              ? `${setup.startDate}${setup.endDate ? ` – ${setup.endDate}` : ""}`
              : campaignContext.durationPreset
                ? formatDurationPresetLabel(campaignContext.durationPreset, input.locale)
                : nl
                  ? "Geen vaste deadline"
                  : "No fixed deadline",
          },
          {
            label: nl ? "Uitvoeringsmodus" : "Execution mode",
            value:
              campaignContext.executionMode === "fully_automatic"
                ? nl
                  ? "Volledig automatisch"
                  : "Fully automatic"
                : campaignContext.executionMode === "semi_automatic"
                  ? nl
                    ? "Semi-automatisch"
                    : "Semi-automatic"
                  : nl
                    ? "Handmatig"
                    : "Manual",
          },
        ]
      : null;

  const { metrics: optimizationMetrics, hasSufficientData: optimizationHasData } =
    buildOptimizationMetrics({
      channels: rawChannels,
      locale: input.locale,
      isPublished: lifecycleStatus === "published",
    });

  const resultsViewModel = buildCampaignResultsViewModel({
    channels: rawChannels,
    locale: input.locale,
    isPublished: lifecycleStatus === "published",
    isScheduled: lifecycleStatus === "scheduled",
    campaignName: project.title,
    executionMode: campaignContext.executionMode,
    publishedAt: publishedRecord?.publishedAt ?? null,
    scheduledAt: scheduleRecord?.scheduledAt ?? null,
    durationPreset: campaignContext.durationPreset,
    startDate: campaignContext.startDate,
    endDate: campaignContext.endDate,
    durationDays: campaignContext.durationDays,
  });

  let performanceLabel = "";
  let performanceActionable = false;
  if (lifecycleStatus === "published") {
    if (optimizationHasData) {
      performanceLabel = nl ? "Bekijk resultaten →" : "View results →";
      performanceActionable = true;
    } else {
      performanceLabel = nl ? "Resultaten worden verzameld" : "Results are being collected";
      performanceActionable = false;
    }
  }

  const deliverablesSectionLabel = nl ? "Gemaakt voor deze campagne" : "Created for this campaign";

  const scheduleInfo: CampaignScheduleInfo | null = scheduleRecord
    ? {
        scheduledAt: scheduleRecord.scheduledAt,
        scheduledAtLabel: new Date(scheduleRecord.scheduledAt).toLocaleString(nl ? "nl-NL" : "en-GB", {
          timeZone: scheduleRecord.timezone,
        }),
        channels: scheduleRecord.channels.map((c) => channelLabel(c, nl)),
        deliverableLabels: scheduleRecord.deliverableIds.map((id) => {
          const draft = drafts.find((d) => d.id === id);
          return draft?.title ?? id;
        }),
        integrationsNote: !isDemo
          ? nl
            ? "Publicatiekoppelingen zijn nog niet actief."
            : "Publishing connections are not active yet."
          : undefined,
      }
    : null;

  const publishedAtLabel = publishedRecord
    ? formatOfficeDate(publishedRecord.publishedAt, input.locale)
    : null;

  const durationSummary =
    lifecycleStatus === "published" && resultsViewModel.duration
      ? {
          runningLabel: nl ? "Actief" : "Running",
          dateRangeLabel: formatDurationRange(resultsViewModel.duration, input.locale),
          statusLabel: formatRunningStatus(resultsViewModel.duration, input.locale),
          duration: resultsViewModel.duration,
        }
      : lifecycleStatus === "scheduled" && campaignContext.startDate
        ? {
            runningLabel: nl ? "Ingepland" : "Scheduled",
            dateRangeLabel: campaignContext.endDate
              ? `${campaignContext.startDate} → ${campaignContext.endDate}`
              : campaignContext.startDate,
            statusLabel: formatDurationPresetLabel(campaignContext.durationPreset, input.locale),
            duration: resultsViewModel.duration,
          }
        : campaignContext.startDate
          ? {
              runningLabel: null,
              dateRangeLabel: campaignContext.endDate
                ? `${campaignContext.startDate} → ${campaignContext.endDate}`
                : campaignContext.startDate,
              statusLabel: formatDurationPresetLabel(campaignContext.durationPreset, input.locale),
              duration: resultsViewModel.duration,
            }
          : null;

  return {
    peerId,
    projectId,
    name: project.title,
    statusLabel,
    lifecycleStatus,
    goal: project.goal ?? "",
    why: project.rawRequest ?? "",
    channels,
    ownerLabel: project.ownerLabel ?? "",
    createdAtLabel: formatOfficeDate(project.createdAt, input.locale) ?? project.createdAt,
    detailHref: `${officeHref(peerId, "work")}/campaigns/${projectId}`,
    scheduleInfo,
    publishedAtLabel,
    emmaOpeningLine,
    emmaPlanSteps,
    websitePrompt,
    websiteEditUrl,
    competitorPrompt,
    manualChoiceSummary,
    executionMode: campaignContext.executionMode,
    optimizationMetrics,
    optimizationHasData,
    resultsViewModel,
    performanceLabel,
    performanceActionable,
    durationSummary,
    deliverablesSectionLabel,
    completed,
    pending,
    previews,
    timeline: buildTimeline(status, nl),
    activityItems,
    producedDrafts: drafts,
    workflow,
  };
}

export function findCampaignProject(
  domainInput: MarketingPeerDomainInput,
  projectId: string
): MarketingProject | null {
  return domainInput.projects.find((p) => p.id === projectId) ?? null;
}
