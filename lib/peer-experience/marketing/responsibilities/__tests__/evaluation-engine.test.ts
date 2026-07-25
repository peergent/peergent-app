import { describe, expect, it } from "vitest";
import type { MarketingPlan } from "@/lib/marketing-intelligence";
import { createMarketingResponsibility } from "../responsibility-engine";
import { RESPONSIBILITY_CATALOG } from "../responsibility-catalog";
import {
  buildResponsibilityPlanningItems,
  evaluateResponsibility,
} from "../evaluation-engine";
import { createMarketingProject } from "@/lib/peer-experience/marketing/projects/project-engine";

const peerId = "peer-emma";
const instagramEntry = RESPONSIBILITY_CATALOG.find((e) => e.category === "instagram")!;

function makeResponsibility(enabled = true) {
  return createMarketingResponsibility(peerId, instagramEntry, { enabled });
}

const planWithInstagramGap: MarketingPlan = {
  id: "plan-1",
  organizationId: "org",
  peerId,
  campaignTitle: "Q3",
  contentCalendar: [
    {
      title: "LinkedIn update",
      contentType: "social_media_post",
      scheduledWeek: 4,
      planActivityReference: "LI-1",
    },
  ],
  timeline: [],
  generatedAt: new Date().toISOString(),
};

describe("evaluateResponsibility", () => {
  it("returns waiting when responsibility is paused", () => {
    const responsibility = makeResponsibility(false);
    const result = evaluateResponsibility({
      responsibility,
      projects: [],
      plan: planWithInstagramGap,
      connections: [],
      peerName: "Emma",
    });

    expect(result.action).toBe("no_action");
    expect(result.health).toBe("waiting");
  });

  it("returns blocked when required integration is missing", () => {
    const responsibility = makeResponsibility(true);
    const result = evaluateResponsibility({
      responsibility,
      projects: [],
      plan: planWithInstagramGap,
      connections: [],
      peerName: "Emma",
    });

    expect(result.action).toBe("ask_user");
    expect(result.health).toBe("blocked");
  });

  it("recommends strategy when plan is missing", () => {
    const responsibility = makeResponsibility(true);
    const result = evaluateResponsibility({
      responsibility,
      projects: [],
      plan: null,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
      peerName: "Emma",
    });

    expect(result.action).toBe("recommend_strategy");
    expect(result.health).toBe("needs_attention");
  });

  it("proposes project when calendar gap exists and autonomy allows suggestions", () => {
    const responsibility = makeResponsibility(true);
    const result = evaluateResponsibility({
      responsibility,
      projects: [],
      plan: planWithInstagramGap,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
      peerName: "Emma",
    });

    expect(result.action).toBe("create_project");
    expect(result.proposedProject?.title).toContain("Instagram");
    expect(result.planningMessage).toContain("Instagram");
  });

  it("returns no_action when an active project was recently updated", () => {
    const responsibility = makeResponsibility(true);
    const project = createMarketingProject({
      peerId,
      title: "Instagram Campaign",
      goal: responsibility.goal,
      channel: "Instagram",
      deliverableKind: "instagram",
      rawRequest: "test",
      ownerLabel: "Emma",
      responsibilityId: responsibility.id,
      origin: "responsibility",
    });
    project.updatedAt = new Date().toISOString();

    const result = evaluateResponsibility({
      responsibility,
      projects: [project],
      plan: planWithInstagramGap,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
      peerName: "Emma",
    });

    expect(result.action).toBe("no_action");
    expect(result.health).toBe("healthy");
  });
});

describe("buildResponsibilityPlanningItems", () => {
  it("maps create_project evaluations to planning items with approve labels", () => {
    const responsibility = makeResponsibility(true);
    const evaluation = evaluateResponsibility({
      responsibility,
      projects: [],
      plan: planWithInstagramGap,
      connections: [{ id: "instagram", label: "Instagram", status: "connected" }],
      peerName: "Emma",
    });

    const items = buildResponsibilityPlanningItems(
      [responsibility],
      [evaluation],
      peerId,
      (id) => `/team/${peerId}/responsibilities/${id}`
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.responsibilityTitle).toBe("Instagram");
    expect(items[0]?.approveLabel).toBe("Approve plan");
  });
});
