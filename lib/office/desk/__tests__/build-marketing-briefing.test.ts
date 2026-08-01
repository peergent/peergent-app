import { describe, expect, it } from "vitest";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { BRIEFING_PANELS } from "@/lib/office/desk/briefing-types";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";

/**
 * The Desk briefing summarises five other destinations. The risk it introduces
 * is drift: a summary that says something the page itself would not, or that
 * fills an empty panel with something reassuring. These tests pin the two
 * invariants that keep it honest.
 */

const PEER = "emma";
const base = { peerName: "Emma", peerRole: "Marketing" as const };

function domain(overrides?: Partial<MarketingPeerDomainInput>): MarketingPeerDomainInput {
  return {
    peerId: PEER,
    userName: "Pilot",
    peerName: "Emma",
    campaignTitle: "Summer",
    generating: null,
    generatingActivity: null,
    understanding: null,
    strategy: null,
    plan: null,
    projects: [],
    workUnits: [],
    drafts: [],
    publicationPackages: [],
    responsibilities: [],
    connections: [],
    activityFeed: [],
    automations: [],
    ...overrides,
  };
}

function project(): MarketingProject {
  return {
    id: "p1",
    peerId: PEER,
    title: "Launch",
    goal: "Grow awareness",
    campaignType: "product_launch",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    ownerLabel: "Emma",
    rawRequest: "Launch the summer campaign",
  } as MarketingProject;
}

function responsibility(): MarketingResponsibility {
  return {
    id: "r1",
    peerId: PEER,
    title: "LinkedIn posting",
    description: "Writes and publishes LinkedIn posts.",
    category: "content" as MarketingResponsibility["category"],
    goal: "Awareness",
    cadence: { type: "weekly" } as MarketingResponsibility["cadence"],
    autonomyLevel: "semi_autonomous",
    approvalPolicy: "approval_required",
    priority: 1,
    status: "enabled",
    enabled: true,
    guardrails: {},
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
  } as MarketingResponsibility;
}

function briefingFor(domainInput: MarketingPeerDomainInput) {
  const desk = buildMarketingDeskViewModel({ domainInput, ...base });
  return buildMarketingDeskBriefing({ domainInput, desk, ...base });
}

const empty = domain();
const lived = domain({
  projects: [project()],
  responsibilities: [responsibility()],
  connections: [
    {
      id: "linkedin",
      label: "LinkedIn",
      status: "not_connected",
      settingsHref: "/integrations?provider=linkedin",
      lastSyncedAt: null,
    },
  ],
});

describe("the briefing reports on every part of her job", () => {
  it("emits one panel per destination, in a stable order", () => {
    const briefing = briefingFor(lived);
    expect(briefing.panels.map((panel) => panel.id)).toEqual([...BRIEFING_PANELS]);
  });

  it("gives every panel a sentence and a way in", () => {
    for (const panel of briefingFor(lived).panels) {
      expect(panel.headline.trim(), `${panel.id} has no headline`).not.toBe("");
      expect(panel.href.startsWith("/office/"), `${panel.id} leaked a link`).toBe(true);
    }
  });

  it("never leaves a panel without something specific to say", () => {
    // The "no dead page" rule. Originally this meant a number or a promise,
    // but once the KPI band took the business figures the Performance panel
    // was left carrying only her reading of them — which is the most valuable
    // thing on it, not an absence. What must never happen is a panel that
    // renders as an empty box, so the bar is: a real sentence, or a number, or
    // an explanation of what will appear.
    for (const domainInput of [empty, lived]) {
      for (const panel of briefingFor(domainInput).panels) {
        const hasSomething =
          panel.headline.trim() !== "" || panel.stats.length > 0 || panel.future !== null;
        expect(hasSomething, `${panel.id} would render as a dead panel`).toBe(true);
      }
    }
  });
});

describe("the briefing cannot say more than its destination would", () => {
  it("shows no performance figure that Performance itself withheld", () => {
    // §4.5 decides what may be shown at all. The Desk may narrow that set,
    // never widen it — otherwise a fabricated metric could enter through here.
    const performance = buildMarketingPerformanceViewModelForOffice({
      domainInput: lived,
      ...base,
    });
    const allowed = new Set(performance.metrics.map((metric) => metric.id));

    const panel = briefingFor(lived).panels.find((p) => p.id === "performance")!;
    for (const stat of panel.stats) {
      expect(allowed.has(stat.id), `${stat.id} is not a Performance metric`).toBe(true);
    }
  });

  it("offers a future only when the panel has nothing measured to report", () => {
    for (const domainInput of [empty, lived]) {
      for (const panel of briefingFor(domainInput).panels) {
        if (panel.future && panel.stats.length > 0) {
          // Agreement is the one panel that may carry both: connection counts
          // are real while the boundaries themselves are still unset.
          expect(panel.id).toBe("agreement");
        }
      }
    }
  });

  it("keeps every future promise attached to something that unlocks it", () => {
    for (const panel of briefingFor(empty).panels) {
      if (!panel.future) continue;
      expect(panel.future.promise.trim()).not.toBe("");
      expect(panel.future.unlocks.trim()).not.toBe("");
    }
  });
});

