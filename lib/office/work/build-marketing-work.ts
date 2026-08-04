import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { readCampaignScheduleRecord } from "@/lib/office/campaign/campaign-schedule-state";
import { buildMarketingPeerAttentionItems } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import {
  deriveProjectNextStep,
  primaryWorkUnitForProject,
  projectStatusLabel,
} from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type {
  CampaignSetupChannel,
  MarketingProject,
  MarketingProjectStatus,
} from "@/lib/peer-experience/marketing/projects/types";
import type { IntegrationConnection, IntegrationProviderId } from "@/lib/integrations/types";
import {
  presentExpectedDate,
  presentNextStep,
  presentPublishingNotConnectedText,
  presentScheduledPrimaryText,
} from "../presentation";
import { officeCampaignHref } from "../links";
import {
  resolveMarketingWorkBucket,
  workGroupIdFromBucket,
  type MarketingWorkBucket,
} from "./resolve-marketing-work-bucket";
import type {
  WorkChannel,
  WorkCopy,
  WorkGroup,
  WorkGroupId,
  WorkItem,
  WorkProposal,
  WorkProposalTerm,
  WorkProposalTerms,
  WorkStagePreview,
  WorkViewModel,
} from "./types";

/**
 * Stage labels, translated at the presentation boundary.
 */
const STAGE_LABELS: Record<string, Record<MarketingProjectStatus, string>> = {
  en: {
    planning: "Planning",
    preparing: "Preparing",
    waiting_for_review: "Waiting for your go-ahead",
    scheduled: "Scheduled",
    publishing: "Publishing",
    monitoring_results: "Watching results",
    completed: "Completed",
    archived: "Archived",
  },
  nl: {
    planning: "Aanpak",
    preparing: "In de maak",
    waiting_for_review: "Wacht op jouw akkoord",
    scheduled: "Ingepland",
    publishing: "Gaat live",
    monitoring_results: "Resultaten in de gaten",
    completed: "Afgerond",
    archived: "Gearchiveerd",
  },
};

function stageLabelFor(
  status: MarketingProjectStatus,
  locale: "en" | "nl"
): string {
  return (STAGE_LABELS[locale] ?? STAGE_LABELS.en)[status] ?? projectStatusLabel(status);
}

/** Publishing channels the customer chose, mapped to the provider that serves them. */
const CHANNEL_PROVIDER: Partial<Record<CampaignSetupChannel, IntegrationProviderId>> = {
  linkedin: "linkedin",
  instagram: "instagram",
  meta_ads: "meta",
  google_ads: "google_ads",
  email: "mailchimp",
  blog: "wordpress",
  website_landing: "wordpress",
};

const CHANNEL_LABEL: Record<CampaignSetupChannel, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "Email",
  blog: "Blog",
  website_landing: "Website",
  meta_ads: "Meta ads",
  google_ads: "Google Ads",
  other: "Other",
  decide_later: "Not chosen yet",
};

function workCopy(locale: "en" | "nl"): WorkCopy {
  if (locale === "nl") {
    return {
      title: "Werk",
      createLabel: "Nieuwe campagne",
      nextStepLabel: "Hierna",
      blockedLabel: "Loopt vast op",
      notConnectedLabel: (channel) => `${channel} is nog niet gekoppeld`,
      showFinished: "Toon afgerond werk",
      hideFinished: "Verberg afgerond werk",
      whereIdStart: "Waar ik zou beginnen",
      basedOnPrefix: "Op basis van",
      startingOnPrefix: "te beginnen op",
    };
  }
  return {
    title: "Work",
    createLabel: "New campaign",
    nextStepLabel: "Next",
    blockedLabel: "Held up by",
    notConnectedLabel: (channel) => `${channel} isn't connected yet`,
    showFinished: "Show finished work",
    hideFinished: "Hide finished work",
    whereIdStart: "Where I\u2019d start",
    basedOnPrefix: "Based on",
    startingOnPrefix: "starting on",
  };
}

