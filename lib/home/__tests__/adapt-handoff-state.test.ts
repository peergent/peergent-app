import { describe, expect, it } from "vitest";
import { adaptHandoffState } from "@/lib/home/adapt-handoff-state";
import { buildHomeViewModel } from "@/lib/home/build-home-view-model";
import { getHomeCopy } from "@/lib/i18n";
import type { PeerRow } from "@/lib/peer-display";

function makePeer(overrides: Partial<PeerRow> = {}): PeerRow {
  return {
    id: "peer-maya",
    name: "Maya",
    role: "Marketing",
    status: "active",
    website: "https://acme.com",
    objective: "Marketing",
    organization_id: "org-1",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function adaptFromViewModel(
  peers: PeerRow[],
  marketingSnapshots: Parameters<typeof buildHomeViewModel>[0]["marketingSnapshots"],
  understanding: Parameters<typeof buildHomeViewModel>[0]["understanding"] = null
) {
  const viewModel = buildHomeViewModel({
    peers,
    marketingSnapshots,
    understanding,
    lastVisitAt: null,
    locale: "en",
  });

  return adaptHandoffState({
    peers,
    marketingSnapshots,
    understanding,
    viewModel,
    locale: "en",
  });
}

describe("adaptHandoffState", () => {
  const copy = getHomeCopy("en");

  it("returns empty studio when there are no peers", () => {
    const state = adaptFromViewModel([], []);
    expect(state.scene).toBe("empty");
    expect(state.primaryWork?.destination).toBe("/website-intelligence");
  });

  it("maps draft review to completed handoff with draft title", () => {
    const peer = makePeer();
    const state = adaptFromViewModel(
      [peer],
      [
        {
          peer,
          workspace: {
            drafts: [
              {
                id: "draft-1",
                planActivityReference: "act-1",
                contentType: "blog_article",
                objective: "Launch",
                title: "Q1 Launch Post",
                body: "Body",
                keywords: [],
                rationale: {
                  why: "Launch",
                  planActivityReference: "act-1",
                  strategyLinks: [],
                },
                sourceReferences: [],
                confidence: "moderate",
                status: "ready_for_review",
                warnings: [],
                generatedAt: "2026-07-20T06:42:00.000Z",
              },
            ],
          },
        },
      ],
      {
        available: true,
        sparse: false,
        completeness: 80,
        gaps: [],
        brand: { values: [], toneOfVoice: { summary: "Calm" }, keyMessages: [] },
        products: [],
        services: [],
        customerSegments: [],
        competitors: [],
        goals: [],
        existingContent: [],
        assembledAt: "2026-01-01T00:00:00.000Z",
      }
    );

    expect(state.scene).toBe("completed");
    expect(state.primaryWork?.title).toBe("Q1 Launch Post");
    expect(state.briefingLines[0]).toContain("q1 launch post");
    expect(state.responsiblePeer?.name).toBe("Maya");
  });

  it("maps publication confirmation to urgent scene", () => {
    const peer = makePeer();
    const viewModel = buildHomeViewModel({
      peers: [peer],
      marketingSnapshots: [
        {
          peer,
          workspace: {
            drafts: [
              {
                id: "draft-1",
                planActivityReference: "act-1",
                contentType: "blog_article",
                objective: "Launch",
                title: "Launch Post",
                body: "Body",
                keywords: [],
                rationale: {
                  why: "Launch",
                  planActivityReference: "act-1",
                  strategyLinks: [],
                },
                sourceReferences: [],
                confidence: "moderate",
                status: "ready_to_publish",
                warnings: [],
                generatedAt: "2026-07-20T06:42:00.000Z",
              },
            ],
          },
        },
      ],
      understanding: {
        available: true,
        sparse: false,
        completeness: 80,
        gaps: [],
        brand: { values: [], toneOfVoice: { summary: "Calm" }, keyMessages: [] },
        products: [],
        services: [],
        customerSegments: [],
        competitors: [],
        goals: [],
        existingContent: [],
        assembledAt: "2026-01-01T00:00:00.000Z",
      },
      lastVisitAt: null,
      locale: "en",
    });

    const state = adaptHandoffState({
      peers: [peer],
      marketingSnapshots: [
        {
          peer,
          workspace: {
            drafts: viewModel.needsYou.length ? [] : [],
          },
        },
      ],
      understanding: null,
      viewModel,
      locale: "en",
    });

    expect(viewModel.needsYou[0]?.title).toBe(copy.needsYouItems.confirmPublication);
    expect(state.scene).toBe("urgent");
    expect(state.briefingLines[0]).toContain("before we can publish");
  });
});
