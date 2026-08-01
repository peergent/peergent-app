import { describe, expect, it } from "vitest";
import { buildPerformanceSections } from "@/lib/office/performance/sections";
import {
  OFFICE_METRIC_CATALOG,
  officeMetricDef,
} from "@/lib/office/performance/metric-catalog";
import { PERFORMANCE_PAGE_SECTIONS } from "@/lib/metrics/types";
import type { MetricSnapshot } from "@/lib/metrics/types";
import type { IntegrationConnection } from "@/lib/integrations/types";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";

/**
 * Performance now surfaces the domain's full modelled vocabulary instead of a
 * six-item allowlist. The value of that is entirely dependent on the grounding
 * rules holding, so these pin them individually.
 */

const PEER = "demo";

function connection(
  id: IntegrationConnection["id"],
  status: IntegrationConnection["status"] = "connected"
): IntegrationConnection {
  return {
    id,
    label: id,
    status,
    settingsHref: `/integrations?provider=${id}`,
    lastSyncedAt: status === "connected" ? "2026-07-31T06:00:00.000Z" : null,
  };
}

function snapshot(
  metricKey: string,
  provider: MetricSnapshot["provider"],
  value: string,
  peerId = PEER
): MetricSnapshot {
  return {
    id: `m-${metricKey}`,
    peerId,
    provider,
    metricKey,
    label: metricKey,
    value,
    unit: null,
    periodStart: "2026-07-01T00:00:00.000Z",
    periodEnd: "2026-07-31T00:00:00.000Z",
    recordedAt: "2026-07-31T06:00:00.000Z",
  };
}

function build(over: {
  connections?: IntegrationConnection[];
  storedMetrics?: MetricSnapshot[];
  countedMetrics?: Record<string, string>;
}) {
  return buildPerformanceSections({
    peerId: PEER,
    locale: "en",
    connections: over.connections ?? [],
    storedMetrics: over.storedMetrics ?? [],
    countedMetrics: over.countedMetrics ?? {},
    agreementHref: "/office/demo/agreement",
  });
}

const allMetrics = (sections: ReturnType<typeof build>) =>
  sections.flatMap((section) => section.metrics);

