import { describe, expect, it } from "vitest";
import {
  buildMarketingContentViewModel,
  contentStringsAreClean,
} from "@/lib/office/content/build-marketing-content";
import type { MarketingPeerDomainInput } from "@/lib/peer-experience/marketing/view-models/marketing-peer-domain-input";
import type { MarketingContentDraft } from "@/lib/marketing-intelligence";
import type { MarketingProject } from "@/lib/peer-experience/marketing/projects/types";
import {
  createWorkUnit,
  revertWorkUnitFromFailedExecution,
} from "@/lib/peer-workflow/work-unit-engine";

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

function draft(overrides?: Partial<MarketingContentDraft>): MarketingContentDraft {
  return {
    id: "d1",
    planActivityReference: "a1",
    contentType: "linkedin_post",
    channel: "linkedin",
    objective: "awareness",
    title: "Why we rebuilt onboarding",
    body: "We spent six weeks watching people fail at the first screen. Here is what we changed and why it mattered.",
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

function unit(overrides?: {
  draftId?: string | null;
  projectId?: string;
  reference?: string;
  status?: string;
}) {
  const created = createWorkUnit({
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
    projectId: overrides?.projectId ?? "p1",
    planActivityReference: overrides?.reference ?? "a1",
  });
  return {
    ...created,
    draftId: overrides?.draftId === undefined ? "d1" : overrides.draftId,
  };
}

function build(input: MarketingPeerDomainInput, search?: string, locale?: string) {
  return buildMarketingContentViewModel({
    domainInput: input,
    peerName: "Emma",
    peerRole: "Marketing",
    localePreference: locale,
    searchParams: search ? new URLSearchParams(search) : undefined,
  });
}

function allItems(model: ReturnType<typeof build>) {
  return model.groups.flatMap((g) => g.items);
}

describe("Content — states are separated", () => {
  it("maps each draft status onto its customer-facing state", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", status: "draft" }),
          draft({ id: "b", status: "ready_for_review" }),
          draft({ id: "c", status: "approved" }),
          draft({ id: "d", status: "ready_to_publish" }),
          draft({ id: "e", status: "published" }),
        ],
      })
    );

    const byId = new Map(allItems(model).map((i) => [i.id, i.state]));
    expect(byId.get("a")).toBe("draft");
    expect(byId.get("b")).toBe("awaiting_review");
    // Approved without a work unit at the scheduled stage stays approved —
    // claiming a schedule we cannot evidence would be an invention.
    expect(byId.get("c")).toBe("approved");
    expect(byId.get("d")).toBe("approved");
    expect(byId.get("e")).toBe("published");
  });

  it("separates scheduled from approved only on a real lifecycle signal", () => {
    const scheduledUnit = { ...unit({ draftId: "c" }), status: "scheduled" as const };
    const model = build(
      domain({
        drafts: [draft({ id: "c", status: "approved" })],
        workUnits: [scheduledUnit],
      })
    );
    expect(allItems(model).find((i) => i.id === "c")?.state).toBe("scheduled");
  });

  it("shows work that has produced nothing yet as planned", () => {
    const model = build(
      domain({ workUnits: [unit({ draftId: null })], projects: [project()] })
    );
    const planned = allItems(model).filter((i) => i.state === "planned");
    expect(planned).toHaveLength(1);
    // Nothing has been written, so an excerpt would be an invention.
    expect(planned[0]?.preview).toBeNull();
  });

  it("only offers review on items that are actually awaiting it", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", status: "ready_for_review" }),
          draft({ id: "b", status: "published" }),
        ],
      })
    );
    const byId = new Map(allItems(model).map((i) => [i.id, i.canReview]));
    expect(byId.get("a")).toBe(true);
    expect(byId.get("b")).toBe(false);
  });
});

