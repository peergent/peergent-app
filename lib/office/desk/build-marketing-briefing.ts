import { resolveMarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import { buildMarketingWorkViewModel } from "../work/build-marketing-work";
import { buildMarketingPerformanceViewModelForOffice } from "../performance/build-marketing-performance";
import { buildMarketingContentViewModel } from "../content/build-marketing-content";
import { buildMarketingMarketViewModel } from "../market/build-marketing-market";
import { buildMarketingAgreementViewModel } from "../agreement/build-marketing-agreement";
import { officeHref } from "../links";
import type {
  BriefingCopy,
  BriefingNextStep,
  BriefingPanel,
  BriefingStat,
  DeskBriefing,
  DeskFocusAnchor,
} from "./briefing-types";
import type { WorkViewModel } from "../work/types";
import type { DeskViewModel } from "./types";

/**
 * Marketing adapter for the Desk briefing (§4.1).
 *
 * This composes the five destination view models rather than reaching into the
 * domain again. That is the whole point: what the Desk says about Performance
 * is, by construction, exactly what Performance would say — including its
 * grounding gate, its methodology rules and its honest gaps. No summary can
 * drift from the page it summarises, and no new claim can be introduced here.
 *
 * The cost is that all five builders run on the Desk. They are pure functions
 * of the same `domainInput` the Desk already holds, and the page memoises the
 * result, so this is arithmetic on data already in memory.
 */

type BriefingInput = {
  domainInput: MarketingPeerDomainInput;
  peerName: string;
  peerRole: string;
  localePreference?: string | null;
  desk: DeskViewModel;
  now?: Date;
};

function copyFor(locale: "en" | "nl"): BriefingCopy {
  if (locale === "nl") {
    return {
      briefingHeading: "Hoe het ervoor staat",
      nextStepHeading: "Wat ik als volgende zou doen",
      whyLabel: "Waarom",
      changesHeading: "Sinds je er voor het laatst was",
      futureHeading: "Wat hier komt",
      openLabel: (destination) => `Open ${destination}`,
    };
  }
  return {
    briefingHeading: "Where things stand",
    nextStepHeading: "What I'd do next",
    whyLabel: "Why",
    changesHeading: "Since you were last here",
    futureHeading: "What appears here",
    openLabel: (destination) => `Open ${destination}`,
  };
}

/** A count is only worth a tile when it is non-zero or genuinely reassuring. */
function stat(
  id: string,
  label: string,
  value: string,
  hint: string | null,
  tone: BriefingStat["tone"] = "neutral"
): BriefingStat {
  return { id, label, value, hint, tone };
}

/**
 * Walks the Focus Anchor priority ladder over data that already exists.
 *
 * Each rung reads from a destination view model rather than from the domain, so
 * the anchor cannot describe work that a page would not show. The ladder falls
 * through in severity of *evidence*, not of urgency — urgency is Presence's job
 * and blocking is Attention's, and neither may pre-empt the subject of the day.
 *
 * Note what is deliberately absent: `blocked_on_you` is never an anchor. Work
 * waiting on the customer is Attention, and promoting it here would recreate
 * the collision this concept exists to resolve.
 */
function buildFocusAnchor(
  desk: DeskViewModel,
  work: WorkViewModel,
  nl: boolean
): DeskFocusAnchor {
  const groupItems = (id: string) =>
    work.groups.find((group) => group.id === id)?.items ?? [];

  const allWorkItems = work.groups.flatMap((group) => group.items);

  // 1. Verified work currently in progress.
  //
  // The Desk's own in-flight entry is *not* trusted on its own: when there is
  // no active project it falls back to the workspace's campaign title, which
  // names a campaign that may not exist. It only becomes an anchor when Work
  // is showing the same item, and then the real item supplies the id.
  const inFlight = desk.inFlight[0];
  const verifiedInFlight = inFlight
    ? allWorkItems.find((item) => item.name === inFlight.what)
    : undefined;

  if (inFlight && verifiedInFlight) {
    return {
      source: "in_progress",
      eyebrow: desk.copy.inFlightHeading,
      headline: verifiedInFlight.name,
      detail: inFlight.nextStep ?? verifiedInFlight.nextStep,
      subjectId: verifiedInFlight.id,
      href: inFlight.href ?? verifiedInFlight.href,
      ctaLabel: desk.copy.openCampaign,
      meta: inFlight.expected ?? verifiedInFlight.expectedLabel,
    };
  }

  // 2. A campaign being prepared. Real stage, real next step, real item.
  const moving = groupItems("moving")[0];
  if (moving) {
    return {
      source: "preparing",
      eyebrow: desk.copy.inFlightHeading,
      headline: moving.name,
      detail: moving.nextStep,
      subjectId: moving.id,
      href: moving.href,
      ctaLabel: desk.copy.openCampaign,
      meta: moving.expectedLabel,
    };
  }

  // 3. Work that is out and still being watched. Queued work counts here too:
  //    it is committed but not yet moving, which is still a real subject.
  const watching = groupItems("finished")[0] ?? groupItems("queued")[0];
  if (watching) {
    return {
      source: "monitoring",
      eyebrow: nl ? "Wat ik volg" : "What I'm watching",
      headline: watching.name,
      detail: watching.nextStep ?? watching.stageLabel,
      subjectId: watching.id,
      href: watching.href,
      ctaLabel: desk.copy.openCampaign,
      meta: watching.expectedLabel,
    };
  }

  // 4. Nothing is running, but she has a grounded recommendation.
  if (work.proposal) {
    return {
      source: "recommendation",
      eyebrow: work.copy.whereIdStart,
      headline: work.proposal.voice,
      detail: work.proposal.next,
      subjectId: null,
      href: null,
      ctaLabel: null,
      meta: work.proposal.basedOn,
    };
  }

  // 5. The designed calm state. Still her voice, still evidenced.
  return {
    source: "calm",
    eyebrow: desk.copy.rightNowHeading,
    headline:
      desk.empty?.voice ?? (nl ? "Er loopt nu niets." : "Nothing is running right now."),
    detail: desk.empty?.next ?? null,
    subjectId: null,
    href: null,
    ctaLabel: null,
    meta: null,
  };
}

export function buildMarketingDeskBriefing(input: BriefingInput): DeskBriefing {
  const locale = resolveMarketingCampaignLocale(input.localePreference);
  const nl = locale === "nl";
  const copy = copyFor(locale);
  const peerId = input.domainInput.peerId;

  const shared = {
    domainInput: input.domainInput,
    peerName: input.peerName,
    peerRole: input.peerRole,
    localePreference: input.localePreference,
  };

  const work = buildMarketingWorkViewModel(shared);
  const performance = buildMarketingPerformanceViewModelForOffice({
    ...shared,
    now: input.now,
  });
  const content = buildMarketingContentViewModel(shared);
  const market = buildMarketingMarketViewModel({ ...shared, now: input.now });
  const agreement = buildMarketingAgreementViewModel(shared);

  const panels: BriefingPanel[] = [];

  /* ---------------- Work ---------------------------------------------- */

  const groupCount = (id: string) =>
    work.groups.find((group) => group.id === id)?.items.length ?? 0;
  const blockedOnYou = groupCount("blocked_on_you");
  const moving = groupCount("moving");
  const queued = groupCount("queued");
  const workTotal = work.groups.reduce(
    (total, group) => total + (group.id === "finished" ? 0 : group.items.length),
    0
  );

  const workStats: BriefingStat[] = [];
  if (blockedOnYou > 0) {
    workStats.push(
      stat(
        "blocked",
        nl ? "Wacht op jou" : "Waiting on you",
        String(blockedOnYou),
        work.groups.find((g) => g.id === "blocked_on_you")?.items[0]?.name ?? null,
        "attention"
      )
    );
  }
  if (moving > 0) {
    workStats.push(
      stat(
        "moving",
        nl ? "Onderweg" : "Moving",
        String(moving),
        work.groups.find((g) => g.id === "moving")?.items[0]?.name ?? null
      )
    );
  }
  if (queued > 0) {
    workStats.push(stat("queued", nl ? "In de wachtrij" : "Queued", String(queued), null, "quiet"));
  }

  panels.push({
    id: "work",
    eyebrow: work.copy.title,
    headline:
      workTotal > 0
        ? work.presence?.text ??
          (nl
            ? `${workTotal} campagnes lopen.`
            : `${workTotal} campaigns are running.`)
        : work.proposal?.voice ?? (nl ? "Nog niets gestart." : "Nothing started yet."),
    stats: workStats,
    future:
      workTotal === 0 && work.proposal
        ? {
            promise: nl
              ? "Elke campagne die loopt, met wie erop wacht."
              : "Every campaign in flight, and who it is waiting on.",
            unlocks: work.proposal.next ?? work.proposal.voice,
            ctaLabel: work.proposal.acceptLabel,
            ctaHref: officeHref(peerId, "work"),
          }
        : null,
    href: officeHref(peerId, "work"),
    openLabel: copy.openLabel(work.copy.title),
  });

  /* ---------------- Performance ---------------------------------------- */

  // §4.5 already decides what may be shown at all; the Desk narrows that set,
  // never widens it. Within it, a channel-reported outcome outranks an internal
  // count: "reach" is what the customer came to find out, "published" is what we
  // happen to be able to count without help.
  const rankedMetrics = [
    ...performance.metrics.filter((metric) => metric.source === "channel"),
    ...performance.metrics.filter((metric) => metric.source !== "channel"),
  ];
  const perfStats = rankedMetrics.slice(0, 2).map((metric) =>
    stat(
      metric.id,
      metric.label,
      metric.value,
      metric.comparison?.label ?? null,
      metric.comparison?.direction === "up" ? "positive" : "neutral"
    )
  );
  const topSignal = [...performance.signals].sort((a, b) => b.magnitude - a.magnitude)[0] ?? null;
  const perfGap = performance.gaps[0] ?? null;

  panels.push({
    id: "performance",
    eyebrow: performance.copy.title,
    headline: topSignal
      ? topSignal.interpretation
      : performance.presence.text,
    stats: perfStats,
    future:
      perfStats.length === 0 && perfGap
        ? {
            promise: perfGap.unlocks,
            unlocks: perfGap.missing,
            ctaLabel: perfGap.ctaLabel,
            ctaHref: perfGap.ctaHref,
          }
        : null,
    href: officeHref(peerId, "performance"),
    openLabel: copy.openLabel(performance.copy.title),
  });

  /* ---------------- Content -------------------------------------------- */

  const contentCount = (state: string) =>
    content.groups.find((group) => group.state === state)?.items.length ?? 0;
  const published = contentCount("published");
  const awaitingReview = contentCount("awaiting_review");
  const drafts = contentCount("draft");
  const scheduled = contentCount("scheduled");

  const contentStats: BriefingStat[] = [];
  if (awaitingReview > 0) {
    contentStats.push(
      stat(
        "awaiting",
        nl ? "Wacht op goedkeuring" : "Awaiting review",
        String(awaitingReview),
        null,
        "attention"
      )
    );
  }
  if (scheduled > 0) {
    contentStats.push(
      stat(
        "scheduled",
        nl ? "Ingepland" : "Scheduled",
        String(scheduled),
        content.groups.find((g) => g.state === "scheduled")?.items[0]?.dateLabel ?? null
      )
    );
  }
  if (drafts > 0) {
    contentStats.push(stat("drafts", nl ? "Concepten" : "Drafts", String(drafts), null, "quiet"));
  }
  if (published > 0 && contentStats.length < 3) {
    contentStats.push(
      stat(
        "published",
        nl ? "Gepubliceerd" : "Published",
        String(published),
        content.groups.find((g) => g.state === "published")?.items[0]?.title ?? null
      )
    );
  }

  panels.push({
    id: "content",
    eyebrow: content.copy.title,
    headline: content.presence.text,
    stats: contentStats,
    future:
      content.totalCount === 0 && content.empty
        ? {
            promise: nl
              ? "Alles wat ik schrijf, van concept tot gepubliceerd."
              : "Everything I write, from draft to published.",
            unlocks: content.empty.next ?? content.empty.voice,
            ctaLabel: null,
            ctaHref: content.empty.href,
          }
        : null,
    href: officeHref(peerId, "content"),
    openLabel: copy.openLabel(content.copy.title),
  });

  /* ---------------- Market --------------------------------------------- */

  const marketStats: BriefingStat[] = [];
  if (market.competitors.length > 0) {
    marketStats.push(
      stat(
        "competitors",
        nl ? "Concurrenten" : "Competitors",
        String(market.competitors.length),
        market.competitors[0]?.name ?? null
      )
    );
  }
  if (market.observedFacts.length > 0) {
    marketStats.push(
      stat(
        "observed",
        market.copy.observedHeading,
        String(market.observedFacts.length),
        null,
        "quiet"
      )
    );
  }

  panels.push({
    id: "market",
    eyebrow: market.copy.title,
    headline:
      market.interpretation?.text ??
      market.partialData ??
      market.presence.text,
    stats: marketStats,
    future: market.noCompetitors
      ? {
          promise: nl
            ? "Wat je concurrenten doen, en wat dat voor jouw positie betekent."
            : "What your competitors are doing, and what it means for your position.",
          unlocks: market.noCompetitors.next,
          ctaLabel: market.noCompetitors.ctaLabel,
          ctaHref: market.noCompetitors.ctaHref,
        }
      : null,
    href: officeHref(peerId, "market"),
    openLabel: copy.openLabel(market.copy.title),
  });

  /* ---------------- Working agreement ----------------------------------- */

  const connected = agreement.connections.filter((c) => c.connected);
  const missing = agreement.connections.filter((c) => !c.connected);

  const agreementStats: BriefingStat[] = [];
  if (agreement.autonomous.length > 0) {
    agreementStats.push(
      stat(
        "autonomous",
        agreement.copy.autonomousHeading,
        String(agreement.autonomous.length),
        null
      )
    );
  }
  if (agreement.needsApproval.length > 0) {
    agreementStats.push(
      stat(
        "approval",
        agreement.copy.needsApprovalHeading,
        String(agreement.needsApproval.length),
        null
      )
    );
  }
  if (agreement.connections.length > 0) {
    agreementStats.push(
      stat(
        "connections",
        agreement.copy.connectionsHeading,
        `${connected.length}/${agreement.connections.length}`,
        missing[0]?.label ?? null,
        missing.length > 0 ? "attention" : "neutral"
      )
    );
  }

  panels.push({
    id: "agreement",
    eyebrow: agreement.copy.title,
    headline: agreement.presence.text,
    stats: agreementStats,
    future:
      agreement.connections.length === 0 && agreement.empty
        ? {
            promise: nl
              ? "Wat ik zelf mag doen, en waar ik altijd voor terugkom."
              : "What I may do alone, and what I always come back for.",
            unlocks: agreement.empty.next,
            ctaLabel: null,
            ctaHref: null,
          }
        : null,
    href: officeHref(peerId, "agreement"),
    openLabel: copy.openLabel(agreement.copy.title),
  });

  /* ---------------- One next step --------------------------------------- */

  // Severity order, and every branch quotes a fact the customer can check.
  let nextStep: BriefingNextStep | null = null;

  const decision = input.desk.decisions[0] ?? null;
  const missingConnection = missing[0] ?? null;

  if (decision) {
    nextStep = {
      label: decision.title,
      why: decision.unblocks,
      ctaLabel: decision.primaryLabel,
      href: decision.href,
      origin: "work",
    };
  } else if (perfGap) {
    nextStep = {
      label: perfGap.missing,
      why: perfGap.unlocks,
      ctaLabel: perfGap.ctaLabel,
      href: perfGap.ctaHref,
      origin: "performance",
    };
  } else if (missingConnection) {
    nextStep = {
      label: missingConnection.label,
      why: missingConnection.unlocks,
      ctaLabel: agreement.copy.connectionsHeading,
      href: missingConnection.href,
      origin: "agreement",
    };
  } else if (topSignal?.recommendation) {
    nextStep = {
      label: topSignal.recommendation,
      why: topSignal.fact,
      ctaLabel: performance.copy.title,
      href: officeHref(peerId, "performance"),
      origin: "performance",
    };
  } else if (work.proposal) {
    nextStep = {
      label: work.proposal.voice,
      why: work.proposal.next ?? work.proposal.basedOn ?? "",
      ctaLabel: work.proposal.acceptLabel,
      href: officeHref(peerId, "work"),
      origin: "work",
    };
  }

  return {
    rung: input.desk.presence?.rung ?? "orientation",
    focus: buildFocusAnchor(input.desk, work, nl),
    panels,
    nextStep,
    changes: input.desk.completed.map((item) => ({
      id: item.id,
      label: item.label,
      context: item.context,
      timeLabel: item.timeLabel,
      href: item.href,
    })),
    copy,
  };
}
