import { describe, expect, it } from "vitest";
import { buildHqServiceCards, groupTeamPulseByService } from "@/lib/hq/aggregate-hq-services";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import type { HomeTeamPulseItem } from "@/lib/home/types";

function pulse(
  peerId: string,
  role: string,
  name: string,
  overrides: Partial<HomeTeamPulseItem> = {}
): HomeTeamPulseItem {
  return {
    peerId,
    name,
    role,
    statusKind: "idle",
    statusLabel: "Ready",
    detail: "Working",
    href: `/peers/${peerId}`,
    ...overrides,
  };
}

describe("aggregate-hq-services", () => {
  it("aggregates ten Sales peers into one Sales service card", () => {
    const teamPulse = Array.from({ length: 10 }, (_, index) =>
      pulse(`sales-${index}`, "Sales", `Sales Peer ${index}`, {
        statusKind: index % 2 === 0 ? "working" : "idle",
        statusLabel: index % 2 === 0 ? "Working" : "Ready",
        href: `/peers/sales-${index}`,
      })
    );

    const services = buildHqServiceCards({
      teamPulse,
      activitySources: [],
      workforceSummary: emptyWorkforceSummary(),
      needsYou: [],
    });

    expect(services).toHaveLength(1);
    expect(services[0]?.serviceKey).toBe("sales");
    expect(services[0]?.peerCount).toBe(10);
    expect(services[0]?.peerIds).toHaveLength(10);
    expect(services[0]?.label).toBe("Sales");
  });

  it("aggregates three Marketing peers into one Marketing card", () => {
    const teamPulse = [
      pulse("m1", "Marketing", "Emma", { href: "/team/m1", statusKind: "working" }),
      pulse("m2", "Marketing", "LoLo", { href: "/team/m2" }),
      pulse("m3", "Marketing", "Mia", { href: "/team/m3" }),
    ];

    const services = buildHqServiceCards({
      teamPulse,
      activitySources: [],
      workforceSummary: emptyWorkforceSummary(),
      needsYou: [],
    });

    expect(services).toHaveLength(1);
    expect(services[0]?.serviceKey).toBe("marketing");
    expect(services[0]?.peerCount).toBe(3);
    expect(services[0]?.statusKind).toBe("working");
    expect(services[0]?.href).toBe("/team/m1");
  });

  it("keeps different peer IDs in one service and does not dedupe them away", () => {
    const groups = groupTeamPulseByService([
      pulse("a", "Sales", "A"),
      pulse("b", "Sales", "B"),
    ]);

    expect(groups.get("sales")).toHaveLength(2);
    expect(groups.get("sales")?.map((item) => item.peerId)).toEqual(["a", "b"]);
  });

  it("prioritizes needs_attention over working status", () => {
    const services = buildHqServiceCards({
      teamPulse: [
        pulse("m1", "Marketing", "Emma", { statusKind: "working", statusLabel: "Working" }),
        pulse("m2", "Marketing", "LoLo", {
          statusKind: "waiting",
          statusLabel: "Waiting for you",
          detail: "Campaign draft ready",
        }),
      ],
      activitySources: [],
      workforceSummary: emptyWorkforceSummary(),
      needsYou: [],
    });

    expect(services[0]?.statusKind).toBe("needs_attention");
    expect(services[0]?.statusLabel).toBe("Needs attention");
  });

  it("selects needs-you activity when present", () => {
    const services = buildHqServiceCards({
      teamPulse: [pulse("m1", "Marketing", "Emma", { href: "/team/m1" })],
      activitySources: [],
      workforceSummary: emptyWorkforceSummary(),
      needsYou: [
        {
          id: "n1",
          priority: "normal",
          title: "Review draft",
          subtitle: "Campaign awaiting approval",
          peerId: "m1",
          peerName: "Emma",
          href: "/team/m1/review",
        },
      ],
    });

    expect(services[0]?.activity).toBe("Campaign awaiting approval");
  });

  it("renders five distinct services for a mixed workforce", () => {
    const teamPulse = [
      pulse("s1", "Sales", "Sales A"),
      pulse("m1", "Marketing", "Marketing A", { href: "/team/m1" }),
      pulse("f1", "Finance", "Finance A"),
      pulse("u1", "Support", "Support A"),
      pulse("p1", "Planning", "Planner A"),
    ];

    const services = buildHqServiceCards({
      teamPulse,
      activitySources: [],
      workforceSummary: emptyWorkforceSummary(),
      needsYou: [],
    });

    expect(services.map((service) => service.serviceKey)).toEqual([
      "sales",
      "marketing",
      "finance",
      "support",
      "operations",
    ]);
  });
});
