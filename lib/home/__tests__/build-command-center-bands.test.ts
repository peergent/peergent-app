import { describe, expect, it } from "vitest";
import {
  buildCommandCenterBands,
  CC_HOME_ACTIVITY_MAX,
  CC_HOME_ATTENTION_MAX,
  CC_HOME_CHART_MAX,
  CC_HOME_KPI_MAX,
  commandCenterBandsContainForbiddenTerms,
  commandCenterBandsUseFabricatedLiveMetrics,
} from "@/lib/home/build-command-center-bands";
import { emptyWorkforceSummary } from "@/lib/home/build-workforce-summary";
import { getHomeCopy } from "@/lib/i18n";
import type { HomeMovementItem, HomeViewModel } from "@/lib/home/types";
import type { HandoffState } from "@/lib/home/handoff-types";

const copy = getHomeCopy("en");

const handoff: HandoffState = {
  scene: "completed",
  urgency: "normal",
  greeting: "Good morning.",
  briefingLines: ["Marketing finished a draft."],
  personalGreeting: "Good morning, Alex.",
  headline: "Your team moved work forward.",
  categoryLabel: "WORK",
  primaryWork: null,
  secondaryWork: [],
  secondaryPriorities: [],
  responsiblePeer: null,
  destination: "/team",
  companyActivity: { activeCount: 2, intensity: "medium" },
  teamWorkingVisible: true,
  isPreview: false,
};

function minimalViewModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    narrative: { greeting: "Good afternoon, Alex.", headline: "Ready", detail: undefined },
    needsYou: [],
    suggestedStart: null,
    teamPulse: [
      {
        peerId: "peer-1",
        name: "Emma",
        role: "Marketing",
        statusLabel: "Working",
        statusKind: "working",
        detail: "Preparing campaign",
        href: "/team/peer-1",
      },
    ],
    recentMovement: [],
    awayMovement: [],
    contextHealth: {
      available: false,
      confidencePercent: null,
      label: "—",
      gapLabel: null,
      improveHref: null,
    },
    workstreams: [],
    isEmpty: false,
    allCaughtUp: true,
    workforceSummary: {
      ...emptyWorkforceSummary(),
      completedTasks: 3,
      estimatedWorkingHoursSaved: 5,
      estimatedBusinessValue: 375,
    },
    ...overrides,
  };
}

function buildBands(viewModel: HomeViewModel | null, overrides: { isDemo?: boolean } = {}) {
  return buildCommandCenterBands({
    viewModel,
    handoff,
    copy,
    activitySources: [],
    formatRelativeTime: () => "2m ago",
    localePreference: "en",
    isDemo: overrides.isDemo,
  });
}

