import { describe, expect, it } from "vitest";
import {
  buildCampaignContextFromCreateInput,
  containsInstallerLeak,
  INSTALLER_LEAK_TERMS,
} from "@/lib/office/campaign/campaign-context";
import { generateSimulatedCopy } from "@/lib/office/campaign/generate-campaign-simulation";
import { simulateDemoCampaignWorkflow } from "@/lib/office/demo/demo-workflow-simulation";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import { buildCampaignStepEvidence } from "@/lib/office/campaign/build-campaign-workflow-evidence";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";

describe("CampaignContext isolation", () => {
  const peergentInput = {
    peerId: "demo" as const,
    ownerLabel: "Emma",
    name: "Peergent",
    goalLabel: "Demo-aanvragen",
    description:
      "Meer demo-aanvragen bij ondernemers met 1–20 medewerkers die tijd willen besparen met AI-collega's.",
    primaryGoalId: "generate_leads",
    targetAudience: "Ondernemers met 1 tot 20 werknemers",
    setupMode: "automatic" as const,
    approvalMode: "approval_before_publication" as const,
  };

  it("generates copy from user input without installer leakage", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const ctx = buildCampaignContextFromCreateInput(project, peergentInput, "nl");
    const copy = generateSimulatedCopy(ctx);
    const bundle = simulateDemoCampaignWorkflow(project, peergentInput, "nl");

    const allText = [
      copy.objective,
      copy.linkedinBody,
      copy.emailBody,
      copy.adsBody,
      copy.landingBody,
      ...bundle.drafts.map((d) => `${d.title} ${d.body}`),
    ].join(" ");

    for (const term of INSTALLER_LEAK_TERMS) {
      expect(allText.toLowerCase()).not.toContain(term.toLowerCase());
    }

    expect(allText.toLowerCase()).toContain("peergent");
    expect(allText.toLowerCase()).toContain("ondernemers");
  });

  it("does not pre-approve website when missing", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const bundle = simulateDemoCampaignWorkflow(project, peergentInput, "nl");

    expect(bundle.campaignContext.websiteState).toBe("missing");
    expect(bundle.stepApprovals.website_analyzed).toBeUndefined();
    expect(bundle.stepApprovals.business_analyzed).toBe("approved");
  });

  it("returns null website evidence when website missing", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const domain = buildDemoDomainInput({ locale: "nl" });
    const evidence = buildCampaignStepEvidence({
      stepId: "website_analyzed",
      project,
      domainInput: domain,
      locale: "nl",
    });
    expect(evidence).toBeNull();
  });

  it("returns null competitor evidence when competitor context missing", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const domain = buildDemoDomainInput({ locale: "nl" });
    const evidence = buildCampaignStepEvidence({
      stepId: "competitors_analyzed",
      project,
      domainInput: domain,
      locale: "nl",
    });
    expect(evidence).toBeNull();
  });

  it("strategy evidence references campaign audience not installers", () => {
    const project = createMarketingCampaignProject(peergentInput);
    const domain = buildDemoDomainInput({ locale: "nl" });
    const evidence = buildCampaignStepEvidence({
      stepId: "strategy_determined",
      project,
      domainInput: {
        ...domain,
        demoCampaignContexts: {
          [project.id]: buildCampaignContextFromCreateInput(project, peergentInput, "nl"),
        },
      },
      locale: "nl",
    });
    const text = evidence?.sections.flatMap((s) => s.items).join(" ") ?? "";
    expect(containsInstallerLeak(text)).toBe(false);
    expect(text).toContain("Ondernemers");
  });
});
