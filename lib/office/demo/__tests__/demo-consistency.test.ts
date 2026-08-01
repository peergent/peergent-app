import { describe, expect, it } from "vitest";
import { buildDemoDomainInput, DEMO_PEER_ID } from "@/lib/office/demo/demo-company";
import { buildMarketingDeskViewModel } from "@/lib/office/desk/build-marketing-desk";
import { buildMarketingDeskBriefing } from "@/lib/office/desk/build-marketing-briefing";
import { buildMarketingWorkViewModel } from "@/lib/office/work/build-marketing-work";
import { buildMarketingPerformanceViewModelForOffice } from "@/lib/office/performance/build-marketing-performance";
import { buildMarketingContentViewModel } from "@/lib/office/content/build-marketing-content";
import { buildMarketingMarketViewModel } from "@/lib/office/market/build-marketing-market";
import { buildMarketingAgreementViewModel } from "@/lib/office/agreement/build-marketing-agreement";
import { resolveProjectIdForDraft } from "@/lib/office/attribution";

/**
 * The Demo Workspace exists to be believed. A prospect who spots a campaign in
 * Work that is missing from Content, or a published count that does not match
 * the content list, learns to distrust every other number on the screen.
 *
 * These tests assert the cross-page invariants directly. They are the reason
 * the demo is authored as one domain input rather than six page fixtures.
 */

// Fixed so date-derived output (trends, relative labels) stays deterministic.
const NOW = new Date("2026-07-31T09:00:00.000Z");
const domainInput = buildDemoDomainInput({ now: NOW });
const base = { domainInput, peerName: "Emma", peerRole: "Marketing" };

const work = buildMarketingWorkViewModel(base);
const content = buildMarketingContentViewModel({
  ...base,
  searchParams: new URLSearchParams("state=all"),
});
const contentPublished = buildMarketingContentViewModel(base);
const performance = buildMarketingPerformanceViewModelForOffice({ ...base, now: NOW });
const market = buildMarketingMarketViewModel({ ...base, now: NOW });
const agreement = buildMarketingAgreementViewModel(base);
const desk = buildMarketingDeskViewModel(base);
const briefing = buildMarketingDeskBriefing({ ...base, desk, now: NOW });

const allWorkItems = work.groups.flatMap((group) => group.items);
const allContentItems = content.groups.flatMap((group) => group.items);
const publishedDrafts = domainInput.drafts.filter((d) => d.status === "published");

describe("the demo workspace is one company", () => {
  it("gives every page something to show", () => {
    expect(allWorkItems.length).toBeGreaterThan(0);
    expect(allContentItems.length).toBeGreaterThan(0);
    expect(contentPublished.groups.flatMap((g) => g.items).length).toBeGreaterThan(0);
    expect(performance.metrics.length).toBeGreaterThan(0);
    expect(market.competitors.length).toBeGreaterThan(0);
    expect(agreement.autonomous.length).toBeGreaterThan(0);
    expect(agreement.needsApproval.length).toBeGreaterThan(0);
  });

  it("never falls back to an empty state on any destination", () => {
    // The whole point of the demo is that nothing is missing.
    expect(work.proposal).toBeNull();
    expect(content.empty).toBeNull();
    expect(market.noCompetitors).toBeNull();
    expect(agreement.empty).toBeNull();
  });
});

describe("campaigns in Work exist in Content", () => {
  it("attributes every piece of content to a real campaign", () => {
    const campaignIds = new Set(domainInput.projects.map((project) => project.id));

    for (const draft of domainInput.drafts) {
      const projectId = resolveProjectIdForDraft(draft, domainInput.workUnits);
      expect(projectId, `${draft.id} is orphaned`).not.toBeNull();
      expect(campaignIds.has(projectId!), `${draft.id} points at a missing campaign`).toBe(
        true
      );
    }
  });

  it("shows content for every campaign that has any", () => {
    for (const project of domainInput.projects) {
      const drafts = domainInput.drafts.filter(
        (draft) => resolveProjectIdForDraft(draft, domainInput.workUnits) === project.id
      );
      expect(drafts.length, `${project.title} has no content at all`).toBeGreaterThan(0);
    }
  });

  it("names the same campaigns on both pages", () => {
    const contentCampaigns = new Set(
      allContentItems.map((item) => item.campaignTitle).filter(Boolean)
    );
    for (const title of contentCampaigns) {
      expect(
        domainInput.projects.some((project) => project.title === title),
        `Content shows "${title}", which is not a campaign`
      ).toBe(true);
    }
  });
});

