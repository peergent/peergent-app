import { describe, expect, it } from "vitest";
import { buildV17CampaignDetailViewModel } from "@/lib/customer-v17/build-v17-campaign-detail-view-model";
import type { MarketingProjectDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-project-detail-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";

const project: MarketingProject = {
  id: "p1",
  peerId: "peer1",
  title: "Launch",
  goal: "Awareness",
  campaignType: "multi_channel",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerLabel: "You",
  rawRequest: "",
};

const domainInput = {
  peerId: "peer1",
  peerName: "Marketing Peer",
  projects: [project],
  workUnits: [],
  drafts: [],
} as unknown as MarketingPeerDomainInput;

const vm = {
  projectId: "p1",
  title: "Launch",
  goal: "Grow awareness",
  statusLabel: "active",
  experience: {
    hero: {
      phaseLabel: "Review",
      progress: 40,
      heroMessage: "Campaign is preparing content.",
      primaryCta: null,
    },
    nextStep: { label: "Review strategy" },
    timeline: [],
  },
  contentItems: [],
} as unknown as MarketingProjectDetailViewModel;

describe("buildV17CampaignDetailViewModel", () => {
  it("localizes status and back link to work index", () => {
    const model = buildV17CampaignDetailViewModel({
      peerId: "peer1",
      projectId: "p1",
      domainInput,
      project,
      vm,
      localePreference: "nl",
      showInspectorLink: false,
    });
    expect(model.backHref).toBe("/team/peer1/work");
    expect(model.backLabel).toContain("campagnes");
    expect(model.statusTag).toBe("Bezig");
  });

  it("hides inspector for customers", () => {
    const model = buildV17CampaignDetailViewModel({
      peerId: "peer1",
      projectId: "p1",
      domainInput,
      project,
      vm,
      showInspectorLink: false,
    });
    expect(model.inspectorHref).toBeNull();
  });

  it("shows inspector when enabled for admin", () => {
    const model = buildV17CampaignDetailViewModel({
      peerId: "peer1",
      projectId: "p1",
      domainInput,
      project,
      vm,
      showInspectorLink: true,
    });
    expect(model.inspectorHref).toContain("/inspector");
  });
});
