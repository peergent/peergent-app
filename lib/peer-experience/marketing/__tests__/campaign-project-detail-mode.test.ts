import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  shouldRenderCampaignCardNextActionAsLink,
  presentMarketingCampaignCard,
} from "@/features/marketing-workspace/lib/marketing-campaign-card-presenter";
import {
  buildMarketingCampaignsViewModel,
} from "@/lib/peer-experience/marketing/view-models/build-marketing-campaigns-view-model";
import {
  campaignWizardDetailBackLabel,
  isCampaignWizardProject,
  shouldRenderCampaignWizardDetailView,
} from "@/lib/peer-experience/marketing/projects/campaign-project-detail-mode";
import { buildMarketingCampaignDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-campaign-detail-view-model";
import { buildMarketingCampaignDetailSourceFromDomainInput } from "@/lib/peer-experience/marketing/view-models/build-project-campaign-projection";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const repoRoot = join(process.cwd());
const read = (relativePath: string) =>
  readFileSync(join(repoRoot, relativePath), "utf8");

const assembledAt = "2026-07-20T12:00:00.000Z";

const baseDomainInput = {
  peerId: "peer-emma",
  peerName: "Emma",
  userName: "Alex",
  campaignTitle: "Campaign",
  generating: null,
  generatingActivity: null,
  understanding: null,
  strategy: null,
  plan: null,
  drafts: [],
  publicationPackages: [],
  activityFeed: [],
  workUnits: [],
  projects: [],
  responsibilities: [],
  automations: [],
  connections: [],
} satisfies MarketingPeerDomainInput;

function wizardProject(id: string) {
  return {
    id,
    peerId: "peer-emma",
    title: "Wizard launch",
    goal: "Grow signups",
    campaignType: "product_launch" as const,
    createdAt: assembledAt,
    updatedAt: assembledAt,
    ownerLabel: "Alex",
    rawRequest: "Launch",
    origin: "campaign_wizard" as const,
  };
}

describe("campaign card nested anchor policy", () => {
  it("uses non-link next action when the card is the primary link", () => {
    expect(shouldRenderCampaignCardNextActionAsLink(true)).toBe(false);
    expect(shouldRenderCampaignCardNextActionAsLink(false)).toBe(true);
  });

  it("keeps next-action label on linked cards", () => {
    const vm = buildMarketingCampaignsViewModel({
      peerId: "peer-emma",
      plan: null,
      projects: [wizardProject("project-wizard-1")],
    });
    const presentation = presentMarketingCampaignCard(vm.items[0]!);
    expect(presentation.nextActionLabel.length).toBeGreaterThan(0);
    expect(vm.items[0]?.linkEnabled).toBe(true);
  });

  it("MarketingCampaignsSection avoids nested anchor markup for linked cards", () => {
    const src = read("features/marketing-workspace/components/MarketingCampaignsSection.tsx");
    expect(src).toContain("cardWrappedInLink");
    expect(src).toContain("shouldRenderCampaignCardNextActionAsLink");
    expect(src).toContain(
      '<CampaignCardBody presentation={presentation} cardWrappedInLink />'
    );
    expect(src).toContain('<span className="mw-section-link">{presentation.nextActionLabel}</span>');
    expect(src).toContain("nextActionAsLink ? (");
  });
});

describe("campaign wizard project detail mode", () => {
  it("detects campaign wizard origin without exposing it in back label", () => {
    expect(isCampaignWizardProject(wizardProject("x"))).toBe(true);
    expect(isCampaignWizardProject({ origin: "manual_assignment" })).toBe(false);
    expect(campaignWizardDetailBackLabel()).toBe("← Back to campaigns");
    expect(campaignWizardDetailBackLabel().toLowerCase()).not.toContain("wizard");
  });

  it("renders campaign experience only when flag, origin, and detail align", () => {
    const input: MarketingPeerDomainInput = {
      ...baseDomainInput,
      projects: [wizardProject("project-wizard-2")],
    };
    const detail = buildMarketingCampaignDetailViewModel(
      buildMarketingCampaignDetailSourceFromDomainInput(input, "project-wizard-2")
    );
    expect(
      shouldRenderCampaignWizardDetailView(true, wizardProject("project-wizard-2"), detail)
    ).toBe(true);
    expect(
      shouldRenderCampaignWizardDetailView(false, wizardProject("project-wizard-2"), detail)
    ).toBe(false);
    expect(
      shouldRenderCampaignWizardDetailView(true, { origin: "manual_assignment" }, detail)
    ).toBe(false);
  });

  it("ProjectDetailTab uses v17 customer campaign presenter", () => {
    const src = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(src).toContain("buildV17CampaignDetailViewModel");
    expect(src).toContain("V17CampaignDetailView");
    expect(src).toContain("buildCampaignReviewViewModel");
    expect(src).not.toContain("CustomerCampaignExperience");
  });

  it("Campaign detail sections use campaign details wording not project details", () => {
    const src = read("features/marketing-workspace/components/CampaignDetailSections.tsx");
    expect(src).toContain("Campaign details");
    expect(src).not.toContain("Project details");
    expect(src).not.toContain("originLabel");
    expect(src).not.toContain("campaign_wizard");
  });

  it("Campaign detail integrates execution plan section after overview", () => {
    const detail = read("features/marketing-workspace/components/CampaignDetailSections.tsx");
    expect(detail).toContain("CampaignExecutionPlanSection");
    expect(detail).toContain("executionPlan");
    expect(detail).toMatch(
      /mw-section-title[\s\S]{0,120}Overview[\s\S]*CampaignExecutionPlanSection[\s\S]*Deliverables/
    );
  });

  it("ProjectDetailTab builds review VM for v17 campaign detail", () => {
    const tab = read("features/marketing-workspace/details/ProjectDetailTab.tsx");
    expect(tab).toContain("buildCampaignReviewBuildInput");
    expect(tab).toContain("reviewVm");
    expect(tab).toContain("V17CampaignDetailView");
  });
});
