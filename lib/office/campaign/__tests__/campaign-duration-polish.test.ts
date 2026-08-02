import { beforeEach, describe, expect, it } from "vitest";
import {
  buildDurationAtCreation,
  campaignResultsHref,
  durationDaysForPreset,
  formatRunningStatus,
  resolveCampaignDuration,
} from "@/lib/office/campaign/campaign-duration";
import { buildCampaignContextFromCreateInput } from "@/lib/office/campaign/campaign-context";
import { buildCampaignResultsViewModel } from "@/lib/office/campaign/build-campaign-results";
import { buildDeskCampaignOverview } from "@/lib/office/desk/build-desk-campaign-overview";
import {
  approveAllDemoDrafts,
  createDemoCampaign,
  getDemoCampaignSnapshot,
  publishDemoCampaign,
  resetDemoCampaignStore,
  scheduleDemoCampaign,
  setDemoStepApproval,
} from "@/lib/office/demo/demo-campaign-store";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { mergeDemoCampaignSnapshot } from "@/lib/office/demo/merge-demo-domain";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";

describe("campaign duration polish", () => {
  const input = {
    peerId: "demo" as const,
    ownerLabel: "Emma",
    name: "Peergent",
    goalLabel: "Demo-aanvragen",
    description: "Meer demo-aanvragen bij ondernemers met digitale AI-collega's.",
    primaryGoalId: "generate_leads" as const,
    targetAudience: "Ondernemers met 1–20 medewerkers",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
    durationPreset: "1_month" as const,
    startDate: "2026-08-02",
    endDate: "2026-09-01",
  };

  beforeEach(() => resetDemoCampaignStore());

  it("stores duration preset on campaign context at creation", () => {
    const project = createMarketingCampaignProject(input);
    const ctx = buildCampaignContextFromCreateInput(project, input, "nl");
    expect(ctx.durationPreset).toBe("1_month");
    expect(ctx.startDate).toBe("2026-08-02");
    expect(ctx.endDate).toBe("2026-09-01");
    expect(ctx.durationDays).toBe(30);
  });

  it("derives running day counts from published start without hardcoded 30-day fallback", () => {
    const duration = resolveCampaignDuration({
      preset: "2_weeks",
      startDate: "2026-08-02",
      endDate: "2026-08-16",
      durationDays: 14,
      publishedAt: "2026-08-02T10:00:00.000Z",
      now: new Date("2026-08-03T12:00:00.000Z"),
    });
    expect(duration?.durationDays).toBe(14);
    expect(duration?.currentDay).toBe(2);
    expect(duration?.remainingDays).toBe(13);
  });

  it("results view uses stored duration instead of a fixed window", () => {
    const results = buildCampaignResultsViewModel({
      channels: ["google_ads", "linkedin"],
      locale: "nl",
      isPublished: true,
      publishedAt: "2026-08-02T10:00:00.000Z",
      durationPreset: "2_weeks",
      startDate: "2026-08-02",
      endDate: "2026-08-16",
      durationDays: 14,
    });
    expect(results.totalDays).toBe(14);
    expect(results.emmaMonitoringIntro.toLowerCase()).toContain("google ads");
  });

  it("desk live campaigns link directly to results view", () => {
    const project = createDemoCampaign("demo", input, "nl");
    setDemoStepApproval("demo", project.id, "strategy_determined", "approved");
    setDemoStepApproval("demo", project.id, "channels_selected", "approved");
    const domainBefore = mergeDemoCampaignSnapshot(
      buildDemoDomainInput({ locale: "nl" }),
      getDemoCampaignSnapshot()
    );
    const pending = domainBefore.drafts.filter((d) => d.status === "ready_for_review");
    approveAllDemoDrafts(
      "demo",
      pending.map((d) => d.id),
      "Jij"
    );
    scheduleDemoCampaign("demo", project.id);
    publishDemoCampaign("demo", project.id);

    const domain = mergeDemoCampaignSnapshot(buildDemoDomainInput({ locale: "nl" }), getDemoCampaignSnapshot());
    const overview = buildDeskCampaignOverview({ domainInput: domain, locale: "nl", isDemo: true });
    const live = overview.live.find((row) => row.id === project.id);
    expect(live?.href).toBe(campaignResultsHref("demo", project.id));
    expect(live?.quickActionLabel).toBe("Bekijk resultaten");
    expect(live?.runningStatusLabel).toMatch(/Dag \d+ van 30/);
  });

  it("duration presets map to expected day counts", () => {
    expect(durationDaysForPreset("2_weeks")).toBe(14);
    expect(durationDaysForPreset("1_month")).toBe(30);
    expect(durationDaysForPreset("3_months")).toBe(90);
    expect(durationDaysForPreset("ongoing")).toBeNull();
    const created = buildDurationAtCreation("2_weeks", new Date("2026-08-02T00:00:00.000Z"));
    expect(created.endDate).toBe("2026-08-16");
    expect(formatRunningStatus(
      resolveCampaignDuration({
        preset: "2_weeks",
        startDate: created.startDate,
        endDate: created.endDate,
        durationDays: 14,
        publishedAt: "2026-08-02T10:00:00.000Z",
        now: new Date("2026-08-03T00:00:00.000Z"),
      })!,
      "nl"
    )).toContain("Dag 2 van 14");
  });
});
