import { describe, expect, it } from "vitest";
import {
  createWorkUnit,
  syncWorkUnitFromMarketingState,
  transitionWorkUnit,
} from "@/lib/peer-workflow/work-unit-engine";
import { WORK_LIFECYCLE_STAGES } from "@/lib/peer-workflow/work-lifecycle";

describe("work-unit-engine", () => {
  it("creates a unit at requested and advances through lifecycle", () => {
    const unit = createWorkUnit({
      peerId: "peer-1",
      role: "Marketing",
      title: "Instagram campaign",
      deliverableKind: "instagram",
      channel: "Instagram",
      objective: "Lead generation",
      audience: "Founders",
      needsVisual: true,
      recurrence: "once",
      rawRequest: "Create an Instagram campaign with an image",
    });

    expect(unit.status).toBe("requested");
    expect(unit.eventLog).toHaveLength(1);

    const understanding = transitionWorkUnit(
      unit,
      "understanding",
      "understanding_started",
      "Understanding request"
    );
    expect(understanding.status).toBe("understanding");

    const creating = transitionWorkUnit(
      understanding,
      "creating",
      "creation_started",
      "Creating deliverable"
    );
    expect(creating.status).toBe("creating");
  });

  it("syncs draft status to review_ready and beyond without skipping stages", () => {
    let unit = createWorkUnit({
      peerId: "peer-1",
      role: "Marketing",
      title: "LinkedIn post",
      deliverableKind: "linkedin",
      channel: "LinkedIn",
      objective: null,
      audience: null,
      needsVisual: false,
      recurrence: "once",
      rawRequest: "Write a LinkedIn post",
    });

    unit = transitionWorkUnit(unit, "creating", "creation_started", "Creating");

    const draft = {
      id: "draft-1",
      planActivityReference: "Post",
      contentType: "linkedin_post" as const,
      status: "ready_for_review" as const,
      title: "Launch post",
      body: "Body",
      objective: "",
      keywords: [],
      rationale: { why: "Test", planActivityReference: "Post", strategyLinks: [] },
      sourceReferences: [],
      confidence: "high" as const,
      warnings: [],
      generatedAt: new Date().toISOString(),
    };

    const synced = syncWorkUnitFromMarketingState({
      unit,
      generating: null,
      draft,
    });

    expect(synced.draftId).toBe("draft-1");
    expect(synced.status).toBe("review_ready");
    expect(synced.artifacts.some((a) => a.kind === "draft")).toBe(true);
  });

  it("uses universal lifecycle stages only", () => {
    expect(WORK_LIFECYCLE_STAGES).toHaveLength(10);
    expect(WORK_LIFECYCLE_STAGES[0]).toBe("requested");
    expect(WORK_LIFECYCLE_STAGES.at(-1)).toBe("optimizing");
  });
});
