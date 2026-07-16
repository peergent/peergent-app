export type WebsiteAnalysisInput = {
  url: string;
};

export type AnalysisStepDefinition = {
  id: string;
  label: string;
  description: string;
  durationMs: number;
};

export type EvidenceCategory =
  | "observed"
  | "likely"
  | "unknown"
  | "requires-more-data";

export type DataSourceId =
  | "website"
  | "analytics"
  | "knowledge"
  | "crm"
  | "operations-scan";

export type QualitativeConfidence = "low" | "moderate" | "high";

export type AssessmentFinding = {
  id: string;
  statement: string;
  category: EvidenceCategory;
  source: DataSourceId;
  evidence?: string;
  enrichmentHint?: string;
};

export type ChapterConfidence = {
  level: QualitativeConfidence;
  reason: string;
};

export type ConfidenceSnapshot = {
  observed: number;
  likely: number;
  unknown: number;
  requiresMoreData: number;
  overall: QualitativeConfidence;
  overallReason: string;
};

export type ChapterEnrichmentSlot = {
  source: DataSourceId;
  label: string;
  status: "connected" | "partial" | "not-connected";
  href?: string;
  unlocks: string[];
};

export type ExecutiveSummaryChapter = {
  conclusion: string;
  rationale: string;
  confidence: ChapterConfidence;
};

export type CompanyDnaChapter = {
  businessType: string;
  targetCustomers: string;
  brandPresentation: string;
  findings: AssessmentFinding[];
  confidence: ChapterConfidence;
};

export type CustomerJourneyChapter = {
  frictionPoints: AssessmentFinding[];
  opportunities: AssessmentFinding[];
  confidence: ChapterConfidence;
};

export type MarketingGrowthChapter = {
  observed: AssessmentFinding[];
  likely: AssessmentFinding[];
  unknown: AssessmentFinding[];
  enrichmentSlots: ChapterEnrichmentSlot[];
  confidence: ChapterConfidence;
};

export type OperationsArea = {
  id: string;
  name: string;
  findings: AssessmentFinding[];
};

export type OperationsChapter = {
  areas: OperationsArea[];
  enrichmentSlots: ChapterEnrichmentSlot[];
  confidence: ChapterConfidence;
};

export type WorkforceRecommendation = {
  employeeType: string;
  role: string;
  name: string;
  priority: "high" | "medium" | "optional";
  whyRecommended: string;
  supportingFindings: AssessmentFinding[];
  suggestedObjective: string;
  gradient: string;
};

export type WorkforceRecommendationChapter = {
  recommendations: WorkforceRecommendation[];
  confidence: ChapterConfidence;
};

export type BusinessBrainConclusionChapter = {
  statement: string;
  primaryAction: {
    label: string;
    href?: string;
    onCreatePeerIndex?: number;
  };
  confidence: ChapterConfidence;
};

export type WebsiteIntelligenceAssessment = {
  meta: {
    url: string;
    companyName: string;
    industry: string;
    analyzedAt: string;
    analysisVersion: string;
  };
  confidenceSnapshot: ConfidenceSnapshot;
  executiveSummary: ExecutiveSummaryChapter;
  companyDna: CompanyDnaChapter;
  customerJourney: CustomerJourneyChapter;
  marketingGrowth: MarketingGrowthChapter;
  operations: OperationsChapter;
  workforceRecommendations: WorkforceRecommendationChapter;
  businessBrainConclusion: BusinessBrainConclusionChapter;
};

export type AnalysisProgressCallback = (
  stepId: string,
  stepIndex: number
) => void;

export interface WebsiteAnalyzer {
  readonly steps: AnalysisStepDefinition[];
  analyze(
    input: WebsiteAnalysisInput,
    onProgress: AnalysisProgressCallback
  ): Promise<WebsiteIntelligenceAssessment>;
}

/** @deprecated Use WorkforceRecommendation */
export type RecommendedEmployee = WorkforceRecommendation;
