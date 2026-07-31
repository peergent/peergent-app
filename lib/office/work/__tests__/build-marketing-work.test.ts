import { describe, expect, it } from "vitest";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { IntegrationConnection } from "@/lib/integrations/types";
import { createWorkUnit } from "@/lib/peer-workflow/work-unit-engine";

function domain(overrides?: Partial<MarketingPeerDomainInput>): MarketingPeerDomainInput {
  return {
    peerId: "emma",
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

function project(overrides?: Partial<MarketingProject>): MarketingProject {
  return {
    id: "p1",
    peerId: "emma",
    title: "Launch",
    goal: "Grow awareness",
    campaignType: "product_launch",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "",
    ...overrides,
  };
}

function connection(
  id: IntegrationConnection["id"],
  status: IntegrationConnection["status"]
): IntegrationConnection {
  return {
    id,
    label: id,
    status,
    settingsHref: "/settings",
    lastSyncedAt: null,
  };
}

function unitFor(projectId: string, overrides?: { paused?: boolean }) {
  const unit = createWorkUnit({
    peerId: "emma",
    role: "Marketing",
    title: "LinkedIn post",
    deliverableKind: "linkedin",
    channel: "linkedin",
    objective: null,
    audience: null,
    needsVisual: false,
    recurrence: "once",
    rawRequest: "",
    projectId,
  });
  return { ...unit, paused: overrides?.paused ?? false };
}

function build(input: MarketingPeerDomainInput) {
  return buildMarketingWorkViewModel({
    domainInput: input,
    peerName: "Emma",
    peerRole: "Marketing",
  });
}

function groupIds(model: ReturnType<typeof build>) {
  return model.groups.map((g) => g.id);
}

describe("Work — grouping by state", () => {
  it("omits groups that have no items", () => {
    const model = build(domain({ projects: [project()] }));
    expect(model.groups.length).toBeGreaterThan(0);
    for (const group of model.groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it("puts a project with no work unit in the queue", () => {
    const model = build(domain({ projects: [project()] }));
    expect(groupIds(model)).toContain("queued");
  });

  it("treats a started project as moving", () => {
    const model = build(
      domain({ projects: [project()], workUnits: [unitFor("p1")] })
    );
    expect(groupIds(model)).toContain("moving");
    expect(groupIds(model)).not.toContain("queued");
  });

  it("preserves the specified group order", () => {
    const model = build(
      domain({
        projects: [project({ id: "p1" }), project({ id: "p2", title: "Second" })],
        workUnits: [unitFor("p2")],
      })
    );
    const order = groupIds(model);
    const queued = order.indexOf("queued");
    const moving = order.indexOf("moving");
    // Moving always precedes Queued (§4.2).
    expect(moving).toBeLessThan(queued);
  });
});

describe("Work — blocker attribution", () => {
  it("names a disconnected channel as the blocker", () => {
    const model = build(
      domain({
        projects: [
          project({
            campaignSetup: {
              description: "d",
              primaryGoalId: "awareness",
              selectedChannels: ["linkedin"],
            } as MarketingProject["campaignSetup"],
          }),
        ],
        workUnits: [unitFor("p1")],
        connections: [connection("linkedin", "not_connected")],
      })
    );

    const blocked = model.groups.find((g) => g.id === "blocked_elsewhere");
    expect(blocked).toBeDefined();
    expect(blocked?.items[0]?.blockedBy).toContain("LinkedIn");
  });

  it("does not report a blocker when the channel is connected", () => {
    const model = build(
      domain({
        projects: [
          project({
            campaignSetup: {
              description: "d",
              primaryGoalId: "awareness",
              selectedChannels: ["linkedin"],
            } as MarketingProject["campaignSetup"],
          }),
        ],
        workUnits: [unitFor("p1")],
        connections: [connection("linkedin", "connected")],
      })
    );

    expect(groupIds(model)).not.toContain("blocked_elsewhere");
    expect(groupIds(model)).toContain("moving");
  });

  it("treats a paused unit as blocked on something else", () => {
    const model = build(
      domain({
        projects: [project()],
        workUnits: [unitFor("p1", { paused: true })],
      })
    );
    expect(groupIds(model)).toContain("blocked_elsewhere");
  });

  it("never reports a blocker for channels with no provider to connect", () => {
    const model = build(
      domain({
        projects: [
          project({
            campaignSetup: {
              description: "d",
              primaryGoalId: "awareness",
              selectedChannels: ["other", "decide_later"],
            } as MarketingProject["campaignSetup"],
          }),
        ],
        workUnits: [unitFor("p1")],
      })
    );
    expect(groupIds(model)).not.toContain("blocked_elsewhere");
  });
});

describe("Work — every card answers the three questions", () => {
  it("carries a stage and a next step", () => {
    const model = build(
      domain({ projects: [project()], workUnits: [unitFor("p1")] })
    );
    const item = model.groups.flatMap((g) => g.items)[0];
    expect(item?.stageLabel).toBeTruthy();
    expect(item?.nextStep).toBeTruthy();
    expect(item?.href).toContain("p1");
  });
});

describe("Work — the proposing empty state", () => {
  it("proposes only when there is no work at all", () => {
    expect(build(domain()).proposal).not.toBeNull();
    expect(build(domain({ projects: [project()] })).proposal).toBeNull();
  });

  it("grounds the proposal in real business understanding when it exists", () => {
    const model = build(
      domain({
        understanding: {
          available: true,
          sparse: false,
          completeness: 80,
          gaps: [],
          brand: { values: [], toneOfVoice: {}, keyMessages: [] },
          products: [],
          services: [],
          customerSegments: [
            {
              id: "s1",
              name: "Dutch SME founders",
              painPoints: [],
              buyingTriggers: [],
            },
          ],
          competitors: [],
          goals: [],
          existingContent: [],
          assembledAt: "2026-07-28T00:00:00.000Z",
        },
      })
    );
    expect(model.proposal?.voice).toContain("Dutch SME founders");
    expect(model.proposal?.acceptLabel).toBe("Draft it");
  });

  it("asks plainly rather than inventing an audience when it knows nothing", () => {
    const model = build(domain());
    expect(model.proposal?.voice).not.toMatch(/aimed at/);
    expect(model.proposal?.next).toBeNull();
    expect(model.proposal?.briefLabel).toBe("I'd rather brief you myself");
  });
});

describe("Work — finished work", () => {
  it("collapses recently finished by default", () => {
    const model = build(
      domain({ projects: [project({ archivedAt: "2026-07-28T00:00:00.000Z" })] })
    );
    const finished = model.groups.find((g) => g.id === "finished");
    if (finished) {
      expect(finished.collapsedByDefault).toBe(true);
    }
    for (const group of model.groups) {
      if (group.id !== "finished") expect(group.collapsedByDefault).toBe(false);
    }
  });
});

describe("Work — presentation boundary", () => {
  it("never leaks frozen internal vocabulary into next steps", () => {
    const model = build(
      domain({ projects: [project()], workUnits: [unitFor("p1")] })
    );
    for (const item of model.groups.flatMap((g) => g.items)) {
      const next = (item.nextStep ?? "").toLowerCase();
      expect(next).not.toContain("deliverable");
      expect(next).not.toContain("generate");
      expect(next).not.toContain("work unit");
    }
  });

  it("formats an expected date rather than rendering an ISO string", () => {
    const unit = {
      ...unitFor("p1"),
      estimatedCompletionAt: "2026-08-04T09:00:00.000Z",
    };
    const model = build(domain({ projects: [project()], workUnits: [unit] }));
    const item = model.groups.flatMap((g) => g.items)[0];

    expect(item?.expectedLabel).toBeTruthy();
    expect(item?.expectedLabel).not.toContain("T09:00");
    expect(item?.expectedLabel).toMatch(/Expected/);
  });

  it("drops an unparseable expected date instead of showing raw text", () => {
    const unit = { ...unitFor("p1"), estimatedCompletionAt: "not-a-date" };
    const model = build(domain({ projects: [project()], workUnits: [unit] }));
    const item = model.groups.flatMap((g) => g.items)[0];
    expect(item?.expectedLabel).toBeNull();
  });

  it("does not blame a second campaign that merely shares a title", () => {
    // Only p1 is genuinely awaiting the customer; p2 shares its title.
    const model = build(
      domain({
        projects: [
          project({ id: "p1", title: "Launch" }),
          project({ id: "p2", title: "Launch" }),
        ],
        workUnits: [unitFor("p1"), unitFor("p2")],
      })
    );

    const blockedOnYou =
      model.groups.find((g) => g.id === "blocked_on_you")?.items ?? [];
    expect(blockedOnYou.length).toBeLessThanOrEqual(1);
  });
});

describe("Work — localization", () => {
  it("renders Dutch copy", () => {
    const model = buildMarketingWorkViewModel({
      domainInput: domain({ projects: [project()] }),
      peerName: "Emma",
      peerRole: "Marketing",
      localePreference: "nl",
    });
    expect(model.copy.title).toBe("Werk");
    expect(model.groups.some((g) => g.title === "In de wachtrij")).toBe(true);
  });
});
