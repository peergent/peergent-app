import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import type { PresenceLine } from "@/lib/design-system/foundation";
import {
  MIN_DAYS_FOR_CONCLUSION,
  NOTABLE_MAGNITUDE,
  type PerformanceGap,
  type PerformanceSignal,
} from "./types";

/**
 * §4.5 / §5.1 The grounding gate.
 *
 * This is the only place a Performance presence line is produced, and the
 * ladder is descended by evidence rather than chosen by preference. An
 * interpretation rung is *unreachable* unless there is something published,
 * a connected source, enough elapsed data, and a notable measured signal.
 *
 * If the available data does not support a conclusion she says so, rather than
 * inferring or estimating.
 */

export type GroundingEvidence = {
  /** Nothing published means nothing to measure — not "no results". */
  publishedCount: number;
  /**
   * Days of *publishing coverage* — elapsed time since the first publication in
   * the selected window. Deliberately not called connector coverage: no source
   * currently reports how long it has been observing. When real connectors
   * land this must measure their coverage instead, or the qualified-rung
   * threshold will be measuring the wrong thing.
   */
  daysOfData: number;
  /** Sources reporting right now. */
  connectedSources: readonly string[];
  /** Sources that would answer a question she currently cannot. */
  gaps: readonly PerformanceGap[];
  /** Sources failing at this moment — temporary, and hers to own. */
  failingSources: readonly string[];
  /** Only ever constructed from measured values. */
  signals: readonly PerformanceSignal[];
  /** Human label for the current filtered view, e.g. "LinkedIn, last 30 days". */
  viewLabel: string;
  /** What is next when there is nothing to read yet. */
  nextMilestone: string | null;
};

function strongest(signals: readonly PerformanceSignal[]): PerformanceSignal | null {
  if (signals.length === 0) return null;
  return [...signals].sort((a, b) => b.magnitude - a.magnitude)[0] ?? null;
}

/**
 * Produces the single presence line for the current filtered view.
 *
 * Rung order is fixed and matches §5.1: a fault outranks everything, and an
 * interpretation is the last thing reached rather than the first.
 */
export function groundPerformancePresence(
  evidence: GroundingEvidence,
  locale: MarketingCampaignLocale
): PresenceLine {
  const nl = locale === "nl";

  // Rung 6 — a source is failing right now. Owned, bounded, never a code.
  if (evidence.failingSources.length > 0) {
    const source = evidence.failingSources[0]!;
    return {
      rung: "fault",
      text: nl
        ? `Ik kan de cijfers van ${source} nu niet ophalen — dat ligt aan hun kant, niet aan die van jou. De rest hieronder klopt wel.`
        : `I can't reach ${source}'s numbers right now — their end, not yours. Everything else here is current.`,
      working: false,
    };
  }

  // Rung 4 — nothing published. Points forward with what is next.
  if (evidence.publishedCount === 0) {
    const next = evidence.nextMilestone;
    return {
      rung: "orientation",
      text: nl
        ? next
          ? `Nog niets te meten. Zodra ${next} live gaat begin ik het te volgen.`
          : "Nog niets te meten — er is nog niets gepubliceerd."
        : next
          ? `Nothing to read yet. Once ${next} goes out I'll start tracking it.`
          : "Nothing to read yet — nothing has been published.",
      working: false,
    };
  }

  // Rung 5 — published, but she cannot see what it did. A capability
  // boundary, stated without apology, naming what connecting would unlock.
  if (evidence.connectedSources.length === 0) {
    const gap = evidence.gaps[0];
    return {
      rung: "gap",
      text: nl
        ? gap
          ? `Ik zie wel wat ik verstuurd heb, maar niet wat het deed. Koppel ${gap.missing} en ik laat je ${gap.unlocks} zien.`
          : "Ik zie wel wat ik verstuurd heb, maar niet wat het deed."
        : gap
          ? `I can see what I sent, not what it did. Connect ${gap.missing} and I'll show you ${gap.unlocks}.`
          : "I can see what I sent, not what it did.",
      href: gap?.ctaHref ?? null,
      working: false,
    };
  }

  // Rung 2 — connected, but too little elapsed data to draw a conclusion. She
  // still reads it, and marks the limit inside the sentence rather than as a
  // badge or a percentage.
  if (evidence.daysOfData < MIN_DAYS_FOR_CONCLUSION) {
    const signal = strongest(evidence.signals);
    const days = Math.max(evidence.daysOfData, 1);
    return {
      rung: "qualified",
      text: nl
        ? signal
          ? `Eerste indruk: ${signal.interpretation} Maar dit is ${days} dagen publiceren — daar zou ik nog niet op sturen.`
          : `Dit is pas ${days} dagen publiceren — te vroeg om iets van te zeggen. Ik zou een week aanhouden.`
        : signal
          ? `Early read: ${signal.interpretation} But that's ${days} days of publishing — I wouldn't act on it yet.`
          : `That's only ${days} days of publishing — too early to read. I'd give it a week.`,
      working: false,
    };
  }

  // Rung 1 — a genuine, measured, notable movement. The only path to an
  // interpretation, and it requires every gate above to have passed.
  const signal = strongest(evidence.signals);
  if (signal && signal.magnitude >= NOTABLE_MAGNITUDE) {
    const parts = [signal.interpretation];
    if (signal.benchmark) parts.push(signal.benchmark);
    if (signal.recommendation) parts.push(signal.recommendation);
    return {
      rung: "interpretation",
      text: parts.join(" "),
      working: false,
    };
  }

  // Rung 3 — real data, nothing notable. Steadiness is a finding, and the most
  // common truth in any business.
  return {
    rung: "observation",
    text: nl
      ? `Er is deze periode weinig veranderd in ${evidence.viewLabel}. Alles houdt zich op het niveau van daarvoor.`
      : `Nothing has moved much in ${evidence.viewLabel} this period — things are holding where they were.`,
    working: false,
  };
}

/**
 * Guard used by the adapter: a signal may only exist when it has a measured
 * fact behind it. Anything without one is dropped rather than softened.
 */
export function keepGroundedSignals(
  signals: readonly PerformanceSignal[]
): PerformanceSignal[] {
  return signals.filter(
    (signal) =>
      signal.fact.trim().length > 0 &&
      signal.interpretation.trim().length > 0 &&
      Number.isFinite(signal.magnitude)
  );
}