function groupTitle(id: WorkGroupId, locale: "en" | "nl"): string {
  const en: Record<WorkGroupId, string> = {
    blocked_on_you: "Waiting on you",
    blocked_elsewhere: "Waiting on something else",
    moving: "Moving",
    queued: "Scheduled",
    finished: "Recently finished",
  };
  const nl: Record<WorkGroupId, string> = {
    blocked_on_you: "Wacht op jou",
    blocked_elsewhere: "Geblokkeerd",
    moving: "Loopt",
    queued: "Ingepland",
    finished: "Recent afgerond",
  };
  return locale === "nl" ? nl[id] : en[id];
}

function channelsForProject(
  project: MarketingProject,
  connections: readonly IntegrationConnection[]
): WorkChannel[] {
  const selected = project.campaignSetup?.selectedChannels ?? [];

  return selected
    .filter((channel) => channel !== "decide_later")
    .map((channel) => {
      const provider = CHANNEL_PROVIDER[channel];
      const connection = provider
        ? connections.find((c) => c.id === provider)
        : undefined;

      return {
        id: channel,
        label: CHANNEL_LABEL[channel] ?? channel,
        connected: provider ? connection?.status === "connected" : true,
      };
    });
}

function actionLabelForBucket(bucket: MarketingWorkBucket, locale: "en" | "nl"): string | null {
  switch (bucket) {
    case "attention":
      return locale === "nl" ? "Beoordelen" : "Review";
    case "scheduled":
      return locale === "nl" ? "Open campagne" : "Open campaign";
    case "blocked":
      return locale === "nl" ? "Probleem bekijken" : "View issue";
    case "recently_completed":
      return locale === "nl" ? "Resultaat bekijken" : "View results";
    case "running":
      return locale === "nl" ? "Open campagne" : "Open campaign";
    default:
      return null;
  }
}

function buildCardCopy(input: {
  project: MarketingProject;
  domainInput: MarketingPeerDomainInput;
  isDemo: boolean;
  locale: "en" | "nl";
  bucket: MarketingWorkBucket;
  projectStatus: MarketingProjectStatus;
  publishingState: import("@/lib/office/campaign/campaign-lifecycle").CampaignPublishingState;
  workUnits: MarketingPeerDomainInput["workUnits"];
}): Pick<WorkItem, "primaryText" | "secondaryText" | "nextStep"> {
  const { project, domainInput, isDemo, locale, bucket, projectStatus, publishingState } =
    input;

  if (bucket === "scheduled") {
    const record = readCampaignScheduleRecord(project, domainInput, isDemo);
    const primaryText = record ? presentScheduledPrimaryText(record, locale) : null;
    const secondaryText =
      publishingState === "not_configured"
        ? presentPublishingNotConnectedText(locale)
        : null;
    return { primaryText, secondaryText, nextStep: primaryText };
  }

  const rawNext = presentNextStep(
    deriveProjectNextStep(projectStatus, input.workUnits, project.id),
    locale
  );

  if (bucket === "blocked" && publishingState === "failed") {
    return {
      primaryText:
        locale === "nl" ? "Publicatie is mislukt" : "Publication failed",
      secondaryText: locale === "nl" ? "Bekijk wat er misging" : "See what went wrong",
      nextStep: rawNext,
    };
  }

  return {
    primaryText: rawNext,
    secondaryText: null,
    nextStep: rawNext,
  };
}

function blockedByLabel(input: {
  bucket: MarketingWorkBucket;
  reason: import("./resolve-marketing-work-bucket").MarketingWorkBucketReason;
  locale: "en" | "nl";
  copy: WorkCopy;
  disconnectedChannel?: WorkChannel;
}): string | null {
  if (input.bucket !== "blocked") return null;

  if (input.reason === "publication_failed") {
    return input.locale === "nl" ? "publicatie mislukt" : "publication failed";
  }
  if (input.reason === "terminal_failure") {
    return input.locale === "nl" ? "strategie mislukt" : "strategy failed";
  }
  if (input.reason === "integration_blocked_during_publish" && input.disconnectedChannel) {
    return input.copy.notConnectedLabel(input.disconnectedChannel.label);
  }
  if (input.reason === "paused") {
    return input.locale === "nl" ? "gepauzeerd" : "paused";
  }
  return input.locale === "nl" ? "geblokkeerd" : "blocked";
}

