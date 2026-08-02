import { describe, expect, it } from "vitest";
import { resolveOptimizationPanelOpen } from "@/features/office/campaign/useCampaignWorkspaceActions";

describe("resolveOptimizationPanelOpen", () => {
  it("opens when view=results is present", () => {
    expect(resolveOptimizationPanelOpen("results", false)).toBe(true);
  });

  it("opens when manually requested without a query param", () => {
    expect(resolveOptimizationPanelOpen(null, true)).toBe(true);
  });

  it("stays closed without param or manual request", () => {
    expect(resolveOptimizationPanelOpen(null, false)).toBe(false);
    expect(resolveOptimizationPanelOpen("work", false)).toBe(false);
  });

  it("closes after manual dismiss even if an unrelated view param remains", () => {
    expect(resolveOptimizationPanelOpen("work", false)).toBe(false);
  });
});
