import { describe, expect, it } from "vitest";
import {
  OFFICE_DESTINATION_LIST,
  officeDestinationHref,
  resolveOfficeDestination,
} from "@/lib/office/destinations";
import { isOfficeHref, officeHref, toOfficeHref } from "@/lib/office/links";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import type { MarketingResponsibility } from "@/lib/peer-experience/marketing/responsibilities/types";

const PEER = "emma";

/* ---------------- Destination routing ------------------------------------- */

describe("Office destinations never point at the legacy surface", () => {
  it("roots every destination at /office", () => {
    for (const destination of OFFICE_DESTINATION_LIST) {
      const href = destination.href(PEER);
      expect(href.startsWith(`/office/${PEER}`)).toBe(true);
      expect(href).not.toContain("/team");
    }
  });

  it("maps each destination id to its own route", () => {
    expect(officeDestinationHref(PEER, "desk")).toBe("/office/emma");
    expect(officeDestinationHref(PEER, "work")).toBe("/office/emma/work");
    expect(officeDestinationHref(PEER, "performance")).toBe("/office/emma/performance");
    expect(officeDestinationHref(PEER, "content")).toBe("/office/emma/content");
    expect(officeDestinationHref(PEER, "market")).toBe("/office/emma/market");
    expect(officeDestinationHref(PEER, "agreement")).toBe("/office/emma/agreement");
  });

  it("resolves the active destination from an office pathname", () => {
    expect(resolveOfficeDestination("/office/emma", PEER)).toBe("desk");
    expect(resolveOfficeDestination("/office/emma/work", PEER)).toBe("work");
    expect(resolveOfficeDestination("/office/emma/market", PEER)).toBe("market");
    expect(resolveOfficeDestination("/office/emma/agreement", PEER)).toBe("agreement");
  });

  it("keeps exactly one badged destination", () => {
    expect(OFFICE_DESTINATION_LIST.filter((d) => d.badged)).toHaveLength(1);
    expect(OFFICE_DESTINATION_LIST.find((d) => d.badged)?.id).toBe("desk");
  });
});

/* ---------------- The link boundary --------------------------------------- */

describe("toOfficeHref is total — nothing escapes the Office", () => {
  const legacy = [
    "/team/emma",
    "/team/emma/work",
    "/team/emma/content",
    "/team/emma/content/abc",
    "/team/emma/results",
    "/team/emma/waiting",
    "/team/emma/review",
    "/team/emma/done",
    "/team/emma/settings?section=connections",
    "/team/emma/connections",
    "/team/emma/knowledge",
    "/team/emma/responsibilities",
    "/team/emma/projects/p1",
    "/team/emma/projects/p1/review/r1",
    "/team/emma/projects/p1/inspector",
    "/integrations?provider=linkedin",
    "/hq",
    "/home",
    "/peers/123",
    "https://example.com/team/emma/work",
    "",
  ];

  it("rewrites every legacy path into the Office", () => {
    for (const href of legacy) {
      const mapped = toOfficeHref(PEER, href);
      expect(isOfficeHref(mapped), `${href} -> ${mapped}`).toBe(true);
      expect(mapped).not.toContain("/team/");
    }
  });

  it("handles null and undefined by returning the Desk", () => {
    expect(toOfficeHref(PEER, null)).toBe("/office/emma");
    expect(toOfficeHref(PEER, undefined)).toBe("/office/emma");
  });

  it("maps concepts to the destination that owns them", () => {
    expect(toOfficeHref(PEER, "/team/emma/projects/p1")).toBe("/office/emma/work");
    expect(toOfficeHref(PEER, "/team/emma/content/abc")).toBe("/office/emma/content");
    expect(toOfficeHref(PEER, "/team/emma/results")).toBe("/office/emma/performance");
    expect(toOfficeHref(PEER, "/team/emma/connections")).toBe("/office/emma/agreement");
    expect(toOfficeHref(PEER, "/integrations")).toBe("/office/emma/agreement");
    expect(toOfficeHref(PEER, "/team/emma/waiting")).toBe("/office/emma");
  });

  it("sends a review item where decisions are reviewed", () => {
    expect(toOfficeHref(PEER, "/team/emma/projects/p1/review/r1")).toBe(
      "/office/emma/content?state=awaiting_review"
    );
  });

  it("passes an office href through untouched", () => {
    expect(toOfficeHref(PEER, "/office/emma/work?campaign=p1")).toBe(
      "/office/emma/work?campaign=p1"
    );
  });

  it("drops unknown paths to the Desk rather than leaking them", () => {
    expect(toOfficeHref(PEER, "/some/unknown/route")).toBe("/office/emma");
    expect(toOfficeHref(PEER, "/team/emma/totally-new-thing")).toBe("/office/emma");
  });

  it("builds office hrefs with params and skips empty ones", () => {
    expect(officeHref(PEER, "content", { campaign: "p1", channel: null })).toBe(
      "/office/emma/content?campaign=p1"
    );
    expect(officeHref(PEER, "work", {})).toBe("/office/emma/work");
  });
});

/* ---------------- Every adapter emits only Office hrefs -------------------- */

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
    updatedAt: "2026-07-28T00:00:00.000Z",
    ownerLabel: "Pilot",
    rawRequest: "",
  };
}

function draft(overrides?: Partial<MarketingContentDraft>): MarketingContentDraft {
  return {
    id: "d1",
    planActivityReference: "a1",
    contentType: "linkedin_post",
    channel: "linkedin",
    objective: "awareness",
    title: "Post",
    body: "Body copy",
    keywords: [],
    rationale: {} as MarketingContentDraft["rationale"],
    sourceReferences: [],
    confidence: "medium" as MarketingContentDraft["confidence"],
    status: "ready_for_review",
    warnings: [],
    generatedAt: "2026-07-28T00:00:00.000Z",
    ...overrides,
  };
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
  };
}

/** Walks any view model and collects every string that looks like a route. */
function collectHrefs(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") {
    if (value.startsWith("/")) found.push(value);
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectHrefs(item, found);
    return found;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectHrefs(item, found);
  }
  return found;
}

const rich = domain({
  projects: [project()],
  drafts: [draft(), draft({ id: "d2", status: "published" })],
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

const base = { peerName: "Emma", peerRole: "Marketing" as const };

describe("no Office view model emits a link outside the Office", () => {
  const models: [string, unknown][] = [
    ["desk", buildMarketingDeskViewModel({ domainInput: rich, ...base })],
    ["work", buildMarketingWorkViewModel({ domainInput: rich, ...base })],
    ["content", buildMarketingContentViewModel({ domainInput: rich, ...base })],
    [
      "performance",
      buildMarketingPerformanceViewModelForOffice({ domainInput: rich, ...base }),
    ],
    ["market", buildMarketingMarketViewModel({ domainInput: rich, ...base })],
    ["agreement", buildMarketingAgreementViewModel({ domainInput: rich, ...base })],
  ];

  for (const [name, model] of models) {
    it(`${name} emits only /office links`, () => {
      const hrefs = collectHrefs(model);
      const escaping = hrefs.filter((href) => !href.startsWith("/office/"));
      expect(escaping, `${name} leaked: ${escaping.join(", ")}`).toEqual([]);
    });

    it(`${name} emits at least one link`, () => {
      expect(collectHrefs(model).length).toBeGreaterThan(0);
    });
  }
});
