import { describe, expect, it } from "vitest";
import { resolveWorkingStageIndex } from "@/features/office/campaign/CampaignWorkingStatus";
import { orchestrationPrimaryActionToCta } from "@/lib/office/campaign/campaign-intelligence-orchestrator";
import { buildCampaignWorkflowViewModel } from "@/lib/office/campaign/build-campaign-workflow";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const PEER = "emma";
const PROJECT_ID = "working-status-1";

function readyProject(): MarketingProject {
  return {
    id: PROJECT_ID,
    peerId: PEER,
    title: "You Charge Launch",
    goal: "Leads",
    campaignType: "product_launch",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "Meer demo-aanvragen voor You Charge.",
    origin: "campaign_wizard",
    campaignSetup: {
      description: "Meer demo-aanvragen voor You Charge.",
      primaryGoalId: "generate_leads",
      targetAudience: "Ondernemers",
      setupMode: "automatic",
      approvalMode: "approval_before_publication",
      websiteUrl: "https://you-charge.nl",
      campaignCompetitors: [{ name: "ChargePoint" }],
      campaignBrandContext: {
        brandName: "You Charge",
        industry: "EV",
        productsAndServices: ["Laadoplossingen voor ondernemers"],
        uniqueSellingPoints: ["Snelle installatie"],
        targetAudience: "Ondernemers",
      },
      strategyRun: {
        status: "running",
        stageLabel: "Emma ontwikkelt je strategie…",
      },
    },
  };
}

describe("campaign working status presentation", () => {
  it("maps running lifecycle stage from run status", () => {
    expect(resolveWorkingStageIndex("running")).toBe(2);
    expect(resolveWorkingStageIndex("validating", "Emma controleert kwaliteit")).toBe(3);
    expect(resolveWorkingStageIndex("gathering_context")).toBe(0);
  });

  it("renders working CTA as non-interactive action type", () => {
    const cta = orchestrationPrimaryActionToCta({
      kind: "strategy_working",
      label: "Emma werkt aan je strategie…",
      strategyRunStatus: "running",
      strategyRunStageLabel: "Strategie ontwikkelen",
    });
    expect(cta.action).toBe("working");
    expect(cta.action).not.toBe("continue");
  });

  it("workflow exposes working action while strategy run is active", () => {
    const project = readyProject();
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project,
      domainInput: { projects: [project], drafts: [], workUnits: [], understanding: null },
      locale: "nl",
      isDemo: false,
    });
    expect(workflow.nextStepCta.action).toBe("working");
    expect(workflow.nextStepCta.label).toContain("Emma werkt");
  });

  it("failed run exposes retry action instead of working", () => {
    const project = readyProject();
    const failedProject: MarketingProject = {
      ...project,
      campaignSetup: {
        ...project.campaignSetup!,
        strategyRun: {
          status: "failed",
          failureCode: "timeout",
          failureMessageSafe: "Het maken van de strategie duurde te lang. Probeer het opnieuw.",
        },
      },
    };
    const workflow = buildCampaignWorkflowViewModel({
      peerId: PEER,
      project: failedProject,
      domainInput: { projects: [failedProject], drafts: [], workUnits: [], understanding: null },
      locale: "nl",
      isDemo: false,
    });
    expect(workflow.nextStepCta.action).toBe("retry_strategy");
  });
});
