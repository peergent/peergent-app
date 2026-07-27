import { describe, expect, it } from "vitest";

import {
  getMarketingCampaignCopy,
  resolveMarketingCampaignLocale,
} from "@/lib/i18n/marketing-campaign-copy";

describe("marketing campaign copy", () => {
  it("returns English strings by default", () => {
    const copy = getMarketingCampaignCopy("en");
    expect(copy.statusWaitingReview).toBe("Waiting for your review");
    expect(copy.reviewPrimaryCta(3)).toBe("Review 3 items");
    expect(copy.reviewPrimaryCta(1)).toBe("Review 1 item");
  });

  it("returns Dutch translations", () => {
    const copy = getMarketingCampaignCopy("nl");
    expect(copy.statusWaitingReview).toBe("Wacht op jouw beoordeling");
    expect(copy.historyAndDetails).toBe("Geschiedenis en details");
    expect(copy.reviewPrimaryCta(3)).toBe("Bekijk 3 onderdelen");
  });

  it("falls back to English for unknown locale", () => {
    expect(resolveMarketingCampaignLocale("de")).toBe("en");
    expect(resolveMarketingCampaignLocale("nl")).toBe("nl");
  });

  it("interpolates preparation progress safely", () => {
    const en = getMarketingCampaignCopy("en");
    const nl = getMarketingCampaignCopy("nl");
    expect(en.preparationProgress(2, 5)).toBe("Preparation: 2 of 5 ready");
    expect(nl.preparationProgress(2, 5)).toBe("Voorbereiding: 2 van 5 klaar");
  });
});
