import { describe, expect, it } from "vitest";

import { planCampaignExecution } from "@/lib/campaign/planner";
import { createMarketingCampaignProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import {
  createEmptyCreateCampaignForm,
  toCreateMarketingCampaignProjectInput,
} from "@/features/marketing-workspace/lib/create-campaign-form";

import { buildCampaignPlannerSourceFromDomainInput } from "../build-campaign-planner-source-from-domain-input";
import { planMarketingCampaignFromDomainInput } from "../plan-marketing-campaign-from-domain-input";
import type { MarketingPeerDomainInput } from "../../view-models/marketing-peer-domain-input";

const assembledAt = "2026-07-20T12:00:00.000Z";

function baseInput(projects: MarketingPeerDomainInput["projects"]): MarketingPeerDomainInput {
  return {
    peerId: "peer-emma",
    organizationId: "org-1",
    userName: "Alex",
    peerName: "Emma",
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
    projects,
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

describe("planMarketingCampaignFromDomainInput", () => {
  it("returns deterministic CampaignExecutionPlan for wizard project", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow pipeline",
        primaryGoalId: "product_launch",
      })
    );
    const args = {
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
      version: 1,
    };
    const a = planMarketingCampaignFromDomainInput(args);
    const b = planMarketingCampaignFromDomainInput(args);
    expect(a).toEqual(b);
    expect(a.campaignId).toBe(project.id);
    expect(a.status).toBe("draft");
    expect(a.workPackages.length).toBeGreaterThan(0);
  });

  it("matches planCampaignExecution on built source", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const args = {
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    };
    const source = buildCampaignPlannerSourceFromDomainInput(args);
    expect(planMarketingCampaignFromDomainInput(args)).toEqual(planCampaignExecution(source));
  });

  it("preserves blocked planner policy when decision summary is on source", () => {
    const project = createMarketingCampaignProject(
      toCreateMarketingCampaignProjectInput("peer-emma", "Alex", {
        ...createEmptyCreateCampaignForm(),
        name: "Launch",
        description: "Grow",
        primaryGoalId: "brand_awareness",
      })
    );
    const source = buildCampaignPlannerSourceFromDomainInput({
      projectId: project.id,
      domainInput: baseInput([project]),
      assembledAt,
    });
    const withDeliverable = {
      ...source,
      explicitDeliverables: [{ channel: "LinkedIn", deliverableType: "linkedin_post" }],
      decisionSummary: {
        id: "dec-1",
        status: "blocked" as const,
        canExecute: false,
        canGenerateCreative: false,
        blockedReasons: ["Policy block"],
      },
    };
    const plan = planCampaignExecution(withDeliverable);
    expect(plan.status).toBe("blocked");
  });
});
