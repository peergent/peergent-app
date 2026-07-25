import { describe, expect, it } from "vitest";
import { buildMarketingViewModel } from "@/lib/peer-experience";
import { milestoneTimelineNodeId } from "@/lib/marketing-workspace/timeline-nodes";
import type { MarketingUnderstanding } from "@/lib/marketing-intelligence";

const understanding: MarketingUnderstanding = {
  available: true,
  sparse: false,
  completeness: 80,
  gaps: [],
  brand: { values: [], toneOfVoice: {}, keyMessages: [] },
  products: [],
  services: [],
  customerSegments: [],
  competitors: [],
  goals: [],
  existingContent: [],
  assembledAt: "",
};

const baseInput = {
  generating: null,
  understanding,
  strategy: null,
  plan: null,
  drafts: [],
  selectedTimelineNodeId: null,
  profileCounts: { goals: 0, content: 0 },
  activityFeed: [],
};

describe("buildMarketingViewModel timeline", () => {
  it("includes human-readable milestone labels without lifecycle enums", () => {
    const viewModel = buildMarketingViewModel(baseInput);

    expect(viewModel.timeline.nodes[0]?.label).toBe("Business context");
    expect(viewModel.timeline.nodes[1]?.label).toBe("Strategy");
    expect(viewModel.timeline.nodes[2]?.label).toBe("Campaign plan");
    expect(JSON.stringify(viewModel.timeline)).not.toContain("ready_to_publish");
    expect(JSON.stringify(viewModel.timeline)).not.toContain("not_started");
  });

  it("defaults selection to the current workflow node", () => {
    const viewModel = buildMarketingViewModel(baseInput);

    expect(viewModel.timeline.selectedNodeId).toBe(viewModel.timeline.currentNodeId);
    expect(viewModel.timeline.currentNodeId).toBe(milestoneTimelineNodeId("strategy"));
  });

  it("includes deliverable on peer view model", () => {
    const viewModel = buildMarketingViewModel(baseInput);

    expect(viewModel.deliverable.kind).toBeDefined();
    expect(viewModel.deliverable.kind).toBe("empty");
  });

  it("respects explicit timeline selection for deliverable", () => {
    const selectedId = milestoneTimelineNodeId("knowledge");
    const viewModel = buildMarketingViewModel({
      ...baseInput,
      selectedTimelineNodeId: selectedId,
    });

    expect(viewModel.timeline.selectedNodeId).toBe(selectedId);
    expect(viewModel.deliverable.kind).toBe("document");
  });
});