describe("the catalogue covers what the domain models", () => {
  it("knows how to present every key the eight sections name", () => {
    const declared = new Set(
      PERFORMANCE_PAGE_SECTIONS.flatMap((section) => section.metricKeys)
    );
    const unknown = [...declared].filter((key) => officeMetricDef(key) === null);
    expect(unknown, `no presentation for: ${unknown.join(", ")}`).toEqual([]);
  });

  it("surfaces far more than the six the old allowlist caught", () => {
    // The regression this whole phase exists to prevent.
    expect(OFFICE_METRIC_CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it("gives every definition a label in both languages", () => {
    for (const def of OFFICE_METRIC_CATALOG) {
      expect(def.label.en.trim()).not.toBe("");
      expect(def.label.nl.trim()).not.toBe("");
    }
  });

  it("marks metrics where a rise is bad news", () => {
    // Cost climbing and search position climbing are both worse, and must
    // never be coloured with the same green as revenue climbing.
    for (const key of ["cpa", "cpc", "campaign_cpa", "seo_rankings"]) {
      expect(officeMetricDef(key)?.upIsGood, `${key} treats a rise as good`).toBe(false);
    }
  });
});

describe("a metric renders only when a connected source reports it", () => {
  it("shows a figure when the source is connected", () => {
    const sections = build({
      connections: [connection("search_console")],
      storedMetrics: [snapshot("seo_clicks", "search_console", "1240")],
    });
    const seo = sections.find((s) => s.id === "seo")!;
    expect(seo.state).toBe("reporting");
    expect(seo.metrics.map((m) => m.key)).toContain("seo_clicks");
  });

  it("hides the same figure when the source is not connected", () => {
    const sections = build({
      connections: [connection("search_console", "not_connected")],
      storedMetrics: [snapshot("seo_clicks", "search_console", "1240")],
    });
    const seo = sections.find((s) => s.id === "seo")!;
    expect(seo.state).toBe("unavailable");
    expect(seo.metrics).toEqual([]);
  });

  it("hides it when the source needs reconnecting", () => {
    const sections = build({
      connections: [connection("search_console", "needs_reconnect")],
      storedMetrics: [snapshot("seo_clicks", "search_console", "1240")],
    });
    expect(sections.find((s) => s.id === "seo")!.state).toBe("unavailable");
  });

  it("refuses a figure from a source that cannot know it", () => {
    // Mailchimp cannot report search rankings. A number whose provenance we
    // cannot state is a number we cannot defend.
    const sections = build({
      connections: [connection("mailchimp")],
      storedMetrics: [snapshot("seo_rankings", "mailchimp", "4.2")],
    });
    expect(sections.find((s) => s.id === "seo")!.metrics).toEqual([]);
  });

  it("ignores another peer's snapshots entirely", () => {
    const sections = build({
      connections: [connection("search_console")],
      storedMetrics: [snapshot("seo_clicks", "search_console", "1240", "someone-else")],
    });
    expect(sections.find((s) => s.id === "seo")!.metrics).toEqual([]);
  });
});

describe("unavailable never means zero", () => {
  it("renders no metric at all rather than a zero", () => {
    const sections = build({ connections: [], storedMetrics: [] });
    expect(allMetrics(sections)).toEqual([]);
    for (const section of sections) {
      expect(section.state).toBe("unavailable");
      expect(section.unavailable).not.toBeNull();
    }
  });

  it("drops an empty or placeholder value instead of displaying it", () => {
    for (const value of ["", "   ", "—"]) {
      const sections = build({
        connections: [connection("search_console")],
        storedMetrics: [snapshot("seo_clicks", "search_console", value)],
      });
      expect(sections.find((s) => s.id === "seo")!.metrics).toEqual([]);
    }
  });

  it("names what would unlock an unavailable section", () => {
    const sections = build({ connections: [], storedMetrics: [] });
    const seo = sections.find((s) => s.id === "seo")!;
    expect(seo.unavailable!.reason.trim()).not.toBe("");
    expect(seo.unavailable!.missing.length).toBeGreaterThan(0);
    expect(seo.unavailable!.ctaHref).toContain("/office/");
  });

  it("never offers to connect a section that needs no integration", () => {
    // "What I produced" (workforce_roi) declares no requiresConnection — it
    // is empty because no work has happened yet, not because a source is
    // missing. Pointing its CTA at the agreement page would be a claim that
    // clicking it fixes something, when nothing there can.
    const sections = build({ connections: [], storedMetrics: [] });
    const produced = sections.find((s) => s.id === "workforce_roi")!;

    expect(produced.state).toBe("unavailable");
    expect(produced.unavailable!.missing).toEqual([]);
    expect(produced.unavailable!.ctaLabel).toBeNull();
    expect(produced.unavailable!.ctaHref).toBeNull();
  });
});

describe("methodology states the source that actually reported", () => {
  it("names the reporting provider, not the metric", () => {
    const sections = build({
      connections: [connection("ga4")],
      storedMetrics: [snapshot("reach", "ga4", "18420")],
    });
    const reach = allMetrics(sections).find((m) => m.key === "reach")!;
    expect(reach.sourceLabel).toBe("GA4");
    expect(reach.methodology).toContain("GA4");
    // "Reported by Reach" tells the customer nothing.
    expect(reach.methodology).not.toContain("Reach.");
  });

  it("says a counted figure was counted, not reported", () => {
    const sections = build({ countedMetrics: { content_published: "6" } });
    const published = allMetrics(sections).find((m) => m.key === "content_published")!;
    expect(published.methodology.toLowerCase()).toContain("counted");
  });
});

describe("no fabricated comparisons", () => {
  it("never invents a delta, because the snapshot holds no prior period", () => {
    const sections = build({
      connections: [connection("ga4"), connection("hubspot")],
      storedMetrics: [
        snapshot("reach", "ga4", "18420"),
        snapshot("attributed_revenue", "hubspot", "41200"),
      ],
    });
    for (const metric of allMetrics(sections)) {
      expect(metric.delta, `${metric.key} invented a comparison`).toBeNull();
    }
  });
});

describe("outcomes rank above production activity", () => {
  it("sorts every outcome ahead of every activity in the executive row", () => {
    const domainInput = buildDemoDomainInput({ now: new Date("2026-07-31T09:00:00.000Z") });
    const model = buildMarketingPerformanceViewModelForOffice({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
      now: new Date("2026-07-31T09:00:00.000Z"),
    });

    expect(model.executive.length).toBeGreaterThan(0);
    for (const metric of model.executive) {
      expect(metric.kind, `${metric.key} is activity in the executive row`).toBe(
        "outcome"
      );
    }

    const priorities = model.executive.map((m) => m.priority);
    expect([...priorities].sort((a, b) => a - b)).toEqual(priorities);
  });

  it("keeps production activity in its own section at the foot", () => {
    const sections = build({
      countedMetrics: { content_published: "6", tasks_completed: "2" },
    });
    const produced = sections.find((s) => s.id === "workforce_roi")!;
    expect(produced.state).toBe("reporting");
    for (const metric of produced.metrics) {
      expect(metric.kind).toBe("activity");
    }
    // And it is genuinely last in the domain's own ordering.
    expect(sections[sections.length - 1].id).toBe("workforce_roi");
  });

  it("never surfaces the estimated hours-saved figure", () => {
    // Its only producer multiplies completed work by 45 minutes. §12 forbids
    // surfacing a number that feels good and cannot be defended.
    const domainInput = buildDemoDomainInput();
    const model = buildMarketingPerformanceViewModelForOffice({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
    });
    const keys = model.sections.flatMap((s) => s.metrics.map((m) => m.key));
    expect(keys).not.toContain("hours_saved");
  });
});

describe("no figure is stated twice across the page", () => {
  it("keeps every metric key unique across all sections", () => {
    const domainInput = buildDemoDomainInput();
    const model = buildMarketingPerformanceViewModelForOffice({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
    });

    const keys = model.sections.flatMap((s) => s.metrics.map((m) => m.key));
    expect(keys.length).toBe(new Set(keys).size);
  });

  it("never shows the same value twice across sections", () => {
    // Unique keys are not enough: account-level ROAS and campaign ROAS are
    // different measurements, and if they carry the same number the reader
    // sees the page repeat itself and learns nothing from the second one.
    const domainInput = buildDemoDomainInput();
    const model = buildMarketingPerformanceViewModelForOffice({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
    });

    const seen = new Map<string, string>();
    for (const section of model.sections) {
      for (const metric of section.metrics) {
        const clash = seen.get(metric.value);
        expect(
          clash,
          `"${metric.value}" appears as both ${clash} and ${metric.key}`
        ).toBeUndefined();
        seen.set(metric.value, metric.key);
      }
    }
  });

  it("keeps the executive row free of duplicates", () => {
    const domainInput = buildDemoDomainInput();
    const model = buildMarketingPerformanceViewModelForOffice({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
    });
    const keys = model.executive.map((m) => m.key);
    expect(keys.length).toBe(new Set(keys).size);
  });
});

describe("filters preserve grounded results", () => {
  it("keeps every section grounded under every period filter", () => {
    const domainInput = buildDemoDomainInput({ now: new Date("2026-07-31T09:00:00.000Z") });
    const connected = new Set(
      domainInput.connections.filter((c) => c.status === "connected").map((c) => c.id)
    );

    for (const period of ["7d", "30d", "90d", "all"]) {
      const model = buildMarketingPerformanceViewModelForOffice({
        domainInput,
        peerName: "Emma",
        peerRole: "Marketing",
        searchParams: new URLSearchParams({ period }),
        now: new Date("2026-07-31T09:00:00.000Z"),
      });

      for (const section of model.sections) {
        for (const metric of section.metrics) {
          expect(metric.value.trim(), `${metric.key} emptied under ${period}`).not.toBe(
            ""
          );
          // A channel figure must still name a connected source.
          const def = officeMetricDef(metric.key)!;
          if (def.providers.length > 0) {
            const reporting = domainInput.connections.find(
              (c) => c.label === metric.sourceLabel || c.id === metric.sourceLabel
            );
            expect(
              reporting === undefined || connected.has(reporting.id),
              `${metric.key} survived a filter without a live source`
            ).toBe(true);
          }
        }
      }
    }
  });
});
