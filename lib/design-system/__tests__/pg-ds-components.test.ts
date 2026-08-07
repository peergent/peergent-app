import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DS_ROOT = resolve(process.cwd(), "components/design-system");
const CSS = readFileSync(resolve(process.cwd(), "app/themes/peergent-ds-components.css"), "utf8");
const INDEX = readFileSync(resolve(process.cwd(), "components/design-system/index.ts"), "utf8");

function readComponent(name: string) {
  return readFileSync(resolve(DS_ROOT, name), "utf8");
}

describe("Peergent Design System v2 (PX-4)", () => {
  it("loads canonical DS CSS utilities in globals", () => {
    const globals = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
    expect(globals.includes("peergent-ds-components.css")).toBe(true);
    expect(CSS.includes(".pg-ds-card")).toBe(true);
    expect(CSS.includes(".pg-ds-hero-band")).toBe(true);
    expect(CSS.includes("--pg-action-primary")).toBe(true);
  });

  it("exports all PX-4 card and chip components from index", () => {
    const expected = [
      "PgHeroCard",
      "PgHeroBand",
      "PgMetricCard",
      "PgStatusChip",
      "PgBriefingCard",
      "PgApprovalCard",
      "PgChartCard",
      "PgRecommendationCard",
      "PgOpportunityCard",
      "PgActivityCard",
      "PgPerformanceCard",
      "PgEmptyStateCard",
      "PgTimelineCard",
      "PgAlertCard",
      "PgAutomationChip",
      "PgPeerStatusChip",
      "PgSparkline",
    ];
    for (const name of expected) {
      expect(INDEX.includes(name)).toBe(true);
    }
  });

  it("PgMetric wires counter animation hook", () => {
    const source = readComponent("PgMetric.tsx");
    expect(source.includes("useCounterAnimation")).toBe(true);
    expect(source.includes("animateCounter")).toBe(true);
  });

  it("PgMetricCard passes animateCounter to PgMetric", () => {
    const source = readComponent("PgMetricCard.tsx");
    expect(source.includes("animateCounter={animateCounter}")).toBe(true);
    expect(source.includes("pg-ds-card")).toBe(true);
  });

  it("PgTrendChart supports chart draw animation class", () => {
    const source = readComponent("PgTrendChart.tsx");
    expect(source.includes("pg-ds-chart-area")).toBe(true);
    expect(source.includes("variant")).toBe(true);
    expect(source.includes("endpointGlow")).toBe(true);
    expect(source.includes("animate")).toBe(true);
  });

  it("PgBriefingCard uses accordion sections", () => {
    const source = readComponent("PgBriefingCard.tsx");
    expect(source.includes("PgAccordion")).toBe(true);
    expect(source.includes("PgAccordionSection")).toBe(true);
  });

  it("PgApprovalCard aliases PgDecisionCard", () => {
    const source = readComponent("PgApprovalCard.tsx");
    expect(source.includes("./PgDecisionCard")).toBe(true);
  });

  it("PgTimelineCard uses native disclosure", () => {
    const source = readComponent("PgTimelineCard.tsx");
    expect(source.includes("<details")).toBe(true);
    expect(source.includes("<summary")).toBe(true);
  });

  it("PgEmptyStateCard delegates to peer voice empty state", () => {
    const source = readComponent("PgEmptyStateCard.tsx");
    expect(source.includes("PgEmptyState")).toBe(true);
    expect(source.includes("<article")).toBe(true);
  });

  it("motion utilities honor reduced motion in CSS", () => {
    expect(CSS.includes("prefers-reduced-motion: reduce")).toBe(true);
  });
});
