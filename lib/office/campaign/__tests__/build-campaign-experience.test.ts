import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildCampaignDetailViewModel } from "@/lib/office/campaign/build-campaign-detail";
import { buildCampaignExperienceModel } from "@/lib/office/campaign/build-campaign-experience";

describe("buildCampaignExperienceModel", () => {
  it("builds PX-30 campaign experience sections from demo campaign", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const detail = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: "camp-heatpump",
      domainInput,
      locale: "en",
      isDemo: true,
    });

    expect(detail).not.toBeNull();
    const experience = buildCampaignExperienceModel(detail!, { locale: "en" });

    expect(experience.header.title.length).toBeGreaterThan(0);
    expect(experience.brief.narrative.length).toBeGreaterThan(40);
    expect(experience.brief.sections.executiveSummary.length).toBeGreaterThan(10);
    expect(experience.progress.percent).toBeGreaterThan(0);
    expect(experience.progress.steps.length).toBe(8);
    expect(experience.brainTimeline.length).toBe(8);
    expect(experience.backHref).toBe("/office/demo");
  });

  it("omits performance when campaign is not published with data", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const detail = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: "camp-heatpump",
      domainInput,
      locale: "en",
      isDemo: true,
    });

    const experience = buildCampaignExperienceModel(detail!, { locale: "en" });
    expect(experience.performance).toBeNull();
  });

  it("never surfaces workflow vocabulary in customer copy", () => {
    const domainInput = buildDemoDomainInput({ locale: "en" });
    const detail = buildCampaignDetailViewModel({
      peerId: "demo",
      projectId: "camp-heatpump",
      domainInput,
      locale: "en",
      isDemo: true,
    });

    const experience = buildCampaignExperienceModel(detail!, { locale: "en" });
    const corpus = [
      experience.brief.narrative,
      ...experience.progress.steps.flatMap((s) =>
        s.expansion
          ? [
              s.expansion.whatHappened,
              s.expansion.whyItHappened,
              s.expansion.businessImpact,
              s.expansion.decisionTaken ?? "",
            ]
          : []
      ),
      ...experience.activity.map((a) => a.message),
    ].join(" ");

    expect(corpus.toLowerCase()).not.toMatch(/\blanggraph\b|\bprompt\b|\bworkflow node\b/);
  });
});
