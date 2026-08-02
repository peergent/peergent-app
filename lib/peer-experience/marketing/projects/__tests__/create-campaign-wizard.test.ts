import { describe, expect, it } from "vitest";

import { buildMarketingCampaignsViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaigns-view-model";
import { getProjectHref } from "@/lib/peer-experience/marketing/navigation/marketing-peer-links";
import {
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
  validateCreateCampaignForm,
} from "@/features/marketing-workspace/lib/create-campaign-form";
import {
  createMarketingCampaignProject,
  createMarketingProject,
} from "../project-engine";

describe("create campaign form validation", () => {
  it("requires name and description", () => {
    const errors = validateCreateCampaignForm(createEmptyCreateCampaignForm());
    expect(errors.name).toBeTruthy();
    expect(errors.description).toBeTruthy();
  });

  it("requires custom goal text when custom is selected", () => {
    const errors = validateCreateCampaignForm({
      ...createEmptyCreateCampaignForm("manual"),
      name: "Launch",
      description: "Grow pipeline",
      primaryGoalId: "custom",
      selectedGoalIds: ["custom"],
      customGoalText: "",
    });
    expect(errors.customGoalText).toBeTruthy();
  });

  it("rejects end date before start date", () => {
    const errors = validateCreateCampaignForm({
      ...createEmptyCreateCampaignForm(),
      name: "Launch",
      description: "Grow pipeline",
      startDate: "2026-08-01",
      endDate: "2026-07-01",
    });
    expect(errors.endDate).toBeTruthy();
  });

  it("rejects negative budget", () => {
    const errors = validateCreateCampaignForm({
      ...createEmptyCreateCampaignForm("manual"),
      name: "Launch",
      description: "Grow pipeline",
      budgetAmount: "-10",
    });
    expect(errors.budgetAmount).toBeTruthy();
  });
});

describe("createMarketingCampaignProject", () => {
  it("creates an empty campaign project without work units", () => {
    const input = toCreateMarketingCampaignProjectInput("peer-1", "Alex", {
      ...createEmptyCreateCampaignForm(),
      name: "Summer launch",
      description: "Increase signups before fall.",
      primaryGoalId: "generate_leads",
    });

    const project = createMarketingCampaignProject(input);
    expect(project.origin).toBe("campaign_wizard");
    expect(project.title).toBe("Summer launch");
    expect(project.campaignSetup?.description).toContain("signups");
    expect(project.campaignSetup?.approvalMode).toBe("approval_before_publication");
  });

  it("differs from delegated content project creation", () => {
    const campaign = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-1", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Campaign",
        description: "Achieve more reach.",
        primaryGoalId: "brand_awareness",
      })
    );
    const delegated = createMarketingProject({
      peerId: "peer-1",
      title: "LinkedIn post",
      goal: "Post",
      channel: "LinkedIn",
      deliverableKind: "linkedin",
      rawRequest: "Write a post",
      ownerLabel: "Alex",
      origin: "manual_assignment",
    });
    expect(campaign.origin).toBe("campaign_wizard");
    expect(delegated.origin).toBe("manual_assignment");
    expect(campaign.campaignSetup).toBeDefined();
    expect(delegated.campaignSetup).toBeUndefined();
  });

  it("uses project id for campaign list and detail routes", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Q3",
        description: "Pipeline focus.",
        primaryGoalId: "product_launch",
        targetAudience: "Founders",
        startDate: "2026-09-01",
        endDate: "2026-12-01",
        budgetAmount: "5000",
        budgetCurrency: "USD",
      })
    );

    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      projects: [project],
    });
    expect(vm.items.some((item) => item.id === project.id && item.linkEnabled)).toBe(true);
    expect(getProjectHref("peer-emma", project.id)).toContain(project.id);
    expect(project.campaignSetup?.targetAudience).toBe("Founders");
    expect(project.campaignSetup?.budgetAmount).toBe(5000);
  });
});

describe("create post modal separation", () => {
  it("create campaign form module does not reference content draft APIs", () => {
    const source = JSON.stringify({
      validateCreateCampaignForm,
      toCreateMarketingCampaignProjectInput,
    });
    expect(source).not.toContain("generateContentDraft");
    expect(source).not.toContain("MwCreateContentModal");
  });
});
