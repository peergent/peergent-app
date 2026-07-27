import { describe, expect, it } from "vitest";

import { resolveCampaignProjectContext } from "../resolve-campaign-project-context";
import type { MarketingPeerDomainInput } from "../../view-models/marketing-peer-domain-input";

function domainWithProject(projectId: string): MarketingPeerDomainInput {
  return {
    peerId: "peer-1",
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
    projects: [
      {
        id: projectId,
        peerId: "peer-1",
        title: "Launch",
        goal: "Grow",
        campaignType: "product_launch",
        createdAt: "2026-07-01T12:00:00.000Z",
        updatedAt: "2026-07-24T12:00:00.000Z",
        ownerLabel: "You",
        rawRequest: "Launch",
        origin: "campaign_wizard",
      },
    ],
    responsibilities: [],
    automations: [],
    connections: [],
  };
}

describe("resolveCampaignProjectContext", () => {
  it("returns loading before workspace is ready", () => {
    expect(
      resolveCampaignProjectContext({
        domainInput: domainWithProject("proj-1"),
        projectId: "proj-1",
        workspaceReady: false,
      }).status
    ).toBe("loading");
  });

  it("resolves a valid project by projectId when workspace is ready", () => {
    const result = resolveCampaignProjectContext({
      domainInput: domainWithProject("proj-1"),
      projectId: "proj-1",
      workspaceReady: true,
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.project.id).toBe("proj-1");
    expect(result.projectDetail.projectId).toBe("proj-1");
  });

  it("returns not-found for unknown project id after hydration", () => {
    const result = resolveCampaignProjectContext({
      domainInput: domainWithProject("proj-1"),
      projectId: "missing",
      workspaceReady: true,
    });
    expect(result.status).toBe("not-found");
  });

  it("does not require campaign workspace flag to resolve project", () => {
    const result = resolveCampaignProjectContext({
      domainInput: domainWithProject("proj-1"),
      projectId: "proj-1",
      workspaceReady: true,
    });
    expect(result.status).toBe("ready");
  });
});