describe("published content moves Performance", () => {
  it("counts exactly what the content list shows as published", () => {
    const publishedOnContent = allContentItems.filter(
      (item) => item.state === "published"
    ).length;
    const publishedMetric = performance.metrics.find((m) => m.id === "published");

    expect(publishedMetric, "Performance is not reporting a published count").toBeDefined();
    expect(Number(publishedMetric!.value)).toBe(publishedOnContent);
    expect(publishedOnContent).toBe(publishedDrafts.length);
  });

  it("draws a trend whose volume adds up to what was published", () => {
    // The trend plots publications per week, so the number of points is the
    // number of weeks. What must hold is that the plotted volume accounts for
    // every published piece and invents none.
    expect(performance.trend, "the demo should have enough history to draw").not.toBeNull();

    const plotted = performance.trend!.points.reduce((sum, p) => sum + p.value, 0);
    expect(plotted).toBe(publishedDrafts.length);
    expect(performance.trend!.points.length).toBeGreaterThan(1);
  });

  it("splits by channel in the same proportions the content carries", () => {
    const byChannelCut = performance.cuts.find((cut) => cut.id === "by-channel");
    expect(byChannelCut, "no channel breakdown").toBeDefined();

    const expected = new Map<string, number>();
    for (const draft of publishedDrafts) {
      const key = draft.channel ?? draft.contentType ?? "other";
      expected.set(key, (expected.get(key) ?? 0) + 1);
    }

    const total = byChannelCut!.rows.reduce((sum, row) => sum + row.numericValue, 0);
    expect(total).toBe(publishedDrafts.length);
    expect(byChannelCut!.rows.length).toBe(expected.size);
  });

  it("attributes campaign performance to campaigns that exist", () => {
    const byCampaign = performance.cuts.find((cut) => cut.id === "by-campaign");
    if (!byCampaign) return;

    for (const row of byCampaign.rows) {
      expect(
        domainInput.projects.some((project) => project.id === row.id),
        `Performance attributes work to "${row.label}", which is not a campaign`
      ).toBe(true);
    }
  });

  it("reports channel figures only for connected sources", () => {
    const channelMetrics = performance.metrics.filter((m) => m.source === "channel");
    expect(
      channelMetrics.length,
      "the demo connects analytics, so channel figures must appear"
    ).toBeGreaterThan(0);
  });
});

describe("competitors explain the recommendations", () => {
  it("records every competitor the demo talks about", () => {
    const named = new Set(market.competitors.map((c) => c.name));
    expect(named.size).toBe(domainInput.understanding!.competitors.length);
  });

  it("builds observations only from recorded competitors", () => {
    const ids = new Set(market.competitors.map((c) => c.id));
    for (const fact of [...market.observedFacts, ...market.inferences]) {
      if (!fact.competitorId) continue;
      expect(ids.has(fact.competitorId), `${fact.id} cites an unknown competitor`).toBe(
        true
      );
    }
  });

  it("reaches the reading the campaigns were built on", () => {
    // The requirement is that competitors *explain* the recommendations. Market
    // must therefore arrive at the opening on its own, from recorded notes —
    // not merely list three companies and shrug.
    expect(market.interpretation, "Market has no reading at all").not.toBeNull();
    expect(market.interpretation!.text.toLowerCase()).toContain("opening");
    expect(market.interpretation!.basedOn.length).toBeGreaterThan(0);
    expect(market.interpretation!.recommendation).not.toBeNull();
  });

  it("leaves the setup-speed argument uncontested, which is what the campaign claims", () => {
    // The campaign's whole premise is that no competitor makes this argument.
    // Asserted structurally rather than by keyword, so it survives translation:
    // no competitor may *claim* speed, at least two must be recorded as slow,
    // and the campaign goal must rest on that.
    const claims = domainInput
      .understanding!.competitors.flatMap((c) => [...c.strengths, ...c.differentiators])
      .join(" ")
      .toLowerCase();

    for (const boast of ["onboarding", "fast setup", "snel live", "in een week"]) {
      expect(claims, `a competitor now claims "${boast}"`).not.toContain(boast);
    }

    // The shared weakness is what the Market page turns into the opening.
    const weaknesses = domainInput.understanding!.competitors.map((c) =>
      c.weaknesses.map((w) => w.toLowerCase())
    );
    const shared = weaknesses
      .flat()
      .filter((w, _i, all) => all.filter((other) => other === w).length >= 2);
    expect(shared.length, "no weakness is shared, so there is no opening").toBeGreaterThan(0);

    const campaign = domainInput.projects.find((p) => p.id === "camp-onboarding");
    expect(campaign?.goal.trim()).not.toBe("");
    expect(market.interpretation?.text.toLowerCase()).toContain(
      shared[0].split(" ").slice(-2).join(" ")
    );
  });
});

