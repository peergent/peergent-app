import { describe, expect, it } from "vitest";
import {
  buildProviderPerformanceCards,
  curateExecutiveMetrics,
} from "@/lib/office/performance/provider-cards";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import type { PerformanceSectionMetric } from "@/lib/office/performance/sections";

describe("executive KPI curation", () => {
  it("orders revenue, reach, leads when available", () => {
    const metrics: PerformanceSectionMetric[] = [
      {
        key: "leads",
        label: "Leads",
        value: "12",
        kind: "outcome",
        upIsGood: true,
        sourceLabel: "HubSpot",
        methodology: "",
        delta: null,
        priority: 3,
      },
      {
        key: "attributed_revenue",
        label: "Beïnvloede omzet",
        value: "€4.200",
        kind: "outcome",
        upIsGood: true,
        sourceLabel: "HubSpot",
        methodology: "",
        delta: null,
        priority: 1,
      },
      {
        key: "reach",
        label: "Bereik",
        value: "9.800",
        kind: "outcome",
        upIsGood: true,
        sourceLabel: "LinkedIn",
        methodology: "",
        delta: null,
        priority: 2,
      },
      {
        key: "attributed_leads",
        label: "Toegeschreven leads",
        value: "4",
        kind: "outcome",
        upIsGood: true,
        sourceLabel: "HubSpot",
        methodology: "",
        delta: null,
        priority: 4,
      },
    ];

    const executive = curateExecutiveMetrics(metrics);
    expect(executive.map((m) => m.key)).toEqual([
      "attributed_revenue",
      "reach",
      "leads",
    ]);
  });
});

describe("provider performance cards", () => {
  it("builds LinkedIn and Google Ads as separate cards for demo", () => {
    const domainInput = buildDemoDomainInput();
    const cards = buildProviderPerformanceCards({
      peerId: "demo",
      locale: "nl",
      domainInput,
    });

    const linkedin = cards.find((card) => card.id === "linkedin");
    const googleAds = cards.find((card) => card.id === "google_ads");
    const ga4 = cards.find((card) => card.id === "ga4");

    expect(linkedin?.title).toBe("LinkedIn");
    expect(googleAds?.title).toBe("Google Ads");
    expect(ga4?.title).toBe("Google Analytics");
    expect(linkedin?.detailHref).toContain("/performance/linkedin");
    expect(googleAds?.detailHref).toContain("/performance/google-ads");
  });
});
