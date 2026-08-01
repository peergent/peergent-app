import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { getV17PeerCopy } from "@/lib/i18n/v17-peer-copy";
import { buildMarketingPeerAttentionItems } from "@/features/marketing-workspace/lib/build-peer-attention-items";
import {
  deriveProjectNextStep,
  deriveProjectStatus,
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
import { presentExpectedDate, presentNextStep } from "../presentation";

/**
 * Stage labels, translated at the presentation boundary.
 *
 * The domain's own `MARKETING_PROJECT_STATUS_LABELS` stays English on purpose —
 * it is vocabulary, not copy, and other surfaces depend on it. This is the same
 * split the next-step and expected-date presenters already use.
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
import { officeHref } from "../links";
import { resolveProjectIdForDraft } from "../attribution";
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
 * Marketing adapter for Work (§4.2).
 *
 * Reuses project-engine for every marketing meaning — status, next step,
 * primary work unit — and the shared attention builder to determine what is
 * genuinely blocked on the customer. Nothing about marketing is re-derived
 * here; this file only maps those results onto the peer-agnostic shape.
 */

const FINISHED_STATUSES: readonly MarketingProjectStatus[] = [
  "completed",
  "archived",
];

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
    queued: "Queued",
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
        // Channels with no provider (e.g. "other") are never reported as a
        // missing connection — there is nothing to connect.
        connected: provider ? connection?.status === "connected" : true,
      };
    });
}

/**
 * §4.2 The blocker attribution. Resolved in priority order so the customer can
 * identify their own blocking items in under five seconds.
 */
function resolveGroup(input: {
  status: MarketingProjectStatus;
  awaitingCustomer: boolean;
  paused: boolean;
  disconnectedChannel: WorkChannel | undefined;
  hasStarted: boolean;
}): WorkGroupId {
  if (FINISHED_STATUSES.includes(input.status)) return "finished";
  if (input.status === "monitoring_results") return "moving";
  if (input.awaitingCustomer) return "blocked_on_you";
  if (input.paused || input.disconnectedChannel) return "blocked_elsewhere";
  if (!input.hasStarted) return "queued";
  return "moving";
}

/**
 * §4.2 Emma proposes rather than apologises. The proposal is grounded in real
 * business understanding when it exists; when it does not, she asks plainly
 * rather than inventing an audience.
 */
/**
 * The real campaign lifecycle, phrased for customers. Describing how work
 * actually moves is not fabrication — it is the product's own process, and
 * seeing it up front is what makes starting feel safe.
 */
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

/**
 * §4.2 Emma proposes rather than apologises. The proposal is grounded in real
 * business understanding when it exists; when it does not, she asks plainly
 * rather than inventing an audience.
 */
/**
 * §4.2 The terms of the proposal, quoted rather than predicted.
 *
 * A recorded strategy already states what a campaign idea is *for* and why it
 * was suggested. Repeating those here is reporting, not forecasting. The one
 * fact that is not quoted is what the customer has to do — and that is a fact
 * about the product's own lifecycle, counted from the stages themselves.
 *
 * Deliberately absent: expected results, projected revenue and effort in hours.
 * None of those exist anywhere in the system, and inventing them is exactly the
 * confident-sounding fiction §12 forbids.
 */
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

  // What it costs you — counted from the lifecycle, not estimated.
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

  // Which projects the customer is genuinely blocking, per the shared builder.
  const attention = buildMarketingPeerAttentionItems({
    domainInput,
    locale,
    primaryCtaLabel: v17Copy.reviewCta,
  });
  // Match on stable project identity, never on title — two campaigns sharing a
  // title must not both read as blocked on the customer.
  const awaitingProjectIds = new Set(
    attention.map((item) => item.projectId).filter(Boolean) as string[]
  );

  const buckets = new Map<WorkGroupId, WorkItem[]>();

  for (const project of domainInput.projects) {
    const status = deriveProjectStatus(
      project,
      domainInput.workUnits,
      domainInput.drafts,
      new Set()
    );

    const unit = primaryWorkUnitForProject(project.id, domainInput.workUnits);
    const channels = channelsForProject(project, domainInput.connections);
    const disconnectedChannel = channels.find((c) => !c.connected);

    const awaitingCustomer =
      status === "waiting_for_review" || awaitingProjectIds.has(project.id);

    const group = resolveGroup({
      status,
      awaitingCustomer,
      paused: Boolean(unit?.paused),
      disconnectedChannel,
      hasStarted: Boolean(unit),
    });

    const blockedBy =
      group === "blocked_on_you"
        ? locale === "nl"
          ? "jou"
          : "you"
        : group === "blocked_elsewhere"
          ? disconnectedChannel
            ? copy.notConnectedLabel(disconnectedChannel.label)
            : locale === "nl"
              ? "gepauzeerd"
              : "paused"
          : null;

    const item: WorkItem = {
      id: project.id,
      name: project.title,
      stageLabel: stageLabelFor(status, locale),
      // Mapped at the presentation boundary — the domain keeps its vocabulary.
      nextStep: presentNextStep(
        deriveProjectNextStep(status, domainInput.workUnits, project.id),
        locale
      ),
      blockedBy,
      expectedLabel: presentExpectedDate(unit?.estimatedCompletionAt, locale),
      href: officeHref(peerId, "work", { campaign: project.id }),
      channels,
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
