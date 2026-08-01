import { describe, expect, it } from "vitest";
import {
  demoPreviewStatsForChannel,
  previewStatsForContent,
} from "@/lib/office/content/demo-preview-stats";

describe("demo preview stats isolation", () => {
  it("returns demo metrics for demo workspaces", () => {
    const stats = previewStatsForContent({
      isDemo: true,
      channelId: "linkedin",
      locale: "nl",
    });
    expect(stats.length).toBeGreaterThan(0);
    expect(stats[0]?.label).toBeTruthy();
  });

  it("returns empty stats for live workspaces", () => {
    const stats = previewStatsForContent({
      isDemo: false,
      channelId: "linkedin",
      locale: "nl",
    });
    expect(stats).toEqual([]);
  });

  it("never leaks demo stats when isDemo is false regardless of channel", () => {
    for (const channel of ["linkedin", "google_ads", "newsletter", "instagram"]) {
      expect(
        previewStatsForContent({ isDemo: false, channelId: channel, locale: "en" })
      ).toEqual([]);
    }
  });

  it("demo helper still returns fictional metrics directly", () => {
    expect(demoPreviewStatsForChannel("linkedin", "nl").length).toBeGreaterThan(0);
  });
});