describe("buildCommandCenterBands (PX-5)", () => {
  it("exposes KPI hero band with at most four grounded metrics", () => {
    const bands = buildBands(minimalViewModel());
    expect(bands.kpis.length).toBeGreaterThan(0);
    expect(bands.kpis.length).toBeLessThanOrEqual(CC_HOME_KPI_MAX);
    expect(bands.kpis[0]?.hero).toBe(true);
  });

  it("does not fabricate live metrics outside demo mode", () => {
    const bands = buildBands(minimalViewModel());
    expect(commandCenterBandsUseFabricatedLiveMetrics(bands, false)).toBe(false);
    expect(bands.kpis.every((kpi) => kpi.dataSource !== "demo")).toBe(true);
  });

  it("limits needs-you attention to three items", () => {
    const needsYou = Array.from({ length: 5 }, (_, index) => ({
      id: `need-${index}`,
      priority: "normal" as const,
      title: "Review draft",
      subtitle: `Campaign ${index}`,
      peerId: "peer-1",
      peerName: "Emma",
      href: `/team/peer-1/review/${index}`,
    }));

    const bands = buildBands(minimalViewModel({ needsYou }));
    expect(bands.attention.length).toBeLessThanOrEqual(CC_HOME_ATTENTION_MAX);
  });

  it("shows at most one recommendation and omits it when attention exists", () => {
    const withAttention = buildBands(
      minimalViewModel({
        needsYou: [
          {
            id: "n1",
            priority: "normal",
            title: "Review",
            subtitle: "Campaign",
            peerId: "peer-1",
            peerName: "Emma",
            href: "/team/peer-1",
          },
        ],
        suggestedStart: {
          headline: "Increase LinkedIn budget",
          ctaLabel: "Open",
          href: "/team/peer-1",
        },
      })
    );
    expect(withAttention.recommendation).toBeNull();

    const calm = buildBands(
      minimalViewModel({
        contextHealth: {
          available: true,
          confidencePercent: 72,
          label: "72% confident",
          gapLabel: "Add your ideal customer profile",
          improveHref: "/company",
        },
      })
    );
    expect(calm.recommendation).not.toBeNull();
  });

  it("includes workforce briefing from team status and summary", () => {
    const bands = buildBands(minimalViewModel());
    expect(bands.workforceBriefing).not.toBeNull();
    expect(bands.workforceBriefing?.peerBriefs.length).toBeGreaterThan(0);
  });

  it("includes at most one chart from real activity", () => {
    const movement: HomeMovementItem[] = [
      {
        id: "m1",
        title: "Published LinkedIn posts",
        description: "",
        peerName: "Emma",
        timestamp: new Date().toISOString(),
        href: "/team/peer-1",
      },
      {
        id: "m2",
        title: "Resolved support tickets",
        description: "",
        peerName: "Support",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        href: "/team/peer-2",
      },
      {
        id: "m3",
        title: "Qualified lead",
        description: "",
        peerName: "Sales",
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        href: "/team/peer-3",
      },
    ];

    const bands = buildBands(minimalViewModel({ recentMovement: movement }));
    expect(bands.chart === null || bands.chart.points.length >= 2).toBe(true);
    expect(CC_HOME_CHART_MAX).toBe(1);
  });

  it("limits live activity to six items", () => {
    const movement: HomeMovementItem[] = Array.from({ length: 10 }, (_, index) => ({
      id: `m-${index}`,
      title: `Activity ${index}`,
      description: "",
      peerName: "Emma",
      timestamp: new Date(Date.now() - index * 60000).toISOString(),
      href: "/team/peer-1",
    }));

    const bands = buildBands(minimalViewModel({ recentMovement: movement }));
    expect(bands.activity.length).toBeLessThanOrEqual(CC_HOME_ACTIVITY_MAX);
  });

  it("avoids workflow and brain terminology in customer copy", () => {
    const bands = buildBands(minimalViewModel());
    expect(commandCenterBandsContainForbiddenTerms(bands)).toBe(false);
  });

  it("uses calm header copy without oversized hero", () => {
    const bands = buildBands(minimalViewModel());
    expect(bands.header.greeting).toContain("Alex");
    expect(bands.header.supporting.toLowerCase()).toContain("workforce");
  });

  it("demo mode marks demo metrics explicitly", () => {
    const bands = buildBands(null, { isDemo: true });
    expect(bands.kpis.every((kpi) => kpi.dataSource === "demo")).toBe(true);
    expect(commandCenterBandsUseFabricatedLiveMetrics(bands, true)).toBe(false);
  });

  it("merges activity into one live activity band (no separate completed-today section)", () => {
    const bands = buildBands(minimalViewModel());
    expect(bands.activityLabel.toLowerCase()).toContain("activity");
    expect(bands.activity.length).toBeLessThanOrEqual(CC_HOME_ACTIVITY_MAX);
  });
});

describe("CommandCenterHome structure", () => {
  it("uses CommandCenterHome instead of IedereenView in HandoffHome", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(process.cwd(), "features/home/handoff/HandoffHome.tsx"),
      "utf8"
    );
    expect(source.includes("CommandCenterHome")).toBe(true);
    expect(source.includes("IedereenView")).toBe(false);
  });

  it("CommandCenterHome uses PX-6 premium grid composition", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(process.cwd(), "features/home/command-center/CommandCenterHome.tsx"),
      "utf8"
    );
    expect(source.includes("pg-cc6")).toBe(true);
    expect(source.includes("pg-cc15")).toBe(true);
    expect(source.includes("command-center-grid.css")).toBe(true);
    expect(source.includes("pg-cc18")).toBe(true);
    expect(source.includes("command-center-mid-modules.css")).toBe(true);
    expect(source.includes("pg-cc18-module--approvals")).toBe(true);
    expect(source.includes("pg-cc17")).toBe(true);
    expect(source.includes("command-center-executive-quality.css")).toBe(true);
    expect(source.includes("pg-cc21")).toBe(true);
    expect(source.includes("command-center-design-freeze.css")).toBe(true);
    expect(source.includes("pg-cc20")).toBe(true);
    expect(source.includes("pg-cc6-kpi__icon")).toBe(true);
    expect(source.includes("pg-cc18-approvals-grid")).toBe(true);
    expect(source.includes("pg-cc18-activity-stream")).toBe(true);
    expect(source.indexOf("pg-cc15-row--nav")).toBeLessThan(
      source.indexOf("pg-cc15-row--rec")
    );
    expect(source.includes("CcWorkforceBriefing")).toBe(true);
    expect(source.includes("CcRecommendationHero")).toBe(true);
    expect(source.includes("pg-cc6-nav-grid")).toBe(true);
  });
});
