import type { StrategicKpi, StrategyConfidence } from "./brain-types";
import { enforceStrategyConfidenceCeiling } from "./strategy-confidence";

export function buildKpiFramework(input: {
  projectObjective?: string;
  upstreamConfidence: StrategyConfidence;
}): StrategicKpi[] {
  const kpis: StrategicKpi[] = [
    {
      name: "Qualified Leads",
      category: "acquisition",
      purpose: "Measure pipeline contribution from marketing",
      primaryOrSecondary: "primary",
      targetDirection: "increase",
      baseline: null,
      target: null,
      measurementSource: "CRM / marketing automation",
      reviewCadence: "weekly",
      decisionThreshold: "Review channel mix if qualified lead rate drops week-over-week",
    },
    {
      name: "Cost Per Acquisition",
      category: "efficiency",
      purpose: "Ensure spend efficiency across selected channels",
      primaryOrSecondary: "secondary",
      targetDirection: "decrease",
      baseline: null,
      target: null,
      measurementSource: "Ad platforms + CRM attribution",
      reviewCadence: "monthly",
      decisionThreshold: null,
    },
    {
      name: "Conversion Rate",
      category: "funnel",
      purpose: "Track intent-to-conversion effectiveness",
      primaryOrSecondary: "primary",
      targetDirection: "increase",
      baseline: null,
      target: null,
      measurementSource: "Analytics + landing page events",
      reviewCadence: "weekly",
      decisionThreshold: "Investigate funnel gaps if conversion stalls",
    },
    {
      name: "Pipeline Influence",
      category: "revenue",
      purpose: "Connect marketing activity to revenue outcomes",
      primaryOrSecondary: "secondary",
      targetDirection: "monitor",
      baseline: null,
      target: null,
      measurementSource: "CRM influenced pipeline reports",
      reviewCadence: "monthly",
      decisionThreshold: null,
    },
  ];

  if (input.projectObjective?.toLowerCase().includes("brand")) {
    kpis.push({
      name: "Brand Search Volume",
      category: "brand",
      purpose: "Monitor brand demand signals",
      primaryOrSecondary: "secondary",
      targetDirection: "monitor",
      baseline: null,
      target: null,
      measurementSource: "Search console / brand monitoring",
      reviewCadence: "monthly",
      decisionThreshold: null,
    });
  }

  return kpis.map((k) => ({
    ...k,
    // KPIs intentionally omit fabricated numeric targets
  }));
}

export function assertNoFabricatedKpiTargets(kpis: readonly StrategicKpi[]): void {
  for (const k of kpis) {
    if (k.target && /\d/.test(k.target) && k.baseline === null) {
      throw new Error(`Fabricated KPI target without baseline: ${k.name}`);
    }
  }
}