function stagePreview(locale: "en" | "nl"): WorkStagePreview[] {
  if (locale === "nl") {
    return [
      { id: "plan", label: "Aanpak", description: "Ik werk de opzet en de doelgroep uit.", needsYou: false },
      { id: "create", label: "Maken", description: "Ik schrijf de content en maak het beeld.", needsYou: false },
      { id: "review", label: "Jouw akkoord", description: "Je ziet alles voordat er iets naar buiten gaat.", needsYou: true },
      { id: "publish", label: "Live", description: "Ik publiceer op het afgesproken moment.", needsYou: false },
      { id: "watch", label: "Volgen", description: "Ik houd bij hoe het loopt en meld het als het opvalt.", needsYou: false },
    ];
  }
  return [
    { id: "plan", label: "Approach", description: "I work out the angle and who it's for.", needsYou: false },
    { id: "create", label: "Make", description: "I write the content and put the visuals together.", needsYou: false },
    { id: "review", label: "Your go-ahead", description: "You see everything before any of it goes out.", needsYou: true },
    { id: "publish", label: "Live", description: "I publish at the time we agreed.", needsYou: false },
    { id: "watch", label: "Watch", description: "I track how it lands and tell you if it's worth knowing.", needsYou: false },
  ];
}

function buildProposalTerms(
  domainInput: MarketingPeerDomainInput,
  stages: WorkStagePreview[],
  locale: "en" | "nl"
): WorkProposalTerms | null {
  const nl = locale === "nl";
  const idea = domainInput.strategy?.campaignIdeas?.[0] ?? null;
  const audience = domainInput.strategy?.targetAudiences?.find(
    (candidate) => candidate.priority === "primary"
  );

  const items: WorkProposalTerm[] = [];

  if (idea?.objective?.trim()) {
    items.push({
      id: "objective",
      label: nl ? "Waarvoor" : "What it's for",
      value: idea.objective.trim(),
    });
  }
  if (idea?.rationale?.why?.trim()) {
    items.push({
      id: "why",
      label: nl ? "Waarom nu" : "Why this one",
      value: idea.rationale.why.trim(),
    });
  }
  if (audience?.segment?.trim()) {
    items.push({
      id: "audience",
      label: nl ? "Voor wie" : "Who it's for",
      value: audience.segment.trim(),
    });
  }
  if (idea?.channels?.length) {
    items.push({
      id: "channels",
      label: nl ? "Waar" : "Where",
      value: idea.channels.join(" · "),
    });
  }

  const approvals = stages.filter((stage) => stage.needsYou).length;
  if (approvals > 0) {
    items.push({
      id: "effort",
      label: nl ? "Wat het jou kost" : "What it asks of you",
      value: nl
        ? approvals === 1
          ? "Eén akkoord, voordat er iets naar buiten gaat."
          : `${approvals} momenten waarop ik bij je terugkom.`
        : approvals === 1
          ? "One go-ahead, before anything goes out."
          : `${approvals} points where I come back to you.`,
    });
  }

  if (items.length === 0) return null;

  return {
    heading: nl ? "Wat ik voorstel" : "What I'm proposing",
    items,
  };
}

function buildProposal(
  domainInput: MarketingPeerDomainInput,
  locale: "en" | "nl"
): WorkProposal {
  const segment = domainInput.understanding?.customerSegments?.[0]?.name?.trim();
  const stages = stagePreview(locale);
  const terms = buildProposalTerms(domainInput, stages, locale);

  if (locale === "nl") {
    return {
      voice: segment
        ? `Ik zou beginnen met een LinkedIn-campagne gericht op ${segment}.`
        : "Je hebt me nog niets gegeven. Vertel me waar ik aan moet werken en ik ga aan de slag.",
      next: segment
        ? "Dat is de snelste manier om te zien of de boodschap aanslaat voordat we breder gaan."
        : null,
      acceptLabel: segment ? "Maak een opzet" : "Vertel me wat je nodig hebt",
      briefLabel: "Ik brief je liever zelf",
      basedOn: segment ? `je doelgroep: ${segment}` : null,
      channel: segment ? "LinkedIn" : null,
      stages,
      stagesHeading: "Zo verloopt een campagne",
      terms,
    };
  }

  return {
    voice: segment
      ? `I'd start with a LinkedIn campaign aimed at ${segment}.`
      : "You haven't given me anything yet. Tell me what you'd like me to work on and I'll get started.",
    next: segment
      ? "It's the fastest way to find out whether the message lands before we go wider."
      : null,
    acceptLabel: segment ? "Draft it" : "Tell me what you need",
    briefLabel: "I'd rather brief you myself",
    basedOn: segment ? `your audience: ${segment}` : null,
    channel: segment ? "LinkedIn" : null,
    stages,
    stagesHeading: "How a campaign runs",
    terms,
  };
}