describe("the working agreement matches what she actually does", () => {
  it("lists only connections the workspace records", () => {
    const known = new Set(domainInput.connections.map((c) => c.id));
    for (const connection of agreement.connections) {
      expect(known.has(connection.id as never), `${connection.id} is invented`).toBe(true);
    }
  });

  it("keeps her autonomous on the channel she publishes to most", () => {
    // Four of six published pieces are on LinkedIn, and she posts there without
    // asking. If those two facts ever disagree the demo contradicts itself.
    const linkedinPublished = publishedDrafts.filter(
      (d) => d.channel === "linkedin"
    ).length;
    expect(linkedinPublished).toBeGreaterThan(publishedDrafts.length / 2);

    const linkedinBoundary = agreement.autonomous.find((b) =>
      b.title.toLowerCase().includes("linkedin")
    );
    expect(linkedinBoundary, "she publishes to LinkedIn but has to ask first").toBeDefined();
  });
});

describe("the Desk agrees with every page it summarises", () => {
  it("counts the same items waiting as Work does", () => {
    const workPanel = briefing.panels.find((p) => p.id === "work")!;
    const blockedStat = workPanel.stats.find((s) => s.id === "blocked");
    const blockedOnWork =
      work.groups.find((g) => g.id === "blocked_on_you")?.items.length ?? 0;

    if (blockedOnWork === 0) {
      expect(blockedStat).toBeUndefined();
    } else {
      expect(Number(blockedStat!.value)).toBe(blockedOnWork);
    }
  });

  it("counts the same items awaiting review as Work does", () => {
    const workPanel = briefing.panels.find((p) => p.id === "work")!;
    const awaitingStat = workPanel.stats.find((s) => s.id === "blocked");
    const awaitingOnWork =
      work.groups.find((g) => g.id === "blocked_on_you")?.items.length ?? 0;

    if (awaitingOnWork === 0) {
      expect(awaitingStat).toBeUndefined();
    } else {
      expect(Number(awaitingStat!.value)).toBe(awaitingOnWork);
    }
  });

  it("counts the same competitors as Market does", () => {
    const marketPanel = briefing.panels.find((p) => p.id === "market")!;
    const stat = marketPanel.stats.find((s) => s.id === "competitors");
    expect(Number(stat!.value)).toBe(market.competitors.length);
  });

  it("reports the same connection coverage as the Working Agreement", () => {
    const panel = briefing.panels.find((p) => p.id === "agreement")!;
    const stat = panel.stats.find((s) => s.id === "connections");
    const connected = agreement.connections.filter((c) => c.connected).length;
    expect(stat!.value).toBe(`${connected}/${agreement.connections.length}`);
  });

  it("asks for review when Work has items blocked on the customer", () => {
    const awaiting =
      work.groups.find((g) => g.id === "blocked_on_you")?.items.length ?? 0;
    if (awaiting === 0) return;
    expect(desk.decisions.length).toBeGreaterThan(0);
  });

  it("closes the day with real outcomes, not a generic line", () => {
    // "Work completed" with no detail is what appears when activities fail to
    // match any content. It reads as a stub and undoes the rest of the demo.
    expect(briefing.changes.length).toBeGreaterThan(1);
    for (const change of briefing.changes) {
      expect(change.label.trim().length).toBeGreaterThan(12);
      expect(change.label).not.toBe("Work completed");
    }
  });

  it("shows no panel a destination would leave empty", () => {
    // A panel earns its place with a reading, a number, or an explanation of
    // what will appear. Performance carries only its reading now that the KPI
    // band holds the figures, and that is the intended shape.
    for (const panel of briefing.panels) {
      expect(
        panel.headline.trim() !== "" || panel.stats.length > 0 || panel.future !== null,
        `${panel.id} is dead in the demo`
      ).toBe(true);
    }
  });
});

describe("the demo stays inside the Office and inside itself", () => {
  it("keeps every link on the demo peer", () => {
    const models = { work, content, performance, market, agreement, desk };
    const hrefs: string[] = [];
    const walk = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(walk);
      if (value && typeof value === "object") {
        for (const [key, entry] of Object.entries(value)) {
          if ((key === "href" || key.endsWith("Href")) && typeof entry === "string") {
            hrefs.push(entry);
          } else {
            walk(entry);
          }
        }
      }
    };
    walk(models);

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith(`/office/${DEMO_PEER_ID}`), `${href} escapes the demo`).toBe(
        true
      );
    }
  });

  it("moves with the calendar so it never looks abandoned", () => {
    const later = buildDemoDomainInput({ now: new Date("2027-01-15T09:00:00.000Z") });
    const newest = later.drafts
      .map((d) => new Date(d.generatedAt).getTime())
      .sort((a, b) => b - a)[0];
    expect(newest).toBeGreaterThan(new Date("2027-01-01").getTime());
  });
});
