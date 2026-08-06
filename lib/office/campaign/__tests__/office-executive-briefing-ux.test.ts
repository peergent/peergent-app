import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(process.cwd());
const read = (relativePath: string) => readFileSync(join(repoRoot, relativePath), "utf8");

describe("office executive briefing UX polish", () => {
  it("renders one management summary by default instead of slideshow navigation", () => {
    const review = read("features/office/campaign/OfficeExecutiveCampaignReview.tsx");
    const summary = read("features/office/campaign/OfficeExecutiveBriefingSummary.tsx");

    expect(review).toContain("OfficeExecutiveBriefingSummary");
    expect(review).toContain("OfficeExecutiveBriefingInspector");
    expect(review).not.toContain("ExecutiveCampaignBriefingPanel");
    expect(summary).toContain('data-testid="office-executive-briefing-summary"');
    expect(summary).not.toContain("1 /");
    expect(summary).not.toContain("Vorige");
    expect(summary).not.toContain("Volgende");
  });

  it("places approval CTA inside the briefing card footer", () => {
    const review = read("features/office/campaign/OfficeExecutiveCampaignReview.tsx");
    const summary = read("features/office/campaign/OfficeExecutiveBriefingSummary.tsx");

    expect(review).toContain("approvalSlot");
    expect(review).toContain('data-testid="office-approve-campaign-btn"');
    expect(summary).toContain("<footer");
  });

  it("shows top decision, execution plan, customer needs, and risks in summary", () => {
    const summary = read("features/office/campaign/OfficeExecutiveBriefingSummary.tsx");
    expect(summary).toContain('data-testid="briefing-primary-advice"');
    expect(summary).toContain('data-testid="briefing-execution-stepper"');
    expect(summary).toContain('data-testid="briefing-section-customer-needs"');
    expect(summary).toContain('testId="briefing-section-risks"');
  });

  it("opens detailed inspector via Alles bekijken with drill-down panel", () => {
    const summary = read("features/office/campaign/OfficeExecutiveBriefingSummary.tsx");
    const inspector = read("features/office/campaign/OfficeExecutiveBriefingInspector.tsx");

    expect(summary).toContain('data-testid="office-briefing-view-all-btn"');
    expect(inspector).toContain("ExecutiveCampaignBriefingPanel");
    expect(inspector).toContain('data-testid="office-executive-briefing-inspector"');
    expect(inspector).toContain('role="dialog"');
    expect(inspector).toContain("ExecutiveCampaignBriefingPanel");
  });

  it("keeps technical workflow collapsed and suppresses duplicate Emma intro", () => {
    const core = read("features/office/campaign/CampaignWorkspaceCore.tsx");
    expect(core).toContain("executiveBriefingActive");
    expect(core).toContain("Bekijk onderliggende analyse");
    expect(core).toContain("!executiveBriefingActive");
  });

  it("includes responsive max-width and accessibility attributes", () => {
    const summary = read("features/office/campaign/OfficeExecutiveBriefingSummary.tsx");
    expect(summary).toContain("max-w-[720px]");
    expect(summary).toContain("aria-expanded");
    expect(summary).toContain("aria-controls");
    expect(summary).toContain('data-testid="briefing-status-indicator"');
  });

  it("preserves scheduled campaign briefing readiness path", () => {
    const readiness = read(
      "lib/peer-experience/marketing/campaign-review/build-campaign-executive-briefing.ts"
    );
    expect(readiness).toContain("brainReady");
    expect(readiness).not.toContain('some((i) => i.status === "in_progress"');
  });
});
