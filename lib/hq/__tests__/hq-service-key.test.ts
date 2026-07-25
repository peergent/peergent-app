import { describe, expect, it } from "vitest";
import { getHqServiceKey } from "@/lib/hq/hq-service-key";

describe("getHqServiceKey", () => {
  it("uses exact PeerRow.role as the canonical classification", () => {
    expect(getHqServiceKey({ role: "Sales", name: "Tjerk de commerciële" })).toBe("sales");
    expect(getHqServiceKey({ role: "Marketing", name: "Emma" })).toBe("marketing");
    expect(getHqServiceKey({ role: "Finance", name: "Fin" })).toBe("finance");
    expect(getHqServiceKey({ role: "Support", name: "Help" })).toBe("support");
    expect(getHqServiceKey({ role: "Planning", name: "Planner" })).toBe("operations");
  });

  it("maps controlled fallback keywords without defaulting unknown roles to sales", () => {
    expect(getHqServiceKey({ role: "Custom", name: "Klantenservice bot" })).toBe("support");
    expect(getHqServiceKey({ role: "Assistant", name: "Campaign manager" })).toBe("marketing");
    expect(getHqServiceKey({ role: "Assistant", name: "Random assistant" })).toBeNull();
    expect(getHqServiceKey({ role: "Custom", name: "Yavanna Sales" })).toBe("sales");
  });

  it("excludes Custom peers without a recognized service signal", () => {
    expect(getHqServiceKey({ role: "Custom", name: "General helper" })).toBeNull();
  });
});
