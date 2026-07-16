export type {
  AnalysisProgressCallback,
  AnalysisStepDefinition,
  AutomationOpportunity,
  RecommendedEmployee,
  WebsiteAnalysisInput,
  WebsiteAnalyzer,
  WebsiteInsight,
  WebsiteIntelligenceReport,
} from "./types";

export { ANALYSIS_STEPS, demoWebsiteAnalyzer } from "./demo-analyzer";

/**
 * Replace `demoWebsiteAnalyzer` with a real implementation when AI analysis
 * is connected (e.g. server action, API route, or Supabase Edge Function).
 */
export { demoWebsiteAnalyzer as websiteAnalyzer } from "./demo-analyzer";