describe("Content — never fabricates outcomes", () => {
  it("shows no performance when no source reports", () => {
    const model = build(domain({ drafts: [draft({ status: "published" })] }));
    for (const item of allItems(model)) {
      expect(item.performance).toBeNull();
    }
  });

  it("states the absence on published work rather than leaving it blank", () => {
    const model = build(domain({ drafts: [draft({ status: "published" })] }));
    const published = allItems(model).find((i) => i.state === "published");
    expect(published?.performanceAbsence).toBeTruthy();
    expect(published?.performanceAbsence?.toLowerCase()).toContain("reporting");
  });

  it("does not claim absence for work that has not gone out", () => {
    const model = build(domain({ drafts: [draft({ status: "draft" })] }));
    expect(allItems(model)[0]?.performanceAbsence).toBeNull();
  });

  it("previews the real content rather than describing it", () => {
    const model = build(domain({ drafts: [draft()] }));
    expect(allItems(model)[0]?.preview).toContain("six weeks watching people fail");
  });

  it("returns no preview when there is no body to show", () => {
    const model = build(domain({ drafts: [draft({ body: "   " })] }));
    expect(allItems(model)[0]?.preview).toBeNull();
  });
});

describe("Content — publishing failure", () => {
  const failedUnit = revertWorkUnitFromFailedExecution(
    unit(),
    "LinkedIn API rejected the payload with 503"
  );

  it("surfaces a failure as its own state", () => {
    const model = build(
      domain({ drafts: [draft()], workUnits: [failedUnit] })
    );
    expect(allItems(model).some((i) => i.state === "failed")).toBe(true);
  });

  it("speaks in her voice and never leaks the underlying error", () => {
    const model = build(
      domain({ drafts: [draft()], workUnits: [failedUnit] })
    );
    const failed = allItems(model).find((i) => i.state === "failed");

    expect(failed?.failure?.voice).toContain("couldn't publish");
    expect(failed?.failure?.voice).not.toContain("503");
    expect(failed?.failure?.voice).not.toContain("API");
    expect(failed?.failure?.voice).not.toContain("payload");
  });

  it("states that the work is preserved and offers a way back", () => {
    const model = build(
      domain({ drafts: [draft()], workUnits: [failedUnit] })
    );
    const failed = allItems(model).find((i) => i.state === "failed");
    expect(failed?.failure?.preserved.toLowerCase()).toContain("nothing is lost");
    expect(failed?.failure?.retryLabel).toBeTruthy();
  });

  it("leads the presence line with the failure, ahead of anything else", () => {
    const model = build(
      domain({
        drafts: [draft(), draft({ id: "d2", status: "published" })],
        workUnits: [failedUnit],
      })
    );
    expect(model.presence.rung).toBe("fault");
    expect(model.presence.text.toLowerCase()).toContain("nothing is lost");
  });
});

describe("Content — grounded, non-generic copy", () => {
  it("names this customer's own channel and counts", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", status: "published", channel: "linkedin" }),
          draft({ id: "b", status: "published", channel: "linkedin" }),
          draft({ id: "c", status: "published", channel: "linkedin" }),
        ],
      })
    );
    expect(model.presence.rung).toBe("interpretation");
    expect(model.presence.text).toContain("LinkedIn");
    expect(model.presence.text).toContain("3");
  });

  it("declines to interpret a corpus too small to read", () => {
    const model = build(
      domain({ drafts: [draft({ status: "published" })] })
    );
    expect(model.presence.rung).toBe("observation");
  });

  it("orients when nothing exists at all", () => {
    const model = build(domain());
    expect(model.presence.rung).toBe("orientation");
    expect(model.empty).not.toBeNull();
  });

  it("points at the unblock when work is waiting on approval", () => {
    const model = build(domain({ drafts: [draft()] }));
    expect(model.presence.text.toLowerCase()).toContain("waiting on your approval");
  });

  it("keeps machine vocabulary out of every customer-facing string", () => {
    const model = build(
      domain({
        drafts: [draft(), draft({ id: "d2", status: "published" })],
        workUnits: [
          revertWorkUnitFromFailedExecution(unit({ draftId: "d2" }), "boom"),
        ],
      })
    );
    expect(contentStringsAreClean(model)).toBe(true);
  });
});

