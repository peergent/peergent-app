import { describe, expect, it } from "vitest";
import { buildDemoDomainInput } from "@/lib/office/demo/demo-company";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";

/**
 * Presence, Attention and the Focus Anchor are three different things that were
 * previously fighting over one slot. These tests hold them apart:
 *
 * - Presence may say "two items need your review"
 * - Attention may list those two items
 * - the Anchor must still say what the work *is*
 *
 * and none of the three may make a claim the destinations cannot support.
 */

const NOW = new Date("2026-07-31T09:00:00.000Z");
const base = { peerName: "Emma", peerRole: "Marketing" };

function briefingFor(domainInput: MarketingPeerDomainInput) {
  const desk = buildMarketingDeskViewModel({ domainInput, ...base });
  const work = buildMarketingWorkViewModel({ domainInput, ...base });
  const briefing = buildMarketingDeskBriefing({ domainInput, desk, ...base, now: NOW });
  return { desk, work, briefing };
}

function emptyDomain(): MarketingPeerDomainInput {
  return {
    peerId: "empty",
    userName: "Pilot",
    peerName: "Emma",
    campaignTitle: "None",
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
  };
}

const demo = briefingFor(buildDemoDomainInput({ now: NOW }));

describe("the Desk always has a subject", () => {
  it("gives the Demo Workspace a focus anchor", () => {
    expect(demo.briefing.focus).toBeDefined();
    expect(demo.briefing.focus.headline.trim()).not.toBe("");
    expect(demo.briefing.focus.eyebrow.trim()).not.toBe("");
  });

  it("still has one when nothing exists at all", () => {
    // The calm state is the floor of the ladder, not an absence. Crucially the
    // anchor must not reach for the workspace's campaign title here: nothing
    // by that name exists, and naming it would be the fabrication the whole
    // grounding rule exists to prevent.
    const { briefing } = briefingFor(emptyDomain());
    expect(briefing.focus.headline.trim()).not.toBe("");
    expect(["recommendation", "calm"]).toContain(briefing.focus.source);
    expect(briefing.focus.subjectId).toBeNull();
    expect(briefing.focus.headline).not.toContain("None");
  });
});

describe("Presence and the Focus Anchor coexist without contradiction", () => {
  it("keeps the anchor even when presence is a request for the customer", () => {
    // This is the case that used to produce an empty hero: the ladder promotes
    // the review request, and the work context had nowhere left to go.
    expect(demo.desk.presence?.rung).toBe("interpretation");
    expect(demo.briefing.focus.headline.trim()).not.toBe("");
  });

  it("never uses a blocked item as the subject of the day", () => {
    // Work waiting on the customer is Attention. Promoting it to the anchor
    // would recreate the collision this concept exists to resolve.
    const blocked =
      demo.work.groups.find((group) => group.id === "blocked_on_you")?.items ?? [];
    expect(blocked.length).toBeGreaterThan(0);

    const blockedIds = new Set(blocked.map((item) => item.id));
    expect(blockedIds.has(demo.briefing.focus.subjectId ?? "")).toBe(false);
  });

  it("does not repeat the presence sentence back as the anchor", () => {
    expect(demo.briefing.focus.headline).not.toBe(demo.desk.presence?.text);
  });
});

describe("the anchor cannot name work that does not exist", () => {
  it("resolves its subject to something a destination is showing", () => {
    const focus = demo.briefing.focus;
    // Only a recommendation or the calm state may be subjectless: neither
    // describes an item that exists yet.
    if (focus.source === "recommendation" || focus.source === "calm") {
      expect(focus.subjectId).toBeNull();
      return;
    }

    expect(focus.subjectId, `${focus.source} anchor has no subject`).not.toBeNull();

    // Only Work's own item ids count. The Desk's in-flight entry carries a
    // constant id and can fall back to a campaign title that does not exist,
    // so it may never be the sole evidence for an anchor.
    const knownIds = new Set(
      demo.work.groups.flatMap((group) => group.items.map((item) => item.id))
    );
    expect(
      knownIds.has(focus.subjectId!),
      `anchor names "${focus.subjectId}", which no destination shows`
    ).toBe(true);
  });

  it("quotes the item's own words rather than composing new ones", () => {
    const focus = demo.briefing.focus;
    if (focus.source === "recommendation" || focus.source === "calm") return;

    const items = demo.work.groups.flatMap((group) => group.items);
    const subject = items.find((item) => item.id === focus.subjectId);
    expect(subject).toBeDefined();
    expect(focus.headline).toBe(subject!.name);
  });

  it("keeps the anchor's link inside the Office", () => {
    if (!demo.briefing.focus.href) return;
    expect(demo.briefing.focus.href.startsWith("/office/")).toBe(true);
  });
});

describe("attention stays consistent wherever it is counted", () => {
  it("agrees between the decision list, the rail badge and the Work page", () => {
    const blockedOnWork =
      demo.work.groups.find((group) => group.id === "blocked_on_you")?.items.length ?? 0;
    const workPanel = demo.briefing.panels.find((panel) => panel.id === "work")!;
    const blockedStat = workPanel.stats.find((stat) => stat.id === "blocked");

    expect(Number(blockedStat!.value)).toBe(blockedOnWork);
    // The rail badge renders desk.decisions.length; it counts decision cards,
    // which group by campaign, so it may be fewer than the items themselves.
    expect(demo.desk.decisions.length).toBeGreaterThan(0);
    expect(demo.desk.decisions.length).toBeLessThanOrEqual(blockedOnWork + 1);
  });

  it("points the next step at the decision when one is waiting", () => {
    expect(demo.briefing.nextStep?.label).toBe(demo.desk.decisions[0]?.title);
  });
});
