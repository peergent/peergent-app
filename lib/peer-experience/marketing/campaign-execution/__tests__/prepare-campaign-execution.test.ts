import { describe, expect, it } from "vitest";

import { createMarketingCampaignProject, createMarketingProject } from "@/lib/peer-experience/marketing/projects/project-engine";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

import { prepareCampaignExecution } from "../prepare-campaign-execution";
import {
  CampaignExecutionWorkspaceNonCampaignProjectError,
  CampaignExecutionWorkspaceProjectMissingError,
} from "../campaign-execution-workspace-result";

const assembledAt = "2026-07-20T12:00:00.000Z";
const peerId = "peer-1";

function baseDomainInput(
  projects: MarketingPeerDomainInput["projects"]
): MarketingPeerDomainInput {
  return {
    peerId,
    organizationId: "org-1",
    userName: "You",
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

describe("prepareCampaignExecution", () => {
  it("composes planner source, plan, and executor result deterministically", () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign description",
      primaryGoalId: "brand_awareness",
    });
    const domainInput = baseDomainInput([project]);

    const a = prepareCampaignExecution({
      projectId: project.id,
      domainInput,
      assembledAt,
      requestedBy: "user-1",
    });
    const b = prepareCampaignExecution({
      projectId: project.id,
      domainInput,
      assembledAt,
      requestedBy: "user-1",
    });

    expect(a.executionPlan.id).toBe(b.executionPlan.id);
    expect(a.executionResult).toEqual(b.executionResult);
    expect(a.plannerSource.campaign.id).toBe(project.id);
    expect(a.executorSource.campaignId).toBe(project.id);
  });

  it("performs no writes and does not mutate domain input", () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    const domainInput = baseDomainInput([project]);
    const snapshot = JSON.stringify(domainInput);

    prepareCampaignExecution({
      projectId: project.id,
      domainInput,
      assembledAt,
      requestedBy: "user-1",
    });

    expect(JSON.stringify(domainInput)).toBe(snapshot);
    expect(domainInput.workUnits).toHaveLength(0);
  });

  it("rejects legacy manual projects", () => {
    const manual = createMarketingProject({
      peerId,
      title: "Manual",
      goal: "Goal",
      channel: "LinkedIn",
      deliverableKind: "linkedin",
      rawRequest: "Post",
      ownerLabel: "You",
    });
    expect(() =>
      prepareCampaignExecution({
        projectId: manual.id,
        domainInput: baseDomainInput([manual]),
        assembledAt,
        requestedBy: "user-1",
      })
    ).toThrow(CampaignExecutionWorkspaceNonCampaignProjectError);
  });

  it("rejects missing projects", () => {
    expect(() =>
      prepareCampaignExecution({
        projectId: "missing",
        domainInput: baseDomainInput([]),
        assembledAt,
        requestedBy: "user-1",
      })
    ).toThrow(CampaignExecutionWorkspaceProjectMissingError);
  });

  it("uses explicit campaign assembly only through planner adapter", () => {
    const project = createMarketingCampaignProject({
      peerId,
      ownerLabel: "You",
      name: "Launch",
      goalLabel: "Awareness",
      description: "Campaign",
      primaryGoalId: "brand_awareness",
    });
    const withChannels = {
      ...baseDomainInput([project]),
    };
    const plan = prepareCampaignExecution({
      projectId: project.id,
      domainInput: withChannels,
      assembledAt,
      requestedBy: "user-1",
    });
    expect(plan.executionPlan.campaignId).toBe(project.id);
    expect(plan.executionResult.organizationId).toBe("org-1");
  });
});
