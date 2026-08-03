import { describe, expect, it, beforeEach } from "vitest";
import {
  buildCompanySnapshot,
  CompanySnapshotBuilder,
  winningSource,
  sourcePriorityRank,
  applyCorrectionToFieldValue,
  fieldFromValue,
  buildSimulatedWebsiteSnapshot,
  executeCompanyUnderstanding,
  executeWebsiteUnderstanding,
  buildPeergentCompanyProfile,
  clearDemoWebsiteSnapshots,
  buildAndStoreDemoWebsiteSnapshot,
  WEBSITE_CHANGE_AFFECTED_CAPABILITIES,
  resolveFreshness,
} from "@/lib/brain";
import type { CustomerCorrection } from "@/lib/brain/company/corrections";

describe("Project Brain Sprint 2 — Company & Website Intelligence", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
  });

  describe("Company Profile", () => {
    it("Peergent demo profile has customer-confirmed core fields", () => {
      const profile = buildPeergentCompanyProfile("en");
      expect(profile.companyName.value).toBe("Peergent");
      expect(profile.companyName.customerConfirmed).toBe(true);
      expect(profile.positioning.value).toContain("AI Workforce");
    });
  });

  describe("source priority", () => {
    it("ranks customer confirmed above website extracted", () => {
      expect(sourcePriorityRank("customer_confirmed")).toBeLessThan(
        sourcePriorityRank("website_extracted")
      );
      expect(winningSource("website_extracted", "customer_confirmed")).toBe("customer_confirmed");
    });
  });

  describe("customer corrections", () => {
    it("overrides inferred values", () => {
      const correction: CustomerCorrection = {
        id: "c1",
        organizationId: "org-1",
        fieldKey: "industry",
        action: "replace",
        correctedValue: "Professional services",
        correctedAt: "2026-08-01T00:00:00.000Z",
        correctedBy: "user-1",
        source: "customer_confirmed",
      };
      expect(applyCorrectionToFieldValue("Healthcare", correction)).toBe("Professional services");
    });
  });

  describe("freshness", () => {
    it("marks stale and expired states", () => {
      const now = Date.parse("2026-08-10T00:00:00.000Z");
      expect(resolveFreshness("2026-08-08T12:00:00.000Z", 86400000, now)).toBe("stale");
      expect(resolveFreshness("2026-07-01T00:00:00.000Z", 86400000, now)).toBe("expired");
    });
  });

  describe("Website Snapshot", () => {
    it("builds simulated snapshot with structured findings", () => {
      const snapshot = buildSimulatedWebsiteSnapshot({
        organizationId: "org-1",
        url: "https://example.com",
        companyName: "Example Co",
      });
      expect(snapshot.state).toBe("demo_simulated");
      expect(snapshot.findings.some((f) => f.kind === "strong_hero")).toBe(true);
      expect(snapshot.findings.every((f) => f.evidence.length > 0)).toBe(true);
    });

    it("stores demo website snapshot on URL add flow", async () => {
      const snapshot = await buildAndStoreDemoWebsiteSnapshot({
        url: "https://peergent.com",
        companyName: "Peergent",
      });
      expect(snapshot.source.method).toBe("demo_simulated");
    });
  });

  describe("Company Snapshot builder", () => {
    it("assembles immutable company snapshot from profile and website", () => {
      const profile = buildPeergentCompanyProfile("en");
      const website = buildSimulatedWebsiteSnapshot({
        organizationId: profile.organizationId,
        url: "https://peergent.com",
      });
      const { snapshot, readiness } = buildCompanySnapshot({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteSnapshot: website,
      });
      expect(readiness).toBe("ready");
      expect(snapshot.knownFacts.length).toBeGreaterThan(0);
      expect(snapshot.profile.companyName.value).toBe("Peergent");
    });

    it("reports unknown when no company data exists", () => {
      const builder = new CompanySnapshotBuilder();
      const { readiness } = builder.build({
        organizationId: "org-empty",
      });
      expect(readiness).toBe("unknown");
    });
  });

  describe("company_understanding capability", () => {
    it("returns deterministic findings from company snapshot", () => {
      const profile = buildPeergentCompanyProfile("en");
      const { snapshot } = buildCompanySnapshot({
        organizationId: profile.organizationId,
        companyProfile: profile,
      });
      const output = executeCompanyUnderstanding({ companySnapshot: snapshot, locale: "en" });
      expect(output.findings.some((f) => f.label === "Company name")).toBe(true);
      expect(output.findings[0]?.provenance.length).toBeGreaterThan(0);
    });

    it("honestly reports unknown without inventing facts", () => {
      const { snapshot } = buildCompanySnapshot({ organizationId: "org-empty" });
      const output = executeCompanyUnderstanding({ companySnapshot: snapshot, locale: "en" });
      expect(output.findings).toHaveLength(0);
      expect(output.warnings[0]?.code).toBe("insufficient_company_context");
    });
  });

  describe("website_understanding capability", () => {
    it("maps website findings to brain output", () => {
      const profile = buildPeergentCompanyProfile("en");
      const website = buildSimulatedWebsiteSnapshot({
        organizationId: profile.organizationId,
        url: "https://peergent.com",
      });
      const { snapshot } = buildCompanySnapshot({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteSnapshot: website,
      });
      const output = executeWebsiteUnderstanding({ companySnapshot: snapshot, websiteSnapshot: website });
      expect(output.findings.length).toBeGreaterThan(0);
    });
  });

  describe("cache invalidation triggers", () => {
    it("lists capabilities affected by website changes", () => {
      expect(WEBSITE_CHANGE_AFFECTED_CAPABILITIES).toContain("website_understanding");
      expect(WEBSITE_CHANGE_AFFECTED_CAPABILITIES).toContain("company_understanding");
    });
  });

  describe("unknown handling via corrections merge", () => {
    it("applies customer confirmed audience override", () => {
      const profile = buildPeergentCompanyProfile("en");
      profile.targetAudiences = fieldFromValue(["Healthcare"], "website_extracted", {
        confidence: "medium",
      });
      const correction: CustomerCorrection = {
        id: "c-audience",
        organizationId: profile.organizationId,
        fieldKey: "targetAudiences",
        action: "replace",
        correctedValue: null,
        correctedListValue: ["SMB executives"],
        correctedAt: "2026-08-01T00:00:00.000Z",
        correctedBy: "user-1",
        source: "customer_confirmed",
      };
      const { snapshot } = buildCompanySnapshot({
        organizationId: profile.organizationId,
        companyProfile: profile,
        corrections: [correction],
      });
      expect(snapshot.profile.targetAudiences.source).toBe("customer_confirmed");
    });
  });
});
