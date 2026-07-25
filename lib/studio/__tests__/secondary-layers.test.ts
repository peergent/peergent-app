import { describe, expect, it } from "vitest";
import { capConversationMessages, CONVERSATION_LEDGE_POLICY } from "@/lib/studio/conversation-ledge-policy";
import { resolveArchiveSelection } from "@/lib/studio/is-archive-selection";
import type { TimelineViewModel } from "@/lib/peer-experience";

describe("conversation ledge policy", () => {
  it("caps visible messages so the ledge stays subordinate to the table", () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      id: `m-${index}`,
      role: "user" as const,
      content: `Message ${index}`,
      timestamp: new Date().toISOString(),
    }));

    const capped = capConversationMessages(messages);
    expect(capped).toHaveLength(CONVERSATION_LEDGE_POLICY.maxVisibleMessages);
    expect(capped[0]?.content).toBe("Message 5");
  });

  it("never uses a backdrop — table remains visually primary", () => {
    expect(CONVERSATION_LEDGE_POLICY.useBackdrop).toBe(false);
  });
});

describe("resolveArchiveSelection", () => {
  const timeline: TimelineViewModel = {
    nodes: [
      { id: "milestone:strategy", label: "Strategy", progress: "completed", region: "strategy" },
      { id: "content:post", label: "Post", progress: "current", region: "drafts" },
    ],
    currentNodeId: "content:post",
    selectedNodeId: "milestone:strategy",
  };

  it("marks browsing a completed chapter as archive", () => {
    expect(resolveArchiveSelection(timeline)).toEqual({
      active: true,
      label: "Strategy",
    });
  });

  it("is inactive when viewing the current chapter", () => {
    expect(
      resolveArchiveSelection({
        ...timeline,
        selectedNodeId: "content:post",
      })
    ).toEqual({ active: false });
  });
});
