import { describe, expect, it } from "vitest";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import { createMarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/responsibility-engine";
import { RESPONSIBILITY_CATALOG } from "@/lib/peer-experience/marketing/responsibilities/responsibility-catalog";
import { buildMarketingResponsibilitiesViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-responsibilities-view-model";
import { buildMarketingResponsibilityDetailViewModel } from "@/lib/peer-experience/marketing/view-models/build-marketing-responsibility-detail-view-model";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

const peerId = "peer-emma";
const instagramEntry = RESPONSIBILITY_CATALOG.find((e) => e.category === "instagram")!;

const baseInput: MarketingPeerDomainInput = {
  peerId,
  userName: "Djemo",
  peerName: "Emma",
  campaignTitle: "Campaign",
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
  responsibilities: [
    createMarketingResponsibility(peerId, instagramEntry, { enabled: true }),
  ],
  automations: [],
  connections: [],
};

const plan: MarketingPlan = {
  id: "plan-1",
  organizationId: "org",
  peerId,
  campaignTitle: "Q3",
  contentCalendar: [
    {
      title: "LinkedIn only",
      contentType: "social_media_post",
      scheduledWeek: 2,
      planActivityReference: "LI",
    },
  ],
  timeline: [],
  generatedAt: new Date().toISOString(),
};

describe("buildMarketingResponsibilitiesViewModel", () => {
  it("includes planning message when evaluation proposes work", () => {
    const vm = buildMarketingResponsibilitiesViewModel({
      ...baseInput,
      plan,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
    });

    expect(vm.cards).toHaveLength(1);
    expect(vm.cards[0]?.planningMessage).toBeTruthy();
    expect(vm.cards[0]?.canApprovePlan).toBe(true);
  });
});

describe("buildMarketingResponsibilityDetailViewModel", () => {
  it("returns null for unknown responsibility", () => {
    expect(
      buildMarketingResponsibilityDetailViewModel({
        ...baseInput,
        responsibilityId: "missing",
      })
    ).toBeNull();
  });

  it("includes goal and guardrails for known responsibility", () => {
    const responsibility = baseInput.responsibilities[0]!;
    const vm = buildMarketingResponsibilityDetailViewModel({
      ...baseInput,
      responsibilityId: responsibility.id,
      plan,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
    });

    expect(vm?.title).toBe("Instagram");
    expect(vm?.goal).toBeTruthy();
    expect(vm?.guardrails.length).toBeGreaterThan(0);
  });
});