export function buildMarketingWorkViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
}): WorkViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const copy = workCopy(locale);
  const { domainInput } = input;
  const peerId = domainInput.peerId;
  const v17Copy = getV17PeerCopy(locale);
  const isDemo = peerId === "demo";

  const attention = buildMarketingPeerAttentionItems({
    domainInput,
    locale,
    primaryCtaLabel: v17Copy.reviewCta,
  });
  const awaitingProjectIds = new Set(
    attention.map((item) => item.projectId).filter(Boolean) as string[]
  );

  const buckets = new Map<WorkGroupId, WorkItem[]>();

  for (const project of domainInput.projects) {
    const unit = primaryWorkUnitForProject(project.id, domainInput.workUnits);
    const channels = channelsForProject(project, domainInput.connections);
    const disconnectedChannel = channels.find((c) => !c.connected);

    const bucketResult = resolveMarketingWorkBucket({
      project,
      domainInput,
      isDemo,
      awaitingProjectIds,
      disconnectedChannel,
      paused: Boolean(unit?.paused),
    });

    const group = workGroupIdFromBucket(bucketResult.bucket);
    const stageLabel = stageLabelFor(bucketResult.projectStatus, locale);
    const cardCopy = buildCardCopy({
      project,
      domainInput,
      isDemo,
      locale,
      bucket: bucketResult.bucket,
      projectStatus: bucketResult.projectStatus,
      publishingState: bucketResult.publishingState,
      workUnits: domainInput.workUnits,
    });

    const blockedBy =
      bucketResult.bucket === "attention"
        ? locale === "nl"
          ? "jou"
          : "you"
        : blockedByLabel({
            bucket: bucketResult.bucket,
            reason: bucketResult.reason,
            locale,
            copy,
            disconnectedChannel,
          });

    const item: WorkItem = {
      id: project.id,
      name: project.title,
      stageLabel,
      primaryText: cardCopy.primaryText,
      secondaryText: cardCopy.secondaryText,
      actionLabel: actionLabelForBucket(bucketResult.bucket, locale),
      nextStep: cardCopy.nextStep,
      blockedBy,
      expectedLabel: presentExpectedDate(unit?.estimatedCompletionAt, locale),
      href: officeCampaignHref(peerId, project.id),
      channels,
      bucket: bucketResult.bucket,
    };

    const existing = buckets.get(group) ?? [];
    existing.push(item);
    buckets.set(group, existing);
  }

  const groups: WorkGroup[] = (
    ["blocked_on_you", "blocked_elsewhere", "moving", "queued", "finished"] as const
  )
    .map((id) => ({
      id,
      title: groupTitle(id, locale),
      items: buckets.get(id) ?? [],
      collapsedByDefault: id === "finished",
    }))
    .filter((group) => group.items.length > 0);

  const hasAnyWork = domainInput.projects.length > 0;

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence: null,
    groups,
    proposal: hasAnyWork ? null : buildProposal(domainInput, locale),
    copy,
  };
}

/** Filter counts keyed by Work page filter id. */
export function workFilterCounts(model: WorkViewModel): Record<WorkGroupId | "all", number> {
  const counts: Record<WorkGroupId | "all", number> = {
    all: 0,
    blocked_on_you: 0,
    blocked_elsewhere: 0,
    moving: 0,
    queued: 0,
    finished: 0,
  };
  for (const group of model.groups) {
    counts[group.id] = group.items.length;
    counts.all += group.items.length;
  }
  return counts;
}
