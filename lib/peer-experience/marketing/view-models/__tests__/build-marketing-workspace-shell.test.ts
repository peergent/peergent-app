import { describe, expect, it } from "vitest";
import { buildMarketingWorkspaceShellViewModel } from "@/features/marketing-workspace/view-model/buildMarketingWorkspaceShellViewModel";
import type { MarketingPeerDomainInput } from "../marketing-peer-domain-input";
import type { PeerRow } from "@/lib/peer-display";
import { MARKETING_PEER_TABS } from "../../navigation/marketing-peer-links";

const peer: PeerRow = {
  id: "peer-emma",
  name: "Emma",
  role: "Marketing Lead",
  website: "",
  objective: "Generate more qualified leads through paid channels.",
  status: "active",
  created_at: "2026-04-12T00:00:00.000Z",
};

const baseInput: MarketingPeerDomainInput = {
  peerId: peer.id,
  userName: "Djemo",
  peerName: peer.name,
  campaignTitle: "Summer Campaign",
  generating: null,
  generatingActivity: null,
  understanding: { available: true, completeness: 80, gaps: [], summary: "", lastUpdated: "" },
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
};

describe("buildMarketingWorkspaceShellViewModel", () => {
  it("uses live peer name and role", () => {
    const vm = buildMarketingWorkspaceShellViewModel({
      peer,
      domainInput: baseInput,
      activeTab: "overview",
    });
    expect(vm.agent.name).toBe("Emma");
    expect(vm.agent.roleLabel).toBe("Marketing Lead");
  });

  it("counts pending decisions from draft queue", () => {
    const vm = buildMarketingWorkspaceShellViewModel({
      peer,
      domainInput: {
        ...baseInput,
        drafts: [
          {
            id: "d1",
            planActivityReference: "x",
            contentType: "linkedin_post",
            status: "ready_for_review",
            title: "T",
            body: "",
            objective: "",
            keywords: [],
            rationale: { why: "", planActivityReference: "x", strategyLinks: [] },
            sourceReferences: [],
            confidence: "high",
            warnings: [],
            generatedAt: new Date().toISOString(),
          },
        ],
      },
      activeTab: "overview",
    });
    expect(vm.agent.decisionCount).toBe(1);
  });
});

describe("MARKETING_PEER_TABS order", () => {
  it("includes four customer sections", () => {
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toEqual([
      "today",
      "work",
      "results",
      "settings",
    ]);
  });
});
