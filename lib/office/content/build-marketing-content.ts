import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";
import { buildMarketingPerformanceViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import { isWorkUnitFailed } from "@/lib/peer-experience/marketing/colleague/detect-safe-failure";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { WorkUnit } from "@/lib/peer-workflow/work-unit";
import { resolveProjectIdForDraft } from "../attribution";
import { officeHref } from "../links";
import { containsProhibitedTerm } from "../presentation";
import {
  CONTENT_PAGE_SIZE,
  CONTENT_PREVIEW_CHARS,
  CONTENT_STATES,
  type ContentCopy,
  type ContentFilterGroup,
  type ContentFilters,
  type ContentGroup,
  type ContentItem,
  type ContentState,
  type ContentViewModel,
} from "./types";

/**
 * Marketing adapter for Content (§4.6).
 *
 * Draft lifecycle, publication packages and campaign attribution all keep their
 * existing homes. This maps them onto the peer-agnostic shape and enforces the
 * two rules the spec is strictest about: real previews, and outcome data only
 * when a live source reports it.
 */

const CHANNEL_LABELS: Record<string, Record<string, string>> = {
  en: {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    email: "Email",
    blog: "Blog",
    meta: "Meta",
    google_ads: "Google Ads",
    newsletter: "Newsletter",
  },
  nl: {
    linkedin: "LinkedIn",
    instagram: "Instagram",
    email: "E-mail",
    blog: "Blog",
    meta: "Meta",
    google_ads: "Google Ads",
    newsletter: "Nieuwsbrief",
  },
};


function copyFor(locale: MarketingCampaignLocale): ContentCopy {
  if (locale === "nl") {
    return {
      title: "Content",
      subtitle: "Alles wat ik heb gemaakt, en wat ermee gebeurd is.",
      stateLabel: "Status",
      channelLabel: "Kanaal",
      campaignLabel: "Campagne",
      allLabel: "Alles",
      reviewCta: "Beoordelen",
      approveCta: "Goedkeuren",
      askForChangesCta: "Vraag om aanpassingen",
      openCta: "Openen",
      noOutcomeYet: "Nog geen cijfers — er rapporteert nog geen bron over dit kanaal.",
      reviewTitle: "Beoordelen",
      changesPlaceholder: "Wat zou je anders willen?",
      changesHint: "Ik pas het aan en leg het opnieuw voor.",
      cancelCta: "Terug",
      searchLabel: "Zoeken",
      searchPlaceholder: "Zoek op titel, tekst, kanaal of campagne",
      noResults: (query) => `Niets gevonden voor “${query}”.`,
      pageLabel: (page, total) => `Pagina ${page} van ${total}`,
      prevPage: "Vorige",
      nextPage: "Volgende",
      futureHeading: "Wat hier komt",
      futurePromise:
        "Alles wat ik schrijf komt hier terecht — van eerste concept tot wat er live staat, met de versie die jij hebt goedgekeurd ernaast.",
    };
  }
  return {
    title: "Content",
    subtitle: "Everything I've made, and what happened to it.",
    stateLabel: "Status",
    channelLabel: "Channel",
    campaignLabel: "Campaign",
    allLabel: "All",
    reviewCta: "Review",
    approveCta: "Approve",
    askForChangesCta: "Ask for changes",
    openCta: "Open",
    noOutcomeYet: "No numbers yet — nothing is reporting on this channel.",
    reviewTitle: "Review",
    changesPlaceholder: "What would you like different?",
    changesHint: "I'll adjust it and bring it back to you.",
    cancelCta: "Back",
    searchLabel: "Search",
    searchPlaceholder: "Search title, text, channel or campaign",
    noResults: (query) => `Nothing matches “${query}”.`,
    pageLabel: (page, total) => `Page ${page} of ${total}`,
    prevPage: "Previous",
    nextPage: "Next",
    futureHeading: "What appears here",
    futurePromise:
      "Everything I write lands here — from first draft to what is live, with the version you approved alongside it.",
  };
}

function stateTitle(state: ContentState, locale: MarketingCampaignLocale): string {
  const en: Record<ContentState, string> = {
    planned: "Planned",
    draft: "Draft",
    awaiting_review: "Needs your approval",
    approved: "Approved",
    scheduled: "Scheduled",
    published: "Published",
    failed: "Needs help",
  };
  const nl: Record<ContentState, string> = {
    planned: "Gepland",
    draft: "Concept",
    awaiting_review: "Wacht op jouw goedkeuring",
    approved: "Goedgekeurd",
    scheduled: "Ingepland",
    published: "Gepubliceerd",
    failed: "Hulp nodig",
  };
  return locale === "nl" ? nl[state] : en[state];
}

/**
 * Draft lifecycle → the customer-facing states.
 *
 * Approved and scheduled separate only when the owning work unit has actually
 * reached the `scheduled` lifecycle stage. Without that signal the item stays
 * `approved`, because claiming a schedule we cannot evidence would be an
 * invention.
 */
function stateForDraft(
  draft: MarketingContentDraft,
  failed: boolean,
  unit: WorkUnit | undefined
): ContentState {
  if (failed) return "failed";
  switch (draft.status) {
    case "published":
      return "published";
    case "ready_to_publish":
    case "approved":
      return unit?.status === "scheduled" ? "scheduled" : "approved";
    case "ready_for_review":
      return "awaiting_review";
    case "rejected":
    case "draft":
    default:
      return "draft";
  }
}

/** Deterministic order: newest first, id as a stable tie-break. */
function compareItems(a: ContentItem, b: ContentItem): number {
  const at = a.sortAt ?? "";
  const bt = b.sortAt ?? "";
  if (at !== bt) return at > bt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Free-text search across the fields the customer would actually recall. */
function matchesQuery(item: ContentItem, query: string): boolean {
  const haystack = [
    item.title,
    item.searchBody ?? "",
    item.channelLabel ?? "",
    item.campaignTitle ?? "",
    item.statusLabel,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function channelLabelFor(
  channel: string | null | undefined,
  locale: MarketingCampaignLocale
): string | null {
  if (!channel) return null;
  const table = CHANNEL_LABELS[locale === "nl" ? "nl" : "en"]!;
  return (
    table[channel] ??
    channel.charAt(0).toUpperCase() + channel.slice(1).replace(/[_-]/g, " ")
  );
}

/**
 * A real excerpt of the actual content. Returns null rather than inventing a
 * summary — §4.6 wants the thing itself, not a description of it.
 */
function previewOf(draft: MarketingContentDraft): string | null {
  const body = draft.body?.trim();
  if (!body) return null;
  const collapsed = body.replace(/\s+/g, " ");
  return collapsed.length > CONTENT_PREVIEW_CHARS
    ? `${collapsed.slice(0, CONTENT_PREVIEW_CHARS).trimEnd()}…`
    : collapsed;
}

function unitForDraft(
  draftId: string,
  workUnits: readonly WorkUnit[]
): WorkUnit | undefined {
  return workUnits.find((unit) => unit.draftId === draftId);
}

export function buildMarketingContentViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  searchParams?: URLSearchParams;
}): ContentViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const copy = copyFor(locale);
  const nl = locale === "nl";
  const { domainInput } = input;
  const peerId = domainInput.peerId;

  const rawPage = Number.parseInt(input.searchParams?.get("page") ?? "1", 10);
  const stateParam = input.searchParams?.get("state");
  const filters: ContentFilters = {
    state:
      stateParam === "all"
        ? null
        : "published",
    channel: input.searchParams?.get("channel") || null,
    campaignId: input.searchParams?.get("campaign") || null,
    query: input.searchParams?.get("q")?.trim() || null,
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };

  const projectTitleById = new Map(
    domainInput.projects.map((project) => [project.id, project.title])
  );

  // Only live reporting sources may contribute outcome numbers.
  const marketingPerformance = buildMarketingPerformanceViewModel(domainInput);
  const hasLiveReporting = marketingPerformance.executiveMetrics.some(
    (metric) => metric.status === "live"
  );

  const items: ContentItem[] = [];

  // ---- Drafts: everything that exists as a piece of content ---------------
  for (const draft of domainInput.drafts) {
    const unit = unitForDraft(draft.id, domainInput.workUnits);
    const failed = unit ? isWorkUnitFailed(unit) : false;
    const state = stateForDraft(draft, failed, unit);
    if (filters.state === "published" && state !== "published") continue;
    if (filters.state === null && state === "draft") continue;

    const campaignId = resolveProjectIdForDraft(draft, domainInput.workUnits);
    const channelLabel = channelLabelFor(draft.channel ?? draft.contentType, locale);

    items.push({
      id: draft.id,
      state,
      statusLabel: stateTitle(state, locale),
      title: draft.title,
      preview: previewOf(draft),
      channelId: draft.channel ?? null,
      channelLabel,
      campaignId,
      campaignTitle: campaignId ? (projectTitleById.get(campaignId) ?? null) : null,
      dateLabel: draft.generatedAt ? formatRelativeTime(draft.generatedAt, locale) : null,
      // Nothing reports on this content, so there is nothing to show.
      performance: null,
      performanceAbsence: state === "published" && !hasLiveReporting ? copy.noOutcomeYet : null,
      href: officeHref(peerId, "content", { item: draft.id }),
      canReview: false,
      failure: failed
        ? {
            voice: nl
              ? `Ik kon ${channelLabel ? `de ${channelLabel}-post` : "dit"} niet publiceren — dat lag aan mijn kant, niet aan die van jou.`
              : `I couldn't publish ${channelLabel ? `the ${channelLabel} post` : "this"} — that was my side, not yours.`,
            preserved: nl
              ? "Er is niets verloren: de tekst staat er nog precies zo."
              : "Nothing is lost — the copy is exactly as it was.",
            retryLabel: nl ? "Probeer opnieuw" : "Try again",
          }
        : null,
      sortAt: draft.generatedAt ?? null,
      searchBody: draft.body ?? null,
    });
  }

  // ---- Filtering, search, deterministic order, pagination ----------------
  items.sort(compareItems);

  const filtered = items.filter((item) => {
    if (filters.state === "published" && item.state !== "published") return false;
    if (filters.channel && item.channelId !== filters.channel) return false;
    if (filters.campaignId && item.campaignId !== filters.campaignId) return false;
    if (filters.query && !matchesQuery(item, filters.query)) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / CONTENT_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const pageItems = filtered.slice(
    (page - 1) * CONTENT_PAGE_SIZE,
    page * CONTENT_PAGE_SIZE
  );

  const groups: ContentGroup[] = (filters.state === null
    ? (["awaiting_review", "approved", "scheduled", "published"] as ContentState[])
    : (["published"] as ContentState[])
  )
    .map((state) => ({
      state,
      title: stateTitle(state, locale),
      items: pageItems.filter((item) => item.state === state),
    }))
    .filter((group) => group.items.length > 0);

  const href = (patch: Partial<ContentFilters>) => {
    const next = { ...filters, page: 1, ...patch };
    const params = new URLSearchParams();
    if (next.state === null) params.set("state", "all");
    else if (next.state === "published") params.delete("state");
    if (next.channel) params.set("channel", next.channel);
    else params.delete("channel");
    if (next.campaignId) params.set("campaign", next.campaignId);
    if (next.query) params.set("q", next.query);
    if (next.page > 1) params.set("page", String(next.page));
    const query = params.toString();
    return `/office/${peerId}/content${query ? `?${query}` : ""}`;
  };

  const visionChannels = [
    "google_ads",
    "linkedin",
    "newsletter",
    "blog",
    "instagram",
  ] as const;

  const filterGroups: ContentFilterGroup[] = [
    {
      id: "state",
      label: copy.stateLabel,
      options: [
        {
          id: "published",
          label: nl ? "Gepubliceerd" : "Published",
          active: filters.state === "published" && !filters.channel,
          href: href({ state: "published", channel: null }),
        },
        {
          id: "all",
          label: copy.allLabel,
          active: filters.state === null && !filters.channel,
          href: href({ state: null, channel: null }),
        },
        ...visionChannels.map((channel) => ({
          id: channel,
          label: channelLabelFor(channel, locale) ?? channel,
          active: filters.channel === channel,
          href: href({ state: "published", channel }),
        })),
      ],
    },
  ];

  // ---- Presence: her read on the corpus, grounded in what exists ---------
  const publishedItems = items.filter((item) => item.state === "published");
  const awaiting = items.filter((item) => item.state === "awaiting_review");
  const failedItems = items.filter((item) => item.state === "failed");

  let presence: ContentViewModel["presence"];

  if (failedItems.length > 0) {
    const first = failedItems[0]!;
    presence = {
      rung: "fault",
      text: nl
        ? `${first.title} is niet gepubliceerd. Er is niets verloren — ik kan het opnieuw proberen wanneer je wilt.`
        : `${first.title} didn't go out. Nothing is lost — I can try again whenever you want.`,
      working: false,
    };
  } else if (items.length === 0) {
    presence = {
      rung: "orientation",
      text: nl
        ? "Ik heb nog niets gemaakt. Zodra je me werk geeft verschijnt het hier."
        : "I haven't made anything yet. Once you give me work it'll show up here.",
      working: false,
    };
  } else if (publishedItems.length === 0) {
    presence = {
      rung: "observation",
      text: nl
        ? awaiting.length > 0
          ? `Er is nog niets live. ${awaiting.length === 1 ? "Eén stuk wacht" : `${awaiting.length} stukken wachten`} op jouw goedkeuring.`
          : "Er is nog niets live — ik ben nog aan het schrijven."
        : awaiting.length > 0
          ? `Nothing is live yet. ${awaiting.length === 1 ? "One piece is" : `${awaiting.length} pieces are`} waiting on your approval.`
          : "Nothing is live yet — I'm still writing.",
      working: false,
    };
  } else {
    // Grounded in this customer's actual corpus: the channel they publish to
    // most, named, with real counts. Never a generic summary.
    const byChannel = new Map<string, number>();
    for (const item of publishedItems) {
      const key = item.channelLabel ?? "other";
      byChannel.set(key, (byChannel.get(key) ?? 0) + 1);
    }
    const top = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0];

    presence =
      top && publishedItems.length >= 3 && top[1] / publishedItems.length >= 0.5
        ? {
            rung: "interpretation",
            text: nl
              ? `${publishedItems.length} stukken live, waarvan ${top[1]} op ${top[0]}. Daar ligt op dit moment je zwaartepunt.`
              : `${publishedItems.length} pieces live, ${top[1]} of them on ${top[0]}. That's where your weight sits right now.`,
            working: false,
          }
        : {
            rung: "observation",
            text: nl
              ? `${publishedItems.length} ${publishedItems.length === 1 ? "stuk" : "stukken"} live. Ik kan nog niet zien hoe ze presteren.`
              : `${publishedItems.length} ${publishedItems.length === 1 ? "piece" : "pieces"} live. I can't see how they're performing yet.`,
            working: false,
          };
  }

  const empty =
    items.length === 0
      ? {
          voice: nl
            ? "Er is nog niets gepubliceerd."
            : "Nothing published yet.",
          next: nl
            ? "Zodra je me werk geeft, verschijnt het hier."
            : "Once you give me work, it'll appear here.",
          href: officeHref(peerId, "work"),
        }
      : null;

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence,
    filters,
    filterGroups,
    groups,
    totalCount: items.length,
    pagination: {
      page,
      pageCount,
      total: filtered.length,
      prevHref: page > 1 ? href({ page: page - 1 }) : null,
      nextHref: page < pageCount ? href({ page: page + 1 }) : null,
    },
    noSearchResults:
      filters.query && filtered.length === 0 ? copy.noResults(filters.query) : null,
    empty,
    copy,
  };
}

/** Exposed for tests: no customer-facing string may carry machine vocabulary. */
export function contentStringsAreClean(model: ContentViewModel): boolean {
  const strings = [
    model.presence.text,
    ...model.groups.flatMap((group) => [
      group.title,
      ...group.items.flatMap((item) =>
        [item.statusLabel, item.failure?.voice, item.failure?.preserved].filter(
          Boolean
        ) as string[]
      ),
    ]),
  ];
  return strings.every((value) => !containsProhibitedTerm(value));
}
