import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import {
  MW_APPROVALS_MAX,
  MW_CAMPAIGNS_MAX,
  MW_INSIGHTS_MAX,
  MW_KPIS_MAX,
  MW_RESULTS_MAX,
  buildMarketingWorkspaceBands,
  marketingWorkspaceBandsContainForbiddenTerms,
} from "@/lib/office/workspace/build-marketing-workspace-bands";

describe("buildMarketingWorkspaceBands", () => {
  it("builds a business-first marketing operating system for demo", () => {
    const domainInput = buildDemoDomainInput({ locale: "nl" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
      isDemo: true,
    });

    expect(bands.overview.summary.length).toBeGreaterThan(0);
    expect(bands.overview.summary.toLowerCase()).not.toContain("emma");
    expect(bands.kpis.items.length).toBeGreaterThan(0);
    expect(bands.kpis.items.length).toBeLessThanOrEqual(MW_KPIS_MAX);
    expect(bands.performance?.metrics.length).toBeGreaterThan(1);
    expect(bands.insights?.items.length).toBeLessThanOrEqual(MW_INSIGHTS_MAX);
    expect(bands.campaigns?.items.length).toBeGreaterThan(0);
    expect(bands.campaigns!.items.length).toBeLessThanOrEqual(MW_CAMPAIGNS_MAX);
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

  it("includes performance chart metrics with switchable ids", () => {
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
    expect(bands.performance?.defaultMetricId).toBe("revenue");
  });

  it("limits recent results", () => {
    const domainInput = buildDemoDomainInput({ locale: "nl" });
    const bands = buildMarketingWorkspaceBands({
      domainInput,
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
      isDemo: true,
    });

    if (bands.results) {
      expect(bands.results.items.length).toBeLessThanOrEqual(MW_RESULTS_MAX);
    }
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
