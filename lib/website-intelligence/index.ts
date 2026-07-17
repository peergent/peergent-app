export type {
  AnalysisProgressCallback,
  AnalysisStepDefinition,
  AssessmentFinding,
  BusinessBrainConclusionChapter,
  ChapterConfidence,
  ChapterEnrichmentSlot,
  CompanyDnaChapter,
  ConfidenceSnapshot,
  CustomerJourneyChapter,
  DataSourceId,
  EvidenceCategory,
  ExecutiveSummaryChapter,
  MarketingGrowthChapter,
  OperationsChapter,
  QualitativeConfidence,
  WebsiteAnalysisInput,
  WebsiteAnalyzer,
  WebsiteIntelligenceAssessment,
  WorkforceRecommendation,
  WorkforceRecommendationChapter,
} from "./types";

/** @deprecated Use WorkforceRecommendation */
export type { WorkforceRecommendation as RecommendedEmployee } from "./types";

export { ANALYSIS_STEPS, demoWebsiteAnalyzer } from "./demo-analyzer";
export {
  buildConfidenceSnapshot,
  buildDemoAssessment,
  collectAllFindings,
} from "./demo-assessment";

export { buildBusinessBrainReasoningViewModel, buildBusinessBrainViewModel } from "./assessment-presenter";
export type {
  BusinessBrainReasoningViewModel,
  BusinessBrainViewModel,
  ReasoningConfidence,
  TeamMemberView,
} from "./assessment-presenter";

/**
 * Replace `demoWebsiteAnalyzer` with a real implementation when AI analysis
 * is connected (e.g. server action, API route, or Supabase Edge Function).
 */
export { demoWebsiteAnalyzer as websiteAnalyzer } from "./demo-analyzer";