describe("business outcomes outrank production activity", () => {
  it("puts every channel-reported outcome ahead of every internal count", () => {
    // Marketing is about improving the business, not about publishing content.
    // Reach and leads are outcomes a source reported; published and drafted are
    // things we can count without help. The ranking must be structural, not a
    // matter of which happened to be built first.
    const kpis = briefingFor(lived).kpis;
    const lastOutcome = kpis.map((k) => k.emphasis).lastIndexOf("outcome");
    const firstActivity = kpis.map((k) => k.emphasis).indexOf("activity");

    if (lastOutcome !== -1 && firstActivity !== -1) {
      expect(lastOutcome).toBeLessThan(firstActivity);
    }
  });

  it("never pads the row to fill it", () => {
    // An empty tile reads as a broken integration — a claim about the
    // customer's setup we have no business making.
    for (const domainInput of [empty, lived]) {
      for (const kpi of briefingFor(domainInput).kpis) {
        expect(kpi.value.trim()).not.toBe("");
        expect(kpi.label.trim()).not.toBe("");
      }
    }
  });

  it("only claims an improvement when a real comparison exists", () => {
    for (const kpi of briefingFor(lived).kpis) {
      if (kpi.delta === null) continue;
      expect(["up", "down", "flat"]).toContain(kpi.delta.direction);
      expect(kpi.delta.label.trim()).not.toBe("");
    }
  });

  it("never states the same figure twice on one page", () => {
    // The band and the panels are two views of one workspace. A number in both
    // makes the page repeat itself, which reads as noise rather than emphasis.
    const briefing = briefingFor(lived);
    const inBand = new Set(briefing.kpis.map((kpi) => kpi.id));
    for (const panel of briefing.panels) {
      for (const stat of panel.stats) {
        expect(
          inBand.has(stat.id),
          `"${stat.id}" appears in both the KPI band and the ${panel.id} panel`
        ).toBe(false);
      }
    }
  });

  it("shows no figure Performance itself withheld", () => {
    const performance = buildMarketingPerformanceViewModelForOffice({
      domainInput: lived,
      ...base,
    });
    const allowed = new Set(performance.metrics.map((m) => m.id));
    for (const kpi of briefingFor(lived).kpis) {
      expect(allowed.has(kpi.id), `${kpi.id} is not a Performance metric`).toBe(true);
    }
  });
});

describe("the next step is chosen by severity, never invented", () => {
  it("prefers a decision over anything else when one is waiting", () => {
    const desk = buildMarketingDeskViewModel({ domainInput: lived, ...base });
    const briefing = buildMarketingDeskBriefing({
      domainInput: lived,
      desk,
      ...base,
    });

    if (desk.decisions.length > 0) {
      expect(briefing.nextStep?.label).toBe(desk.decisions[0].title);
      expect(briefing.nextStep?.why).toBe(desk.decisions[0].unblocks);
    } else {
      // Whatever it fell through to must still carry its own reason.
      expect(briefing.nextStep === null || briefing.nextStep.why !== "").toBe(true);
    }
  });

  it("always points somewhere inside the Office", () => {
    for (const domainInput of [empty, lived]) {
      const step = briefingFor(domainInput).nextStep;
      if (!step) continue;
      expect(step.href.startsWith("/office/")).toBe(true);
      expect(step.ctaLabel.trim()).not.toBe("");
    }
  });
});

describe("the briefing mirrors the Desk it was built from", () => {
  it("reuses the Desk's own completed list rather than recounting it", () => {
    const desk = buildMarketingDeskViewModel({ domainInput: lived, ...base });
    const briefing = buildMarketingDeskBriefing({
      domainInput: lived,
      desk,
      ...base,
    });
    expect(briefing.changes.map((change) => change.id)).toEqual(
      desk.completed.map((item) => item.id)
    );
  });

  it("carries the Desk's presence rung so the page cannot contradict her", () => {
    const desk = buildMarketingDeskViewModel({ domainInput: lived, ...base });
    const briefing = buildMarketingDeskBriefing({
      domainInput: lived,
      desk,
      ...base,
    });
    expect(briefing.rung).toBe(desk.presence?.rung ?? "orientation");
  });
});
