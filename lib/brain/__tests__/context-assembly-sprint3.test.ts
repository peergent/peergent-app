import { describe, expect, it, beforeEach } from "vitest";
import {
  assembleCompanyContextSync,
  assembleCompanyContext,
  buildReadinessReport,
  detectMissingInformation,
  formatMissingInformationMessage,
  buildSnapshotVersionMetadata,
  bumpSnapshotVersion,
  resolveInvalidationCascade,
  invalidationForCorrection,
  createInvalidationEvent,
  CONTEXT_HASH_SLICES,
  buildDemoWebsiteSnapshotSync,
  createDemoWebsiteProvider,
  createDemoWebsiteScanExecutor,
  buildPeergentCompanyProfile,
  clearDemoWebsiteSnapshots,
} from "@/lib/brain";
import type { CustomerCorrection } from "@/lib/brain/company/corrections";
import { createAssemblyAuditTrace } from "@/lib/brain/context/assembly-audit";
import { emptyCompanyProfile } from "@/lib/brain/company/profile";

describe("Project Brain Sprint 3 — Context Assembly", () => {
  beforeEach(() => {
    clearDemoWebsiteSnapshots();
  });

  describe("CompanyContextAssembler", () => {
    it("assembles company and brain snapshots from profile and website", () => {
      const profile = buildPeergentCompanyProfile("en");
      const website = buildDemoWebsiteSnapshotSync({
        organizationId: profile.organizationId,
        url: "https://peergent.com",
        companyName: "Peergent",
      });

      const result = assembleCompanyContextSync({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteSnapshot: website,
      });

      expect(result.companySnapshot.profile.companyName.value).toBe("Peergent");
      expect(result.brainSnapshot.organization.refId).toBe(profile.organizationId);
      expect(result.audit.sourcesUsed.some((s) => s.source === "company_profile")).toBe(true);
      expect(result.audit.sourcesUsed.some((s) => s.source === "website_snapshot")).toBe(true);
      expect(result.version.sourceHash).toBeTruthy();
      expect(result.version.contextHash).toBeTruthy();
    });

    it("resolves website via provider in async assembly", async () => {
      const profile = buildPeergentCompanyProfile("en");
      const result = await assembleCompanyContext({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteUrl: "https://peergent.com",
        websiteProvider: createDemoWebsiteProvider(),
      });

      expect(result.companySnapshot.website?.pages.length).toBeGreaterThanOrEqual(4);
      expect(result.companySnapshot.website?.pages.some((p) => p.path === "/about")).toBe(true);
    });

    it("reports needs_information when no sources exist", () => {
      const result = assembleCompanyContextSync({ organizationId: "org-empty" });
      expect(result.state).toBe("needs_information");
      expect(result.missingInformation.length).toBeGreaterThan(0);
    });
  });

  describe("readiness scoring", () => {
    it("scores Peergent demo profile as ready or partial", () => {
      const profile = buildPeergentCompanyProfile("en");
      const website = buildDemoWebsiteSnapshotSync({
        organizationId: profile.organizationId,
        url: "https://peergent.com",
      });
      const report = buildReadinessReport({
        profile,
        website,
        brandAvailable: false,
        businessAvailable: false,
        correctionsApplied: 0,
      });
      expect(report.scores.every((s) => s.score >= 0 && s.score <= 100)).toBe(true);
      expect(["ready", "partial"]).toContain(report.overall);
    });

    it("never fakes readiness for empty org", () => {
      const report = buildReadinessReport({
        profile: emptyCompanyProfile("org-empty"),
        website: null,
        brandAvailable: false,
        businessAvailable: false,
        correctionsApplied: 0,
      });
      expect(report.overall).toBe("unknown");
      expect(report.overallScore).toBeLessThan(35);
    });
  });

  describe("missing information", () => {
    it("detects critical gaps honestly", () => {
      const profile = buildPeergentCompanyProfile("en");
      profile.targetAudiences = {
        value: [],
        source: "unknown",
        customerConfirmed: false,
        confidence: "low",
      };
      const items = detectMissingInformation({ profile, website: null });
      expect(items.some((i) => i.id === "missing-audience")).toBe(true);
      expect(items.some((i) => i.id === "missing-website")).toBe(true);
      items.forEach((item) => {
        expect(item.priority).toBeTruthy();
        expect(item.recommendedAction).toBeTruthy();
        expect(item.customerImpact).toBeTruthy();
      });
    });

    it('formats "I still need..." message', () => {
      const profile = buildPeergentCompanyProfile("en");
      profile.targetAudiences = {
        value: [],
        source: "unknown",
        customerConfirmed: false,
        confidence: "low",
      };
      const items = detectMissingInformation({ profile, website: null });
      const msg = formatMissingInformationMessage(items, false);
      expect(msg).toMatch(/^I still need:/);
    });
  });

  describe("dependency invalidation", () => {
    it("cascades website changes to company snapshot and strategy", () => {
      const affected = resolveInvalidationCascade("website_snapshot");
      expect(affected).toContain("company_snapshot");
      expect(affected).toContain("brain_snapshot");
      expect(affected).toContain("strategy");
      expect(affected).toContain("campaign_suggestions");
    });

    it("maps correction fields to invalidation nodes", () => {
      const affected = invalidationForCorrection("website");
      expect(affected).toContain("website_snapshot");
      expect(affected).toContain("company_snapshot");
    });

    it("creates invalidation events with timestamps", () => {
      const event = createInvalidationEvent({
        organizationId: "org-1",
        trigger: "company_profile",
        reason: "Profile updated",
      });
      expect(event.affected.length).toBeGreaterThan(0);
      expect(event.occurredAt).toBeTruthy();
    });
  });

  describe("snapshot versioning", () => {
    it("builds source and context hashes", () => {
      const version = buildSnapshotVersionMetadata({
        sourceKeys: ["org-1", "https://peergent.com"],
        contextKeys: [...CONTEXT_HASH_SLICES],
        createdAt: "2026-08-01T00:00:00.000Z",
      });
      expect(version.version).toBe(1);
      expect(version.sourceHash).not.toBe(version.contextHash);
    });

    it("bumps version when hashes change", () => {
      const v1 = buildSnapshotVersionMetadata({
        sourceKeys: ["a"],
        contextKeys: ["website"],
        createdAt: "2026-08-01T00:00:00.000Z",
      });
      const v2 = bumpSnapshotVersion(v1, ["b"], ["website"], "2026-08-02T00:00:00.000Z");
      expect(v2.version).toBe(2);
    });
  });

  describe("corrections", () => {
    it("applies replace and remove actions", () => {
      const replace: CustomerCorrection = {
        id: "c1",
        organizationId: "org-1",
        fieldKey: "industry",
        action: "replace",
        correctedValue: "SaaS",
        correctedAt: "2026-08-01T00:00:00.000Z",
        correctedBy: "user-1",
        source: "customer_confirmed",
      };
      const remove: CustomerCorrection = {
        ...replace,
        id: "c2",
        action: "remove",
        correctedValue: null,
      };
      const result = assembleCompanyContextSync({
        organizationId: "org-1",
        companyProfile: buildPeergentCompanyProfile("en"),
        corrections: [replace],
      });
      expect(result.audit.correctionsApplied).toHaveLength(1);
      expect(result.audit.warnings.some((w) => w.includes("Invalidates"))).toBe(true);

      const removed = assembleCompanyContextSync({
        organizationId: "org-1",
        companyProfile: buildPeergentCompanyProfile("en"),
        corrections: [remove],
      });
      expect(removed.audit.correctionsApplied[0]?.action).toBe("remove");
    });
  });

  describe("assembly audit", () => {
    it("records sources used and unknowns without chain-of-thought", () => {
      const trace = createAssemblyAuditTrace({
        organizationId: "org-1",
        assembledAt: "2026-08-01T00:00:00.000Z",
      });
      trace.sourcesUsed = [{ source: "company_profile", refId: "org-1", action: "used" }];
      trace.unknowns = ["industry"];
      expect(trace.sourcesUsed).toHaveLength(1);
      expect(trace.unknowns).toContain("industry");
      expect(Object.keys(trace)).not.toContain("reasoning");
    });
  });

  describe("demo website provider", () => {
    it("generates deterministic multi-page snapshot", () => {
      const a = buildDemoWebsiteSnapshotSync({
        organizationId: "org-1",
        url: "https://example.com",
        companyName: "Example",
      });
      const b = buildDemoWebsiteSnapshotSync({
        organizationId: "org-1",
        url: "https://example.com",
        companyName: "Example",
      });
      expect(a.pages.map((p) => p.path)).toEqual(b.pages.map((p) => p.path));
      expect(a.pages).toHaveLength(4);
      expect(a.navigation?.primaryLinks.length).toBeGreaterThan(0);
      expect(a.seo?.titleTag).toContain("Example");
      expect(a.technology?.detected.length).toBeGreaterThan(0);
    });

    it("runs demo scan executor pipeline without fetch", async () => {
      const executor = createDemoWebsiteScanExecutor();
      const snapshot = await executor.runToSnapshot({
        organizationId: "org-1",
        url: "https://example.com",
        requestedBy: "test",
      });
      expect(snapshot.state).toBe("demo_simulated");
    });
  });

  describe("campaign integration", () => {
    it("brain snapshot references company snapshot from assembly", () => {
      const profile = buildPeergentCompanyProfile("en");
      const result = assembleCompanyContextSync({
        organizationId: profile.organizationId,
        companyProfile: profile,
        websiteSnapshot: buildDemoWebsiteSnapshotSync({
          organizationId: profile.organizationId,
          url: "https://peergent.com",
        }),
      });
      expect(result.brainSnapshot.knownFacts.length).toBeGreaterThan(0);
      expect(result.brainSnapshot.organization.refId).toBe(profile.organizationId);
    });
  });
});
