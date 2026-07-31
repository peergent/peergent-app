import { resolveMarketingCampaignLocale, type MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { buildMarketingPerformanceViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-performance-view-model";
import { deriveProjectStatus } from "@/lib/peer-experience/marketing/projects/project-engine";
import { resolveProjectIdForDraft } from "../attribution";
import { officeHref } from "../links";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import { groundPerformancePresence, keepGroundedSignals } from "./grounding";
import {
  DEFAULT_PERFORMANCE_FILTERS,
  PERFORMANCE_PERIODS,
  PERIOD_DAYS,
  type PerformanceCopy,
  type PerformanceCut,
  type PerformanceFilterGroup,
  type PerformanceFilters,
  type PerformanceGap,
  type PerformanceMetric,
  type PerformancePeriod,
  type PerformanceSignal,
  type PerformanceTrend,
  type PerformanceViewModel,
} from "./types";

/**
 * Marketing adapter for Performance (§4.5).
 *
 * Everything here is counted from data the product actually holds. Channel
 * metrics are read from the existing marketing performance view model and only
 * surface when that model reports them as live — a `setup_required` metric is
 * a gap, never a zero.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function copyFor(locale: MarketingCampaignLocale): PerformanceCopy {
  if (locale === "nl") {
    return {
      title: "Prestaties",
      subtitle: "Kijk zelf hoe je marketing het doet.",
      periodLabel: "Periode",
      campaignLabel: "Campagne",
      channelLabel: "Kanaal",
      contentTypeLabel: "Soort",
      allLabel: "Alles",
      gapsHeading: "Wat ik nog niet kan zien",
      trendHeading: "Verloop",
      methodologyPrefix: "Geteld op basis van",
      observedHeading: "Gemeten",
      connectLabel: "Koppelen",
      futureHeading: "Wat ik straks kan laten zien",
      notReportedYet: "Nog geen bron die dit rapporteert.",
      trendFuture: "Het verloop over tijd, zodra er genoeg gepubliceerd is om een lijn te trekken.",
      willShow: (what) => `Hier laat ik je zien ${what}.`,
    };
  }
  return {
    title: "Performance",
    subtitle: "See for yourself how your marketing is doing.",
    periodLabel: "Period",
    campaignLabel: "Campaign",
    channelLabel: "Channel",
    contentTypeLabel: "Type",
    allLabel: "All",
    gapsHeading: "What I can't see yet",
    trendHeading: "Over time",
    methodologyPrefix: "Counted from",
    observedHeading: "Measured",
    connectLabel: "Connect",
    futureHeading: "What I'll be able to show",
    notReportedYet: "No source reports this yet.",
    trendFuture: "How this moves over time, once enough has gone live to draw a line.",
    willShow: (what) => `This is where I show you ${what}.`,
  };
}

function periodLabel(period: PerformancePeriod, locale: MarketingCampaignLocale): string {
  const en: Record<PerformancePeriod, string> = {
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
    all: "All time",
  };
  const nl: Record<PerformancePeriod, string> = {
    "7d": "7 dagen",
    "30d": "30 dagen",
    "90d": "90 dagen",
    all: "Alles",
  };
  return locale === "nl" ? nl[period] : en[period];
}

export function parsePerformanceFilters(
  searchParams?: URLSearchParams
): PerformanceFilters {
  const rawPeriod = searchParams?.get("period");
  const period = PERFORMANCE_PERIODS.includes(rawPeriod as PerformancePeriod)
    ? (rawPeriod as PerformancePeriod)
    : DEFAULT_PERFORMANCE_FILTERS.period;

  return {
    period,
    campaignId: searchParams?.get("campaign") || null,
    channel: searchParams?.get("channel") || null,
    contentType: searchParams?.get("type") || null,
  };
}

function filterHref(
  peerId: string,
  filters: PerformanceFilters,
  patch: Partial<PerformanceFilters>
): string {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.period !== DEFAULT_PERFORMANCE_FILTERS.period) params.set("period", next.period);
  if (next.campaignId) params.set("campaign", next.campaignId);
  if (next.channel) params.set("channel", next.channel);
  if (next.contentType) params.set("type", next.contentType);
  const query = params.toString();
  return `/office/${peerId}/performance${query ? `?${query}` : ""}`;
}

function withinWindow(iso: string | undefined, from: number, to: number): boolean {
  if (!iso) return false;
  const at = new Date(iso).getTime();
  return Number.isFinite(at) && at >= from && at < to;
}

function publishedDrafts(domainInput: MarketingPeerDomainInput): MarketingContentDraft[] {
  return domainInput.drafts.filter((d) => d.status === "published" && d.generatedAt);
}

/** Ratio change between two counts, guarding the zero-baseline case. */
function magnitudeOf(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return Math.abs(current - previous) / previous;
}

function directionOf(current: number, previous: number): "up" | "down" | "flat" {
  if (current === previous) return "flat";
  return current > previous ? "up" : "down";
}

export function buildMarketingPerformanceViewModelForOffice(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  searchParams?: URLSearchParams;
  now?: Date;
}): PerformanceViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const copy = copyFor(locale);
  const nl = locale === "nl";
  const { domainInput } = input;
  const peerId = domainInput.peerId;
  const now = input.now ?? new Date();
  const filters = parsePerformanceFilters(input.searchParams);

  const days = PERIOD_DAYS[filters.period];
  const periodStart = days == null ? 0 : now.getTime() - days * DAY_MS;
  const previousStart = days == null ? 0 : periodStart - days * DAY_MS;

  // ---- Observed facts, counted from what the product holds ----------------
  const allPublished = publishedDrafts(domainInput);

  const scoped = allPublished.filter((draft) => {
    if (filters.channel && draft.channel !== filters.channel) return false;
    if (filters.contentType && draft.contentType !== filters.contentType) return false;
    return true;
  });

  const publishedThisPeriod = scoped.filter((d) =>
    withinWindow(d.generatedAt, periodStart, now.getTime())
  );
  const publishedPrevious = scoped.filter((d) =>
    withinWindow(d.generatedAt, previousStart, periodStart)
  );

  const completedThisPeriod = domainInput.projects.filter((project) => {
    const status = deriveProjectStatus(
      project,
      domainInput.workUnits,
      domainInput.drafts,
      new Set()
    );
    const finished = ["completed", "archived", "monitoring_results"].includes(status);
    return finished && withinWindow(project.updatedAt, periodStart, now.getTime());
  });

  const earliest = scoped
    .map((d) => new Date(d.generatedAt).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b)[0];

  const daysOfData =
    earliest == null
      ? 0
      : Math.max(
          0,
          Math.floor(
            (now.getTime() - Math.max(earliest, days == null ? earliest : periodStart)) /
              DAY_MS
          )
        );

  // ---- Channel metrics, only when genuinely live --------------------------
  const marketingPerformance = buildMarketingPerformanceViewModel(domainInput);

  // Only `live` counts. An `estimated` metric is a derived guess — time-saved
  // is literally completed-work × 45 minutes — and §12 forbids surfacing
  // invented numbers that feel good and are indefensible. Letting those through
  // would also register a connected source that does not exist, which would let
  // the grounding gate reach an interpretation with nothing actually reporting.
  const liveChannelMetrics = marketingPerformance.executiveMetrics.filter(
    (metric) =>
      metric.status === "live" &&
      metric.value != null &&
      metric.value !== "—" &&
      String(metric.value).trim() !== ""
  );

  const connectedSources = liveChannelMetrics.map((m) => m.label);

  // A source that was connected and has stopped reporting is an existing
  // health signal, not a missing integration. It belongs on the fault rung so
  // she owns it rather than silently showing stale or absent numbers.
  const failingSources = domainInput.connections
    .filter((connection) => connection.status === "needs_reconnect")
    .map((connection) => connection.label);

  /**
   * Channel metric labels, translated at the presentation boundary.
   *
   * `EXECUTIVE_METRIC_DEFS` is shared vocabulary used by surfaces outside the
   * Office, so it stays English there and is mapped here by stable id.
   */
  const CHANNEL_METRIC_LABELS: Record<string, string> = nl
    ? {
        reach: "Bereik",
        leads: "Leads",
        revenue: "Beïnvloede omzet",
        roi: "Rendement",
        "time-saved": "Bespaarde tijd",
        "tasks-automated": "Geautomatiseerde taken",
      }
    : {};

  // ---- Honest gaps: what she cannot see, and what it would unlock ---------
  const gaps: PerformanceGap[] = marketingPerformance.executiveMetrics
    .filter((metric) => metric.status === "setup_required")
    .slice(0, 3)
    .map((metric) => ({
      id: metric.id,
      missing: CHANNEL_METRIC_LABELS[metric.id] ?? metric.label,
      unlocks:
        metric.id === "reach"
          ? nl
            ? "hoeveel mensen je campagnes zagen"
            : "how many people your campaigns reached"
          : metric.id === "leads"
            ? nl
              ? "welke leads eruit voortkwamen"
              : "which leads came out of them"
            : nl
              ? "wat je campagnes opleverden"
              : "what your campaigns returned",
      ctaLabel: copy.connectLabel,
      ctaHref: officeHref(peerId, "agreement"),
    }));

  // ---- Metrics (§4.5: four maximum) --------------------------------------
  const countedMetrics: PerformanceMetric[] = [
    {
      id: "published",
      label: nl ? "Gepubliceerd" : "Published",
      value: String(publishedThisPeriod.length),
      comparison:
        days == null || publishedPrevious.length === 0
          ? null
          : {
              direction: directionOf(publishedThisPeriod.length, publishedPrevious.length),
              label: nl
                ? `t.o.v. ${publishedPrevious.length} vorige periode`
                : `vs ${publishedPrevious.length} previous period`,
            },
      methodology: nl
        ? "Geteld op basis van wat er daadwerkelijk live ging."
        : "Counted from what actually went live.",
      source: "counted",
    },
    {
      id: "campaigns-completed",
      label: nl ? "Campagnes afgerond" : "Campaigns completed",
      value: String(completedThisPeriod.length),
      comparison: null,
      methodology: nl
        ? "Geteld op basis van campagnes die in deze periode zijn afgerond."
        : "Counted from campaigns finished in this period.",
      source: "counted",
    },
  ];

  const channelMetrics: PerformanceMetric[] = liveChannelMetrics
    .slice(0, 2)
    .map((metric) => ({
      id: metric.id,
      label: CHANNEL_METRIC_LABELS[metric.id] ?? metric.label,
      value: `${metric.value}${metric.unit ?? ""}`,
      comparison: metric.comparison
        ? {
            direction:
              metric.comparison.direction === "neutral"
                ? ("flat" as const)
                : metric.comparison.direction,
            label: `${metric.comparison.value > 0 ? "+" : ""}${metric.comparison.value}% ${metric.comparison.periodLabel}`,
          }
        : null,
      methodology: (() => {
        // The metric's own label is not its provenance — "Reported by Reach"
        // tells the customer nothing about where the number came from.
        const raw = metric.sourceLabel?.trim();
        // Some sources only identify themselves generically; say so in words
        // that read as a sentence rather than as a field value.
        const reporter =
          !raw || raw.toLowerCase() === "connected integration" ? null : raw;
        if (!reporter) {
          return nl
            ? "Gerapporteerd door een gekoppelde bron."
            : "Reported by a connected source.";
        }
        return nl ? `Gerapporteerd door ${reporter}.` : `Reported by ${reporter}.`;
      })(),
      source: "channel",
    }));

  const metrics: PerformanceMetric[] = [...countedMetrics, ...channelMetrics].slice(0, 4);

  // ---- Trend: only drawn when there is something real to draw ------------
  //
  // Plotted as volume per bucket rather than a running total. A cumulative
  // count can only ever slope upward, which looks like a chart and says
  // nothing; the cadence is the part worth seeing.
  const trendBucketDays = days == null || days > 30 ? 7 : days > 7 ? 7 : 1;

  function bucketStart(at: string): string {
    const date = new Date(at);
    if (Number.isNaN(date.getTime())) return at;
    const anchor = now.getTime();
    const elapsed = Math.floor((anchor - date.getTime()) / (86400000 * trendBucketDays));
    return new Date(anchor - elapsed * 86400000 * trendBucketDays).toISOString();
  }

  const trend: PerformanceTrend = (() => {
    if (publishedThisPeriod.length < 2) return null;

    const buckets = new Map<string, number>();
    for (const draft of publishedThisPeriod) {
      const key = bucketStart(draft.generatedAt);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    if (buckets.size < 2) return null;

    return {
      label: nl ? "Publicatievolume" : "Publishing volume",
      points: [...buckets.entries()]
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([at, value]) => ({ at, value })),
      methodology: nl
        ? `Aantal publicaties per ${trendBucketDays === 1 ? "dag" : "week"} — dit zegt nog niets over hoe het presteerde.`
        : `Publications per ${trendBucketDays === 1 ? "day" : "week"}. This is output, not results — it says nothing yet about how any of it performed.`,
    };
  })();

  /** Channel keys are internal; never let one reach the customer. */
  function channelLabel(key: string): string {
    const known: Record<string, string> = {
      linkedin: "LinkedIn",
      instagram: "Instagram",
      newsletter: nl ? "Nieuwsbrief" : "Newsletter",
      email: nl ? "E-mail" : "Email",
      blog: "Blog",
      google_ads: "Google Ads",
      meta_ads: "Meta Ads",
    };
    return known[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/[_-]/g, " ");
  }

  /** The same channel mid-sentence, where a bare noun would read wrong. */
  function channelInSentence(key: string): string {
    const article: Record<string, string> = {
      newsletter: nl ? "de nieuwsbrief" : "the newsletter",
      blog: nl ? "de blog" : "the blog",
      email: nl ? "e-mail" : "email",
    };
    return article[key] ?? channelLabel(key);
  }

  // ---- Cuts ---------------------------------------------------------------
  const byChannel = new Map<string, number>();
  for (const draft of publishedThisPeriod) {
    const key = draft.channel ?? draft.contentType ?? "other";
    byChannel.set(key, (byChannel.get(key) ?? 0) + 1);
  }

  const cuts: PerformanceCut[] = [];

  if (byChannel.size > 0) {
    cuts.push({
      id: "by-channel",
      title: nl ? "Per kanaal" : "By channel",
      valueHeader: nl ? "Gepubliceerd" : "Published",
      methodology: nl
        ? "Geteld op basis van wat er live ging per kanaal."
        : "Counted from what went live, per channel.",
      rows: [...byChannel.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([channel, count]) => ({
          id: channel,
          label: channelLabel(channel),
          value: String(count),
          numericValue: count,
          share: `${Math.round((count / publishedThisPeriod.length) * 100)}%`,
          href: filterHref(peerId, filters, { channel }),
        })),
    });
  }

  const byCampaign = domainInput.projects
    .map((project) => {
      const count = publishedThisPeriod.filter(
        (draft) =>
          resolveProjectIdForDraft(draft, domainInput.workUnits) === project.id
      ).length;
      return { project, count };
    })
    .filter((entry) => entry.count > 0);

  if (byCampaign.length > 0) {
    cuts.push({
      id: "by-campaign",
      title: nl ? "Per campagne" : "By campaign",
      valueHeader: nl ? "Gepubliceerd" : "Published",
      methodology: nl
        ? "Geteld op basis van publicaties gekoppeld aan elke campagne."
        : "Counted from publications linked to each campaign.",
      rows: byCampaign
        .sort((a, b) => b.count - a.count)
        .map(({ project, count }) => ({
          id: project.id,
          label: project.title,
          value: String(count),
          numericValue: count,
          share: null,
          href: officeHref(peerId, "content", { campaign: project.id }),
        })),
    });
  }

  // ---- Signals: constructed only from measured values --------------------
  const rawSignals: PerformanceSignal[] = [];

  if (days != null && publishedPrevious.length > 0) {
    const magnitude = magnitudeOf(publishedThisPeriod.length, publishedPrevious.length);
    const direction = directionOf(publishedThisPeriod.length, publishedPrevious.length);
    if (direction !== "flat") {
      rawSignals.push({
        id: "publishing-rate",
        fact: nl
          ? `${publishedThisPeriod.length} publicaties tegenover ${publishedPrevious.length} in de vorige periode.`
          : `${publishedThisPeriod.length} published against ${publishedPrevious.length} in the previous period.`,
        interpretation: nl
          ? direction === "up"
            ? `Je output ligt hoger dan de vorige periode (${publishedThisPeriod.length} tegenover ${publishedPrevious.length}).`
            : `Je output ligt lager dan de vorige periode (${publishedThisPeriod.length} tegenover ${publishedPrevious.length}).`
          : direction === "up"
            ? `Your output is up on the previous period — ${publishedThisPeriod.length} against ${publishedPrevious.length}.`
            : `Your output is down on the previous period — ${publishedThisPeriod.length} against ${publishedPrevious.length}.`,
        recommendation:
          direction === "down"
            ? nl
              ? "Er staat werk klaar dat op jouw akkoord wacht."
              : "There's work waiting on your go-ahead."
            : null,
        magnitude,
        benchmark: null,
      });
    }
  }

  const topChannel = [...byChannel.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topChannel && publishedThisPeriod.length >= 3) {
    const [channelKey, count] = topChannel;
    const channel = channelInSentence(channelKey);
    const share = count / publishedThisPeriod.length;
    if (share >= 0.5) {
      rawSignals.push({
        id: "channel-concentration",
        fact: nl
          ? `${count} van de ${publishedThisPeriod.length} publicaties gingen naar ${channel}.`
          : `${count} of ${publishedThisPeriod.length} publications went to ${channel}.`,
        interpretation: nl
          ? `Het meeste werk ging deze periode naar ${channel}.`
          : `Most of the work went to ${channel} this period.`,
        recommendation: null,
        magnitude: share,
        benchmark: null,
      });
    }
  }

  const signals = keepGroundedSignals(rawSignals);

  // ---- The grounded presence line ----------------------------------------
  const viewLabel = [
    filters.channel ?? (nl ? "je marketing" : "your marketing"),
    periodLabel(filters.period, locale).toLowerCase(),
  ].join(", ");

  const presence = groundPerformancePresence(
    {
      publishedCount: publishedThisPeriod.length,
      daysOfData,
      connectedSources,
      gaps,
      failingSources,
      signals,
      viewLabel,
      nextMilestone: null,
    },
    locale
  );

  // ---- Filters ------------------------------------------------------------
  const filterGroups: PerformanceFilterGroup[] = [
    {
      id: "period",
      label: copy.periodLabel,
      options: PERFORMANCE_PERIODS.map((period) => ({
        id: period,
        label: periodLabel(period, locale),
        active: filters.period === period,
        href: filterHref(peerId, filters, { period }),
      })),
    },
  ];

  if (byChannel.size > 0) {
    filterGroups.push({
      id: "channel",
      label: copy.channelLabel,
      options: [
        {
          id: "all",
          label: copy.allLabel,
          active: filters.channel === null,
          href: filterHref(peerId, filters, { channel: null }),
        },
        ...[...byChannel.keys()].map((channel) => ({
          id: channel,
          label: channelLabel(channel),
          active: filters.channel === channel,
          href: filterHref(peerId, filters, { channel }),
        })),
      ],
    });
  }

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence,
    filters,
    filterGroups,
    metrics,
    trend,
    cuts,
    gaps,
    signals,
    copy,
  };
}
