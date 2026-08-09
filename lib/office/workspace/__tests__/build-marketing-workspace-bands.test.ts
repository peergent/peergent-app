import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  MW_APPROVALS_MAX,
  MW_CAMPAIGNS_MAX,
  MW_KPIS_MAX,
  buildMarketingWorkspaceBands,
  marketingWorkspaceBandsContainForbiddenTerms,
} from "@/lib/office/workspace/build-marketing-workspace-bands";

describe("buildMarketingWorkspaceBands", () => {
  it("builds PX-28 marketing operating system rows for demo", () => {
    const domainInput = buildDemoDomainInput({ locale: "nl" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
      isDemo: true,
    });

    expect(bands.overview.parts.length).toBeGreaterThan(0);
    expect(bands.overview.parts.map((p) => p.text).join(" ").toLowerCase()).not.toContain("emma");
    expect(bands.kpis.items).toHaveLength(MW_KPIS_MAX);
    expect(bands.kpis.items[0]?.hero).toBe(true);
    expect(bands.performance?.metrics.length).toBeGreaterThan(1);
    expect(bands.performance?.metrics[0]?.bullets.length).toBeGreaterThan(0);
    expect(bands.businessIntelligence?.title.length).toBeGreaterThan(0);
    expect(bands.campaigns?.items.length).toBeGreaterThan(0);
    expect(bands.campaigns!.items[0]?.previewHeadline).toBeTruthy();
    expect(bands.campaigns!.items.length).toBeLessThanOrEqual(MW_CAMPAIGNS_MAX);
    expect(bands.campaigns!.items[0]?.progressPercent).not.toBeNull();
    expect(bands.content?.items.length).toBeGreaterThan(0);
  });

  it("caps approvals at three and defers recommendation when approvals exist", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    if (bands.approvals) {
      expect(bands.approvals.items.length).toBeLessThanOrEqual(MW_APPROVALS_MAX);
      expect(bands.recommendation).toBeNull();
    }
  });

  it("includes performance chart metrics with switchable ids including spend", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    const ids = bands.performance?.metrics.map((m) => m.id) ?? [];
    expect(ids).toContain("revenue");
    expect(ids).toContain("roas");
    expect(ids).toContain("spend");
    expect(ids).toContain("cpc");
    expect(bands.performance?.defaultMetricId).toBe("revenue");
  });

  it("builds rich activity events for demo", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    expect(bands.activity?.items[0]?.title.length).toBeGreaterThan(0);
    expect(bands.activity?.items[0]?.subtitle.length).toBeGreaterThan(0);
    expect(bands.activity?.items[0]?.tone).toBeTruthy();
  });

  it("uses customer-friendly content section title", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    expect(bands.content?.title.toLowerCase()).toContain("publish");
  });

  it("never surfaces workflow vocabulary", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    expect(marketingWorkspaceBandsContainForbiddenTerms(bands)).toBe(false);
  });

  it("omits approvals band when nothing is waiting", () => {
    const domainInput = buildDemoDomainInput({
      locale: "en",
      now: new Date("2026-01-15T10:00:00.000Z"),
    });

    const emptyDrafts = {
      ...domainInput,
      drafts: [],
      workUnits: domainInput.workUnits.map((unit) => ({
        ...unit,
        status: "published" as const,
      })),
    };

    const bands = buildMarketingWorkspaceBands({
      domainInput: emptyDrafts,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "en",
      isDemo: true,
    });

    expect(bands.approvals).toBeNull();
  });
});
