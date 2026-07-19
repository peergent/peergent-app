import { describe, expect, it } from "vitest";
import {
  buildWorkNarrative,
  createActivity,
  deriveCurrentFocus,
  deriveOnboardingSteps,
  derivePeerPresence,
  formatActivityTime,
  isOnboardingActive,
  resolveActivityTarget,
  respondToConversation,
  toConversationalRecommendations,
} from "../experience";
import { buildRecommendedActions } from "../recommendations";

describe("derivePeerPresence", () => {
  it("returns creating when generating a draft", () => {
    const presence = derivePeerPresence({
      generating: "draft",
      understandingAvailable: true,
      understandingCompleteness: 80,
      hasStrategy: true,
      hasPlan: true,
      pendingDraftCount: 0,
      hasApprovedDrafts: false,
      gapCount: 0,
    });
    expect(presence.id).toBe("creating");
  });

  it("does not show completed when strategy exists but plan does not", () => {
    const presence = derivePeerPresence({
      generating: null,
      understandingAvailable: true,
      understandingCompleteness: 80,
      hasStrategy: true,
      hasPlan: false,
      pendingDraftCount: 0,
      hasApprovedDrafts: false,
      gapCount: 0,
    });
    expect(presence.id).toBe("idle");
  });
});

describe("respondToConversation", () => {
  it("does not claim strategy was updated for audience focus", () => {
    const { peerReply } = respondToConversation("Focus more on installers.", {
      peerName: "Maya",
      understanding: null,
      strategy: null,
      plan: null,
      drafts: [],
    });
    expect(peerReply.content).toContain("haven't changed");
    expect(peerReply.content).not.toContain("I'll update");
  });

  it("offers a next step for audience focus", () => {
    const { nextStep } = respondToConversation("Focus on installers", {
      peerName: "Maya",
      understanding: null,
      strategy: null,
      plan: null,
      drafts: [],
    });
    expect(nextStep?.section).toBe("strategy");
  });
});

describe("buildWorkNarrative", () => {
  it("consolidates needs from pending drafts and gaps", () => {
    const narrative = buildWorkNarrative({
      generating: null,
      understanding: {
        available: true,
        completeness: 60,
        sparse: false,
        gaps: ["competitors"],
      } as never,
      strategy: null,
      plan: null,
      drafts: [
        {
          id: "1",
          title: "LinkedIn post",
          status: "draft",
          planActivityReference: "LinkedIn post",
        } as never,
      ],
      recommendedActions: [],
      apiWarnings: [],
    });
    expect(narrative.needsFromYou.some((n) => n.label.includes("LinkedIn post"))).toBe(true);
    expect(narrative.needsFromYou.some((n) => n.href?.includes("competitors"))).toBe(true);
    expect(narrative.progressCompleted).not.toContain("Today");
  });
});

describe("onboarding", () => {
  it("is active until a draft is approved", () => {
    const steps = deriveOnboardingSteps({
      understanding: { available: true, completeness: 70 } as never,
      strategy: { summary: "s" } as never,
      plan: { contentCalendar: [{ title: "Post" }] } as never,
      drafts: [{ id: "1", status: "draft", title: "Post" } as never],
    });
    expect(isOnboardingActive(steps)).toBe(true);
  });
});

describe("navigation", () => {
  it("maps strategy activity to strategy section", () => {
    const item = createActivity("strategy_completed", "Done", "Summary");
    expect(resolveActivityTarget(item)).toBe("strategy");
  });
});

describe("conversational recommendations", () => {
  it("uses forward-looking language for strategy", () => {
    const actions = buildRecommendedActions({
      understanding: { available: true, completeness: 70, sparse: false, gaps: [] } as never,
      strategy: null,
      plan: null,
      drafts: [],
    });
    const recs = toConversationalRecommendations(actions);
    const strategyRec = recs.find((r) => r.kind === "generate-strategy");
    expect(strategyRec?.peerMessage).toContain("When you're ready");
  });
});

describe("activity feed", () => {
  it("formats timestamps for display", () => {
    const item = createActivity("strategy_completed", "Done", "Summary");
    expect(formatActivityTime(item.timestamp)).toMatch(/\d{2}:\d{2}/);
  });
});

describe("deriveCurrentFocus", () => {
  it("shows pending draft when waiting for approval", () => {
    const focus = deriveCurrentFocus({
      generating: null,
      pendingDraftTitle: "LinkedIn launch post",
    });
    expect(focus.headline).toContain("waiting for your approval");
  });
});
