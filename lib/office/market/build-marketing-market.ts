import {
  resolveMarketingCampaignLocale,
  type MarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";
import { formatRelativeTime } from "@/lib/peer-experience/marketing/emma-narrative";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingCompetitorSummary } from "@/lib/marketing-intelligence/types/understanding";
import { officeHref } from "../links";
import {
  MARKET_STALE_AFTER_DAYS,
  MIN_COMPETITORS_FOR_POSITION,
  type MarketCompetitor,
  type MarketCopy,
  type MarketFreshness,
  type MarketInterpretation,
  type MarketObservation,
  type MarketPosition,
  type MarketViewModel,
} from "./types";

/**
 * Marketing adapter for Market (§4.7).
 *
 * Everything here comes from the customer's own recorded knowledge — the
 * competitor records in the business brain, surfaced through
 * `understanding.competitors`. There is no scraping, no pricing feed and no
 * market-share source, so this page never claims any.
 *
 * The one hard rule: an inference is never presented as an observation.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function copyFor(locale: MarketingCampaignLocale): MarketCopy {
  if (locale === "nl") {
    return {
      title: "Markt",
      subtitle: "Wat ik weet over de partijen om je heen.",
      competitorsHeading: "Concurrenten",
      observedHeading: "Wat ik heb vastgelegd",
      inferredHeading: "Wat ik eruit opmaak",
      interpretationHeading: "Mijn lezing",
      positionHeading: "Hoe jullie zich positioneren",
      strengthsLabel: "Sterk",
      weaknessesLabel: "Zwak",
      differentiatorsLabel: "Onderscheidend",
      youLabel: "Jullie",
      sourceLabel: (source) => `Bron: ${source}`,
      evidenceObserved: "Vastgelegd",
      evidenceLikely: "Afgeleid",
      thinRecord: "Alleen een naam vastgelegd — ik weet hier nog niets over.",
      recommendationHeading: "Wat ik zou doen",
      futureHeading: "Wat hier komt",
      futurePromise:
        "Wat je concurrenten beweren, waar ze sterk zijn en waar niet — en wat dat betekent voor het verhaal dat jij vertelt.",
    };
  }
  return {
    title: "Market",
    subtitle: "What I know about the players around you.",
    competitorsHeading: "Competitors",
    observedHeading: "What I have on record",
    inferredHeading: "What I read into it",
    interpretationHeading: "My take",
    positionHeading: "How you each position",
    strengthsLabel: "Strong",
    weaknessesLabel: "Weak",
    differentiatorsLabel: "Differentiator",
    youLabel: "You",
    sourceLabel: (source) => `Source: ${source}`,
    evidenceObserved: "On record",
    evidenceLikely: "Inferred",
    thinRecord: "Only a name on record — I don't know anything about them yet.",
    recommendationHeading: "What I'd suggest",
    futureHeading: "What appears here",
    futurePromise:
      "What your competitors claim, where they are strong and where they are not — and what that means for the story you tell.",
  };
}

const SOURCE_LABELS: Record<string, Record<string, string>> = {
  en: {
    knowledge: "your business knowledge",
    website: "your website",
    analytics: "analytics",
    crm: "CRM",
    "operations-scan": "operations scan",
  },
  nl: {
    knowledge: "jouw bedrijfskennis",
    website: "jouw website",
    analytics: "statistieken",
    crm: "CRM",
    "operations-scan": "scan van de bedrijfsvoering",
  },
};

function sourceLabelFor(source: string, locale: string): string {
  const table = SOURCE_LABELS[locale === "nl" ? "nl" : "en"]!;
  return table[source] ?? source;
}

function toCompetitor(summary: MarketingCompetitorSummary): MarketCompetitor {
  const hasDetail =
    summary.strengths.length > 0 ||
    summary.weaknesses.length > 0 ||
    summary.differentiators.length > 0;

  return {
    id: summary.id,
    name: summary.name,
    strengths: summary.strengths,
    weaknesses: summary.weaknesses,
    differentiators: summary.differentiators,
    isThin: !hasDetail,
  };
}

export function buildMarketingMarketViewModel(input: {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  now?: Date;
}): MarketViewModel {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const copy = copyFor(locale);
  const nl = locale === "nl";
  const { domainInput } = input;
  const peerId = domainInput.peerId;
  const now = input.now ?? new Date();

  const understanding = domainInput.understanding;
  const competitors = (understanding?.competitors ?? []).map(toCompetitor);
  const detailed = competitors.filter((c) => !c.isThin);

  // ---- Freshness: the knowledge this page is built from -------------------
  const assembledAt = understanding?.assembledAt ?? null;
  const assembledMs = assembledAt ? new Date(assembledAt).getTime() : Number.NaN;
  const ageDays = Number.isFinite(assembledMs)
    ? Math.floor((now.getTime() - assembledMs) / DAY_MS)
    : null;
  const isStale = ageDays != null && ageDays > MARKET_STALE_AFTER_DAYS;

  // `understanding.gaps` is an existing, reachable signal that names competitor
  // knowledge specifically as a known gap. The website-intelligence
  // ConfidenceSnapshot is richer but is not reachable from the domain input, so
  // it is deliberately not wired rather than approximated.
  const competitorKnowledgeIsAGap = (understanding?.gaps ?? []).includes("competitors");

  const freshness: MarketFreshness = {
    assembledAt,
    label: assembledAt && Number.isFinite(assembledMs)
      ? formatRelativeTime(assembledAt, locale)
      : null,
    isStale,
    staleNotice: isStale
      ? nl
        ? `Deze kennis is ${ageDays} dagen oud. Ik zou hem opfrissen voordat je erop stuurt.`
        : `This knowledge is ${ageDays} days old. I'd refresh it before steering on it.`
      : null,
    confidence: null,
    knownGap: competitorKnowledgeIsAGap
      ? nl
        ? "Concurrentkennis staat aangemerkt als incompleet — wat hier staat is dus niet het hele beeld."
        : "Competitor knowledge is flagged as incomplete, so what's here isn't the whole picture."
      : null,
  };

  // ---- Observed facts: what is literally on record ------------------------
  const observedFacts: MarketObservation[] = [];

  for (const competitor of detailed) {
    for (const [index, differentiator] of competitor.differentiators.entries()) {
      observedFacts.push({
        id: `obs:${competitor.id}:diff:${index}`,
        statement: nl
          ? `${competitor.name} onderscheidt zich op: ${differentiator}.`
          : `${competitor.name} differentiates on: ${differentiator}.`,
        evidence: "observed",
        source: "knowledge",
        sourceLabel: sourceLabelFor("knowledge", locale),
        competitorId: competitor.id,
      });
    }
    for (const [index, strength] of competitor.strengths.entries()) {
      observedFacts.push({
        id: `obs:${competitor.id}:str:${index}`,
        statement: nl
          ? `${competitor.name} is sterk in: ${strength}.`
          : `${competitor.name} is strong on: ${strength}.`,
        evidence: "observed",
        source: "knowledge",
        sourceLabel: sourceLabelFor("knowledge", locale),
        competitorId: competitor.id,
      });
    }
  }

  // ---- Inferences: derived, and labelled as derived -----------------------
  const inferences: MarketObservation[] = [];

  // A weakness shared across competitors is an opening — but it is read from
  // the customer's own notes, so it is an inference, never an observation.
  const weaknessCounts = new Map<string, string[]>();
  for (const competitor of detailed) {
    for (const weakness of competitor.weaknesses) {
      const key = weakness.trim().toLowerCase();
      if (!key) continue;
      const list = weaknessCounts.get(key) ?? [];
      list.push(competitor.name);
      weaknessCounts.set(key, list);
    }
  }

  for (const [key, names] of weaknessCounts) {
    if (names.length < 2) continue;
    inferences.push({
      id: `inf:shared-weakness:${key}`,
      statement: nl
        ? `${names.join(" en ")} zijn allebei zwak op ${key}. Dat lijkt een opening.`
        : `${names.join(" and ")} are both weak on ${key}. That looks like an opening.`,
      evidence: "likely",
      source: "knowledge",
      sourceLabel: sourceLabelFor("knowledge", locale),
      competitorId: null,
    });
  }

  // ---- Interpretation: explicitly built on named observations -------------
  let interpretation: MarketInterpretation | null = null;

  if (inferences.length > 0) {
    const first = inferences[0]!;
    interpretation = {
      basedOn: [first.id],
      text: first.statement,
      recommendation: nl
        ? "Ik zou dat in de volgende campagne expliciet benoemen."
        : "I'd name that explicitly in the next campaign.",
    };
  } else if (detailed.length >= MIN_COMPETITORS_FOR_POSITION) {
    const names = detailed.slice(0, 3).map((c) => c.name);
    interpretation = {
      basedOn: observedFacts.slice(0, 2).map((o) => o.id),
      text: nl
        ? `Ik houd ${detailed.length} partijen bij, waaronder ${names.join(", ")}. Er is nog geen patroon dat om actie vraagt.`
        : `I'm tracking ${detailed.length} players, including ${names.join(", ")}. No pattern yet that calls for action.`,
      recommendation: null,
    };
  }

  // ---- Position: stated positioning only, and only when comparable -------
  const ownStatement =
    understanding?.brand?.positioningStatement?.trim() ||
    understanding?.brand?.valueProposition?.trim() ||
    null;
  const ownDifferentiators = understanding?.brand?.keyMessages ?? [];

  let position: MarketPosition | null = null;
  let positionUnavailable: MarketViewModel["positionUnavailable"] = null;

  const comparable = detailed.filter((c) => c.differentiators.length > 0);

  if (
    ownStatement &&
    comparable.length >= MIN_COMPETITORS_FOR_POSITION
  ) {
    position = {
      ownStatement,
      ownDifferentiators,
      competitors: comparable.map((c) => ({
        id: c.id,
        name: c.name,
        leadsWith: c.differentiators,
      })),
      caveat: nl
        ? "Dit is hoe iedereen zichzelf beschrijft — geen gemeten marktpositie."
        : "This is how everyone describes themselves — not a measured market position.",
    };
  } else {
    // §4.7 No position map when the input is incomplete or incomparable.
    positionUnavailable = {
      reason: !ownStatement
        ? nl
          ? "Ik weet nog niet hoe jullie jezelf positioneren, dus ik kan niets naast elkaar zetten."
          : "I don't know how you position yourselves yet, so there's nothing to set side by side."
        : nl
          ? `Ik heb van te weinig partijen vastgelegd waar ze op inzetten (${comparable.length}). Vanaf ${MIN_COMPETITORS_FOR_POSITION} kan ik vergelijken.`
          : `I have too few players with anything recorded about what they lead on (${comparable.length}). I can compare from ${MIN_COMPETITORS_FOR_POSITION}.`,
    };
  }

  // ---- States -------------------------------------------------------------
  const noCompetitors =
    competitors.length === 0
      ? {
          voice: nl
            ? "Ik houd nog geen concurrenten bij."
            : "I'm not tracking any competitors yet.",
          next: nl
            ? "Vertel me wie je concurrenten zijn en ik let op ze."
            : "Tell me who you're up against and I'll keep an eye on them.",
          ctaLabel: nl ? "Naar wat ik weet" : "What I know",
          ctaHref: officeHref(peerId, "agreement"),
        }
      : null;

  const partialData =
    competitors.length > 0 && detailed.length === 0
      ? nl
        ? `Ik heb ${competitors.length} ${competitors.length === 1 ? "naam" : "namen"} vastgelegd, maar verder nog niets. Zonder details kan ik er niets zinnigs over zeggen.`
        : `I have ${competitors.length} ${competitors.length === 1 ? "name" : "names"} on record and nothing else. Without detail there's nothing useful I can say.`
      : null;

  // ---- Presence: grounded, specific, never a generic market summary ------
  let presence: MarketViewModel["presence"];

  if (competitors.length === 0) {
    presence = {
      rung: "orientation",
      text: nl
        ? "Ik houd nog geen concurrenten bij. Zeg me wie ik moet volgen."
        : "I'm not tracking any competitors yet. Tell me who to watch.",
      working: false,
    };
  } else if (detailed.length === 0) {
    presence = {
      rung: "gap",
      text: nl
        ? `Ik ken ${competitors.length} ${competitors.length === 1 ? "naam" : "namen"}, maar weet er nog niets over.`
        : `I know ${competitors.length} ${competitors.length === 1 ? "name" : "names"} but nothing about them yet.`,
      working: false,
    };
  } else if (isStale) {
    presence = {
      rung: "qualified",
      text: nl
        ? `Ik volg ${detailed.length} partijen, maar deze kennis is ${ageDays} dagen oud — ik zou er niet blind op sturen.`
        : `I'm tracking ${detailed.length} players, but this knowledge is ${ageDays} days old — I wouldn't steer on it blind.`,
      working: false,
    };
  } else if (interpretation && inferences.length > 0) {
    presence = {
      rung: "interpretation",
      text: interpretation.text,
      working: false,
    };
  } else {
    presence = {
      rung: "observation",
      text: nl
        ? `Ik volg ${detailed.length} partijen. Er is niets veranderd dat om een beslissing vraagt.`
        : `I'm tracking ${detailed.length} players. Nothing has shifted that needs a decision from you.`,
      working: false,
    };
  }

  return {
    peerId,
    peerName: input.peerName,
    peerRole: input.peerRole,
    presence,
    competitors,
    observedFacts,
    inferences,
    interpretation,
    position,
    positionUnavailable,
    freshness,
    noCompetitors,
    partialData,
    copy,
  };
}
