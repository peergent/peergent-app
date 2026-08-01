import { PERFORMANCE_PAGE_SECTIONS, type PerformanceSectionId } from "@/lib/metrics/types";
import type { MetricSnapshot } from "@/lib/metrics/types";
import {
  INTEGRATION_LABELS,
  type IntegrationConnection,
  type IntegrationProviderId,
} from "@/lib/integrations/types";
import type { MarketingCampaignLocale } from "@/lib/i18n/marketing-campaign-copy";
import { officeMetricDef, providerCanReport, type OfficeMetricKind } from "./metric-catalog";

/**
 * §4.5 Performance, organised by the domain's own eight sections.
 *
 * `PERFORMANCE_PAGE_SECTIONS` already declares which metric keys belong to
 * which part of the page and which integrations each part needs. This assembles
 * against that declaration rather than inventing a parallel analytics model,
 * so the Office and the domain cannot drift.
 *
 * ## The grounding rule, in one place
 *
 * A figure is rendered when **all** of these hold:
 *
 *   1. a stored snapshot exists for this peer with that metric key
 *   2. the catalogue knows how to present that key
 *   3. the snapshot's provider is one that can legitimately report it
 *   4. that provider is actually connected right now
 *   5. the value is non-empty
 *
 * Anything failing any of those is absent — never zero, never a dash, never a
 * placeholder. A zero is a measurement; showing one for an unconnected source
 * is a lie about the customer's business.
 */

export type PerformanceSectionState = "reporting" | "unavailable";

export type PerformanceSectionMetric = {
  key: string;
  label: string;
  value: string;
  kind: OfficeMetricKind;
  upIsGood: boolean;
  /** Which connected source reported it. Always stated, never inferred. */
  sourceLabel: string;
  methodology: string;
  /**
   * A real period-over-period comparison, or null.
   *
   * Currently always null for channel-reported figures: `MetricSnapshot` holds
   * a single period and carries no prior value, so there is nothing to compare
   * against. Synthesising one would be exactly the fabricated delta §12
   * forbids, so the field exists and stays empty until the shape can supply it.
   */
  delta: { direction: "up" | "down" | "flat"; label: string } | null;
  priority: number;
};

export type PerformanceSectionModel = {
  id: PerformanceSectionId;
  title: string;
  description: string;
  state: PerformanceSectionState;
  metrics: PerformanceSectionMetric[];
  /** Present only when the section cannot report. Names what would unlock it. */
  unavailable: {
    reason: string;
    missing: string[];
    /**
     * Null when there is nothing to connect — a section like "What I
     * produced" needs no integration, only work that has not happened yet.
     * Pointing that case at "Connect" would send the customer to a settings
     * page that cannot fix anything, which is a small honesty violation in
     * itself: a CTA is a claim that clicking it helps.
     */
    ctaLabel: string | null;
    ctaHref: string | null;
  } | null;
};

/* ---------------- Localised section copy ---------------------------------
 * The domain's section titles are English vocabulary shared with other
 * surfaces. Translating happens here, at the presentation boundary, exactly as
 * it does for work stages and channel names.
 * ------------------------------------------------------------------------ */

const SECTION_COPY: Record<
  PerformanceSectionId,
  Record<MarketingCampaignLocale, { title: string; description: string }>
> = {
  overview: {
    en: { title: "Business outcomes", description: "What the work returned." },
    nl: { title: "Zakelijke resultaten", description: "Wat het werk heeft opgeleverd." },
  },
  channels: {
    en: { title: "Channels", description: "Where the audience actually is." },
    nl: { title: "Kanalen", description: "Waar je publiek daadwerkelijk zit." },
  },
  campaigns: {
    en: { title: "Campaigns", description: "What each campaign returned." },
    nl: { title: "Campagnes", description: "Wat elke campagne heeft opgeleverd." },
  },
  content: {
    en: { title: "Content performance", description: "How the work itself landed." },
    nl: { title: "Prestaties van content", description: "Hoe het werk zelf is geland." },
  },
  seo: {
    en: { title: "Organic visibility", description: "What search brings in." },
    nl: { title: "Zichtbaarheid in zoeken", description: "Wat zoekverkeer oplevert." },
  },
  ads: {
    en: { title: "Paid media", description: "What the budget bought." },
    nl: { title: "Betaalde media", description: "Wat het budget heeft opgeleverd." },
  },
  attribution: {
    en: { title: "Attribution", description: "Revenue and leads traced back to the work." },
    nl: { title: "Toewijzing", description: "Omzet en leads herleid naar het werk." },
  },
  workforce_roi: {
    en: { title: "What I produced", description: "Activity, counted internally." },
    nl: { title: "Wat ik heb gemaakt", description: "Productie, intern geteld." },
  },
};

