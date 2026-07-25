import { describe, expect, it } from "vitest";
import { MARKETING_PEER_TABS } from "../navigation/marketing-peer-links";

describe("Marketing workspace routing", () => {
  it("lists nine tabs in approved order", () => {
    expect(MARKETING_PEER_TABS.map((t) => t.id)).toEqual([
      "overview",
      "review",
      "work",
      "content",
      "performance",
      "connections",
      "responsibilities",
      "knowledge",
      "settings",
    ]);
  });

  it("includes connections route", () => {
    const connections = MARKETING_PEER_TABS.find((t) => t.id === "connections");
    expect(connections?.href("emma")).toBe("/team/emma/connections");
  });
});