describe("Content — attribution and filtering", () => {
  it("attributes content to a campaign by stable id, not by title", () => {
    const model = build(
      domain({
        drafts: [draft()],
        workUnits: [unit({ projectId: "p1" })],
        projects: [project({ id: "p1", title: "Launch" })],
      })
    );
    const item = allItems(model)[0];
    expect(item?.campaignId).toBe("p1");
    expect(item?.campaignTitle).toBe("Launch");
  });

  it("still attributes when the unit has no draft id, via the plan reference", () => {
    const model = build(
      domain({
        drafts: [draft({ id: "orphan", planActivityReference: "a9" })],
        workUnits: [unit({ draftId: null, projectId: "p2", reference: "a9" })],
        projects: [project({ id: "p2", title: "Second" })],
      })
    );
    const item = allItems(model).find((i) => i.id === "orphan");
    expect(item?.campaignId).toBe("p2");
  });

  it("filters by state", () => {
    const model = build(
      domain({
        drafts: [
          draft({ id: "a", status: "published" }),
          draft({ id: "b", status: "ready_for_review" }),
        ],
      }),
      "state=published"
    );
    expect(allItems(model)).toHaveLength(1);
    expect(allItems(model)[0]?.id).toBe("a");
  });

  it("ignores an unknown state filter rather than showing nothing", () => {
    const model = build(domain({ drafts: [draft()] }), "state=banana");
    expect(model.filters.state).toBeNull();
    expect(allItems(model)).toHaveLength(1);
  });
});

describe("Content — archive search, ordering and pagination", () => {
  const corpus = Array.from({ length: 30 }, (_, i) =>
    draft({
      id: `d${String(i).padStart(2, "0")}`,
      title: `Piece ${i}`,
      body: i === 7 ? "A note about pricing strategy" : "Ordinary body copy",
      status: "published",
      generatedAt: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    })
  );

  it("orders newest first with a stable tie-break", () => {
    const a = build(domain({ drafts: corpus }));
    const b = build(domain({ drafts: corpus }));
    expect(allItems(a).map((i) => i.id)).toEqual(allItems(b).map((i) => i.id));

    const dates = allItems(a).map((i) => i.sortAt ?? "");
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("paginates deterministically without dropping or repeating items", () => {
    const page1 = build(domain({ drafts: corpus }));
    const page2 = build(domain({ drafts: corpus }), "page=2");

    expect(page1.pagination.pageCount).toBe(2);
    expect(page1.pagination.total).toBe(30);
    expect(allItems(page1)).toHaveLength(24);
    expect(allItems(page2)).toHaveLength(6);

    const ids = new Set([
      ...allItems(page1).map((i) => i.id),
      ...allItems(page2).map((i) => i.id),
    ]);
    expect(ids.size).toBe(30);
    expect(page1.pagination.nextHref).toContain("page=2");
    expect(page2.pagination.prevHref).not.toContain("page=");
  });

  it("clamps an out-of-range page rather than showing nothing", () => {
    const model = build(domain({ drafts: corpus }), "page=99");
    expect(model.pagination.page).toBe(2);
    expect(allItems(model).length).toBeGreaterThan(0);
  });

  it("searches body text, not just titles", () => {
    const model = build(domain({ drafts: corpus }), "q=pricing");
    expect(allItems(model)).toHaveLength(1);
    expect(allItems(model)[0]?.id).toBe("d07");
  });

  it("searches channel, campaign and status too", () => {
    const input = domain({
      drafts: [draft({ id: "x", status: "published", channel: "linkedin" })],
      workUnits: [unit({ draftId: "x", projectId: "p1" })],
      projects: [project({ id: "p1", title: "Autumn push" })],
    });
    expect(allItems(build(input, "q=linkedin"))).toHaveLength(1);
    expect(allItems(build(input, "q=autumn"))).toHaveLength(1);
    expect(allItems(build(input, "q=published"))).toHaveLength(1);
  });

  it("requires every term to match", () => {
    const model = build(domain({ drafts: corpus }), "q=pricing+nonsense");
    expect(allItems(model)).toHaveLength(0);
  });

  it("says what found nothing rather than looking empty", () => {
    const model = build(domain({ drafts: corpus }), "q=zzzz");
    expect(model.noSearchResults).toContain("zzzz");
  });

  it("resets to the first page when a filter changes", () => {
    const model = build(domain({ drafts: corpus }), "page=2");
    const stateFilter = model.filterGroups.find((g) => g.id === "state");
    for (const option of stateFilter?.options ?? []) {
      expect(option.href).not.toContain("page=");
    }
  });
});

describe("Content — localization", () => {
  it("renders Dutch copy and Dutch state labels", () => {
    const model = build(domain({ drafts: [draft()] }), undefined, "nl");
    expect(model.copy.title).toBe("Content");
    expect(model.copy.askForChangesCta).toBe("Vraag om aanpassingen");
    expect(
      model.groups.some((g) => g.title === "Wacht op jouw goedkeuring")
    ).toBe(true);
  });
});