function connectedProviders(connections: IntegrationConnection[]): Set<string> {
  return new Set(
    connections.filter((c) => c.status === "connected").map((c) => c.id as string)
  );
}

function providerLabel(provider: string): string {
  return (
    INTEGRATION_LABELS[provider as IntegrationProviderId] ??
    (provider === "operational" ? "Peergent" : provider)
  );
}

export type BuildSectionsInput = {
  peerId: string;
  locale: MarketingCampaignLocale;
  connections: IntegrationConnection[];
  storedMetrics: MetricSnapshot[];
  /** Internally counted figures, keyed by metric key. Never estimates. */
  countedMetrics: Record<string, string>;
  agreementHref: string;
};

export function buildPerformanceSections(
  input: BuildSectionsInput
): PerformanceSectionModel[] {
  const nl = input.locale === "nl";
  const connected = connectedProviders(input.connections);

  // Snapshots for this peer only, indexed by key. A later snapshot wins.
  const byKey = new Map<string, MetricSnapshot>();
  for (const snapshot of input.storedMetrics) {
    if (snapshot.peerId !== input.peerId) continue;
    const existing = byKey.get(snapshot.metricKey);
    if (!existing || snapshot.recordedAt > existing.recordedAt) {
      byKey.set(snapshot.metricKey, snapshot);
    }
  }

  return PERFORMANCE_PAGE_SECTIONS.map((section) => {
    const copy = SECTION_COPY[section.id][input.locale];
    const metrics: PerformanceSectionMetric[] = [];

    for (const key of section.metricKeys) {
      const def = officeMetricDef(key);
      if (!def) continue;

      // Internally counted figures need no integration — but they must be
      // genuinely counted, never estimated into existence.
      if (def.providers.length === 0) {
        const counted = input.countedMetrics[key];
        if (!counted) continue;
        metrics.push({
          key,
          label: def.label[input.locale],
          value: counted,
          kind: def.kind,
          upIsGood: def.upIsGood,
          sourceLabel: providerLabel("operational"),
          methodology: nl
            ? "Geteld op basis van wat er daadwerkelijk is gebeurd."
            : "Counted from what actually happened.",
          delta: null,
          priority: def.priority,
        });
        continue;
      }

      const snapshot = byKey.get(key);
      if (!snapshot) continue;
      if (!providerCanReport(def, snapshot.provider)) continue;
      if (!connected.has(snapshot.provider)) continue;

      const value = `${snapshot.value ?? ""}`.trim();
      if (!value || value === "—") continue;

      const source = providerLabel(snapshot.provider);
      metrics.push({
        key,
        label: def.label[input.locale],
        value: snapshot.unit ? `${value}${snapshot.unit}` : value,
        kind: def.kind,
        upIsGood: def.upIsGood,
        sourceLabel: source,
        methodology: nl
          ? `Gerapporteerd door ${source}.`
          : `Reported by ${source}.`,
        delta: null,
        priority: def.priority,
      });
    }

    metrics.sort((a, b) => a.priority - b.priority);

    if (metrics.length > 0) {
      return {
        id: section.id,
        title: copy.title,
        description: copy.description,
        state: "reporting" as const,
        metrics,
        unavailable: null,
      };
    }

    // Nothing to report. Name what would change that, using the section's own
    // declared requirements rather than a generic pitch.
    const missing = section.requiresConnection
      .filter((provider) => !connected.has(provider))
      .map((provider) => providerLabel(provider));

    return {
      id: section.id,
      title: copy.title,
      description: copy.description,
      state: "unavailable" as const,
      metrics: [],
      unavailable: {
        reason:
          missing.length > 0
            ? nl
              ? `Nog geen bron gekoppeld die dit rapporteert.`
              : `No connected source reports this yet.`
            : nl
              ? "Hier is nog niets van te meten."
              : "There is nothing to measure here yet.",
        missing,
        // Only offer to connect something when there is genuinely something
        // to connect. "What I produced" needs work done, not an integration —
        // sending that case to the agreement page would be a CTA that lies.
        ctaLabel: missing.length > 0 ? (nl ? "Koppelen" : "Connect") : null,
        ctaHref: missing.length > 0 ? input.agreementHref : null,
      },
    };
  });
}
