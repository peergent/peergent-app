import { describe, expect, it } from "vitest";
import { buildHqLandingViewModel } from "@/lib/hq/build-hq-view-model";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import { buildHqInitialTemporal } from "@/lib/hq/hq-temporal";

const temporal = buildHqInitialTemporal(new Date("2026-07-23T08:00:00Z"));

describe("buildHqLandingViewModel", () => {
  it("renders one HQ card per service, not per peer", () => {
    const vm = buildHqLandingViewModel({
      firstName: "Djemo",
      teamPulse: [
        ...Array.from({ length: 8 }, (_, index) => ({
          peerId: `sales-${index}`,
          name: `Sales ${index}`,
          role: "Sales",
          statusLabel: "Working",
          statusKind: "working" as const,
          detail: "Calling leads",
          href: `/peers/sales-${index}`,
        })),
        ...Array.from({ length: 3 }, (_, index) => ({
          peerId: `m-${index}`,
          name: `Marketing ${index}`,
          role: "Marketing",
          statusLabel: "Working",
          statusKind: "working" as const,
          detail: "Preparing campaign",
          href: `/team/m-${index}`,
        })),
      ],
      workforceSummary: emptyWorkforceSummary(),
      activitySources: [],
      needsYou: [],
      temporal,
    });

    expect(vm.serviceCount).toBe(2);
    expect(vm.services).toHaveLength(2);
    expect(vm.colleagueCount).toBe(11);
    expect(vm.services.map((service) => service.serviceKey)).toEqual(["sales", "marketing"]);
    expect(new Set(vm.services.map((service) => service.serviceKey)).size).toBe(2);
    expect(vm.subhead).toMatch(/^11 digital colleagues active across 2 services\./);
  });

  it("returns an empty service collection without demo cards", () => {
    const vm = buildHqLandingViewModel({
      teamPulse: [],
      workforceSummary: emptyWorkforceSummary(),
      activitySources: [],
      needsYou: [],
      temporal,
    });

    expect(vm.services).toHaveLength(0);
    expect(vm.serviceCount).toBe(0);
    expect(vm.colleagueCount).toBe(0);
    expect(vm.gridColumns).toBe(0);
  });

  it("connector targets align with service keys (card count equals service count)", () => {
    const vm = buildHqLandingViewModel({
      teamPulse: [
        {
          peerId: "s1",
          name: "Alex",
          role: "Sales",
          statusLabel: "Ready",
          statusKind: "idle",
          detail: "Pipeline active",
          href: "/peers/s1",
        },
        {
          peerId: "m1",
          name: "Emma",
          role: "Marketing",
          statusLabel: "Working",
          statusKind: "working",
          detail: "Draft ready",
          href: "/team/m1",
        },
      ],
      workforceSummary: emptyWorkforceSummary(),
      activitySources: [],
      needsYou: [],
      temporal,
    });

    expect(vm.services).toHaveLength(2);
    expect(vm.services.every((service) => service.serviceKey.length > 0)).toBe(true);
    expect(vm.services[0]?.href).toBe("/peers/s1");
    expect(vm.services[1]?.href).toBe("/team/m1");
  });
});
